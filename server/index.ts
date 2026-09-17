import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

type Row = Record<string, unknown>;
type Graph = { nodes: Row[]; edges: Row[]; files: Row[]; source: string; warning?: string };
let active: { db: DatabaseSync; source: string } | undefined;

function json(res: import('node:http').ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

function readGraph(db: DatabaseSync, source: string, warning?: string): Graph {
  const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Row[]).map((r) => String(r.name));
  if (!tables.includes('nodes') || !tables.includes('edges')) {
    throw new Error('This database does not contain the expected CodeGraph nodes/edges tables.');
  }
  const nodes = db.prepare('SELECT * FROM nodes LIMIT 5000').all() as Row[];
  const nodeIds = new Set(nodes.map((node) => String(node.id)));
  const edges = (db.prepare('SELECT * FROM edges LIMIT 15000').all() as Row[]).filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)));
  const files = tables.includes('files') ? db.prepare('SELECT * FROM files LIMIT 5000').all() as Row[] : [];
  return { nodes, edges, files, source, warning };
}

async function tryPublicApi(projectPath: string): Promise<string | undefined> {
  try {
    const imported = await import('@colbymchenry/codegraph');
    const CodeGraph = (imported.default ?? imported.CodeGraph) as unknown as { open(path: string): Promise<{ close(): void }> };
    const graph = await CodeGraph.open(projectPath);
    graph.close();
    return 'Validated with CodeGraph.open(); graph rows are read read-only for broad visualization.';
  } catch {
    return undefined;
  }
}

async function openDatabase(dbPath: string, source: string, projectPath?: string) {
  if (!existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`);
  active?.db.close();
  const warning = projectPath ? await tryPublicApi(projectPath) : 'Direct database mode: using the documented CodeGraph schema as a compatibility fallback.';
  active = { db: new DatabaseSync(dbPath, { readOnly: true }), source };
  return readGraph(active.db, source, warning);
}

async function body(req: import('node:http').IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/api/graph') {
      if (!active) return json(res, 400, { error: 'Open a project or database first.' });
      return json(res, 200, readGraph(active.db, active.source));
    }
    if (req.method === 'POST' && url.pathname === '/api/open') {
      const input = JSON.parse((await body(req)).toString('utf8')) as { path?: string };
      if (!input.path) throw new Error('Provide a project root or database path.');
      const candidate = input.path.endsWith('.db') ? input.path : path.join(input.path, '.codegraph', 'codegraph.db');
      return json(res, 200, await openDatabase(candidate, input.path, input.path.endsWith('.db') ? undefined : input.path));
    }
    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const uploadDir = path.resolve('.runtime');
      await mkdir(uploadDir, { recursive: true });
      const uploadPath = path.join(uploadDir, 'uploaded-codegraph.db');
      await writeFile(uploadPath, await body(req));
      return json(res, 200, await openDatabase(uploadPath, 'uploaded database'));
    }
    if (req.method === 'GET') {
      const filePath = url.pathname === '/' ? path.resolve('dist/index.html') : path.resolve('dist', `.${url.pathname}`);
      if (existsSync(filePath)) {
        res.writeHead(200, { 'content-type': filePath.endsWith('.js') ? 'text/javascript' : filePath.endsWith('.css') ? 'text/css' : 'text/html' });
        return res.end(await readFile(filePath));
      }
    }
    json(res, 404, { error: 'Not found' });
  } catch (error) {
    json(res, 400, { error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.listen(8787, () => console.log('CodeGraph viewer server listening on http://localhost:8787'));
