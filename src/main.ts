import './styles.css';

type Node = { id: string; name: string; qualified_name?: string; kind?: string; file_path?: string; language?: string; start_line?: number; end_line?: number; docstring?: string; signature?: string };
type Edge = { source: string; target: string; kind?: string; line?: number };
type Graph = { nodes: Node[]; edges: Edge[]; files: Record<string, unknown>[]; source: string; warning?: string };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header><div><p class="eyebrow">LOCAL CODE INTELLIGENCE</p><h1>CodeGraph Flow Viewer</h1><p class="subtle">Explore symbols, imports, calls, and inheritance from a local CodeGraph index.</p></div><div id="status" class="status">No database loaded</div></header>
  <main>
    <aside class="controls">
      <label>Project root or <code>codegraph.db</code><input id="path" placeholder="/path/to/project or /path/to/codegraph.db" /></label>
      <button id="open">Open path</button>
      <label class="file-label">Or choose a database file<input id="file" type="file" accept=".db,application/vnd.sqlite3" /></label>
      <hr />
      <label>Search symbols<input id="search" placeholder="name, file, qualified name" disabled /></label>
      <label>Edge type<select id="edge-kind" disabled><option value="all">All relationships</option></select></label>
      <label>Maximum nodes<input id="limit" type="range" min="20" max="300" value="120" disabled /><span id="limit-value">120</span></label>
      <p class="hint">Drag nodes to arrange them. Click a node to inspect it. Double-click a node to focus its local neighborhood.</p>
      <div id="stats" class="stats"></div>
    </aside>
    <section class="workspace"><div id="message" class="empty">Open a CodeGraph project or database to begin.</div><svg id="graph" role="img" aria-label="CodeGraph dependency graph"></svg></section>
    <aside class="inspector"><h2>Inspector</h2><div id="details" class="empty small">Select a node to see its details.</div></aside>
  </main>`;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const svg = $('graph') as unknown as SVGSVGElement;
let graph: Graph | undefined;
let selected: Node | undefined;
let focusId: string | undefined;
let positions = new Map<string, { x: number; y: number }>();

function setStatus(text: string, bad = false) { const el = $('status'); el.textContent = text; el.className = `status ${bad ? 'bad' : ''}`; }
function showError(error: unknown) { setStatus('Could not load database', true); $('message').textContent = error instanceof Error ? error.message : String(error); $('message').className = 'empty error'; }
function enableControls() { for (const id of ['search', 'edge-kind', 'limit']) $(id).removeAttribute('disabled'); }

function filtered() {
  if (!graph) return { nodes: [], edges: [] as Edge[] };
  const query = ($('search') as HTMLInputElement).value.toLowerCase().trim();
  const kind = ($('edge-kind') as HTMLSelectElement).value;
  let nodes = graph.nodes.filter((node) => !query || [node.name, node.qualified_name, node.file_path].join(' ').toLowerCase().includes(query));
  if (focusId) { const nearby = new Set([focusId]); graph.edges.forEach((edge) => { if (edge.source === focusId) nearby.add(edge.target); if (edge.target === focusId) nearby.add(edge.source); }); nodes = nodes.filter((node) => nearby.has(node.id)); }
  nodes = nodes.slice(0, Number(($('limit') as HTMLInputElement).value));
  const ids = new Set(nodes.map((node) => node.id));
  return { nodes, edges: graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target) && (kind === 'all' || edge.kind === kind)) };
}

function draw() {
  if (!graph) return;
  const { nodes, edges } = filtered(); const width = svg.clientWidth || 900; const height = svg.clientHeight || 700;
  svg.innerHTML = `<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" /></marker></defs>`;
  nodes.forEach((node, index) => { if (!positions.has(node.id)) positions.set(node.id, { x: 90 + (index % 6) * ((width - 160) / 5), y: 80 + (Math.floor(index / 6) % 8) * 75 }); });
  const visiblePositions = new Map(nodes.map((node) => [node.id, positions.get(node.id)!]));
  for (const edge of edges) { const a = visiblePositions.get(edge.source), b = visiblePositions.get(edge.target); if (!a || !b) continue; const line = document.createElementNS('http://www.w3.org/2000/svg', 'line'); line.setAttribute('x1', String(a.x)); line.setAttribute('y1', String(a.y)); line.setAttribute('x2', String(b.x)); line.setAttribute('y2', String(b.y)); line.classList.add('edge'); line.dataset.kind = edge.kind ?? 'unknown'; svg.append(line); }
  for (const node of nodes) { const p = visiblePositions.get(node.id)!; const group = document.createElementNS('http://www.w3.org/2000/svg', 'g'); group.setAttribute('transform', `translate(${p.x},${p.y})`); group.classList.add('node'); if (selected?.id === node.id) group.classList.add('selected'); group.innerHTML = `<rect x="-62" y="-22" width="124" height="44" rx="6" /><text y="-2">${escapeHtml(node.name.slice(0, 19))}</text><text y="14" class="node-kind">${escapeHtml(node.kind ?? 'symbol')}</text>`; group.onclick = () => inspect(node); group.ondblclick = () => { focusId = node.id; draw(); }; svg.append(group); }
  $('stats').textContent = `${nodes.length} nodes · ${edges.length} edges · ${graph.files.length} files`;
}
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]!)); }
function inspect(node: Node) { selected = node; const incoming = graph!.edges.filter((edge) => edge.target === node.id).length; const outgoing = graph!.edges.filter((edge) => edge.source === node.id).length; $('details').innerHTML = `<h3>${escapeHtml(node.name)}</h3><dl><dt>Kind</dt><dd>${escapeHtml(node.kind ?? 'unknown')}</dd><dt>File</dt><dd>${escapeHtml(node.file_path ?? 'unknown')}:${node.start_line ?? '?'}</dd><dt>Language</dt><dd>${escapeHtml(node.language ?? 'unknown')}</dd><dt>Qualified name</dt><dd>${escapeHtml(node.qualified_name ?? node.name)}</dd><dt>Relationships</dt><dd>${incoming} incoming · ${outgoing} outgoing</dd></dl>${node.signature ? `<pre>${escapeHtml(node.signature)}</pre>` : ''}${node.docstring ? `<p>${escapeHtml(node.docstring)}</p>` : ''}`; draw(); }
async function loadResponse(response: Response) { const data = await response.json(); if (!response.ok || data.error) throw new Error(data.error ?? 'Request failed'); graph = data; focusId = undefined; positions = new Map(); enableControls(); const kinds = [...new Set(graph!.edges.map((edge) => edge.kind).filter(Boolean))] as string[]; $('edge-kind').innerHTML = '<option value="all">All relationships</option>' + kinds.map((kind) => `<option>${escapeHtml(kind)}</option>`).join(''); setStatus(`Loaded ${graph!.source}`); $('message').className = 'empty loaded'; $('message').textContent = graph!.warning ?? 'Loaded'; draw(); }
$('open').onclick = async () => { try { setStatus('Opening…'); await loadResponse(await fetch('/api/open', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ path: ($('path') as HTMLInputElement).value.trim() }) })); } catch (error) { showError(error); } };
$('file').onchange = async () => { const file = ($('file') as HTMLInputElement).files?.[0]; if (!file) return; try { setStatus('Uploading…'); await loadResponse(await fetch('/api/upload', { method: 'POST', body: await file.arrayBuffer() })); } catch (error) { showError(error); } };
for (const id of ['search', 'edge-kind', 'limit']) $(id).oninput = () => { if (id === 'limit') $('limit-value').textContent = ($('limit') as HTMLInputElement).value; draw(); };
window.onresize = draw;
