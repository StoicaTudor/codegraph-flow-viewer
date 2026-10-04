import {createServer} from 'node:http'
import {mkdir, readFile, writeFile} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
import {CodeGraphStore} from './codegraph-store.js'

const json: (res: import('node:http').ServerResponse, status: number, value: unknown) => void = (res: import('node:http').ServerResponse, status: number, value: unknown) => {
  res.writeHead(status, {'content-type': 'application/json charset=utf-8'})
  res.end(JSON.stringify(value))
}

const body: (req: import('node:http').IncomingMessage) => Promise<Buffer<ArrayBuffer>> = async (req: import('node:http').IncomingMessage) => {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

const store = new CodeGraphStore()
const server = createServer({maxHeaderSize: 262144}, async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (req.method === 'GET' && url.pathname === '/api/graph') {
      if (!store.hasActiveDatabase()) return json(res, 400, {error: 'Open a project or database first.'})
      return json(res, 200, store.read())
    }
    if (req.method === 'POST' && url.pathname === '/api/open') {
      const input = JSON.parse((await body(req)).toString('utf8')) as { path?: string }
      if (!input.path) throw new Error('Provide a project root or database path.')
      const candidate = input.path.endsWith('.db') ? input.path : path.join(input.path, '.codegraph', 'codegraph.db')
      return json(res, 200, await store.open(candidate, input.path, input.path.endsWith('.db') ? undefined : input.path))
    }
    if (req.method === 'POST' && url.pathname === '/api/upload') {
      const uploadDir = path.resolve('.runtime')
      await mkdir(uploadDir, {recursive: true})
      const uploadPath = path.join(uploadDir, 'uploaded-codegraph.db')
      await writeFile(uploadPath, await body(req))
      return json(res, 200, await store.open(uploadPath, 'uploaded database'))
    }
    if (req.method === 'GET') {
      const filePath = url.pathname === '/' ? path.resolve('dist/index.html') : path.resolve('dist', `.${url.pathname}`)
      if (existsSync(filePath)) {
        res.writeHead(200, {'content-type': filePath.endsWith('.js') ? 'text/javascript' : filePath.endsWith('.css') ? 'text/css' : 'text/html'})
        return res.end(await readFile(filePath))
      }
    }
    json(res, 404, {error: 'Not found'})
  } catch (error) {
    json(res, 400, {error: error instanceof Error ? error.message : 'Unknown error'})
  }
})

server.listen(8787, () => console.log('CodeGraph viewer server listening on http://localhost:8787'))
