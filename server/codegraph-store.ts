import {existsSync} from 'node:fs'
import {DatabaseSync} from 'node:sqlite'
import type {Graph, Row} from './types.js'

type ActiveDatabase = { db: DatabaseSync; source: string }

export class CodeGraphStore {
  private active: ActiveDatabase | undefined

  async open(dbPath: string, source: string, projectPath?: string) {
    if (!existsSync(dbPath)) throw new Error(`Database not found: ${dbPath}`)
    const warning = projectPath ? await this.validateProject(projectPath) : 'Direct database mode: using the documented CodeGraph schema as a compatibility fallback.'
    this.active?.db.close()
    this.active = {db: new DatabaseSync(dbPath, {readOnly: true}), source}
    return this.read(warning)
  }

  read(warning?: string): Graph {
    if (!this.active) throw new Error('Open a project or database first.')
    const {db, source} = this.active
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Row[]).map((row) => String(row.name))
    if (!tables.includes('nodes') || !tables.includes('edges')) throw new Error('This database does not contain the expected CodeGraph nodes/edges tables.')
    const nodes = db.prepare('SELECT * FROM nodes').all() as Row[]
    const nodeIds = new Set(nodes.map((node) => String(node.id)))
    const edges = (db.prepare('SELECT * FROM edges').all() as Row[]).filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
    const files = tables.includes('files') ? db.prepare('SELECT * FROM files').all() as Row[] : []
    return {nodes, edges, files, source, warning}
  }

  hasActiveDatabase() {
    return Boolean(this.active)
  }

  private async validateProject(projectPath: string) {
    try {
      const imported = await import('@colbymchenry/codegraph')
      const CodeGraph = (imported.default ?? imported.CodeGraph) as unknown as { open(path: string): Promise<{ close(): void }> }
      const graph = await CodeGraph.open(projectPath)
      graph.close()
      return 'Validated with CodeGraph.open() graph rows are read-only for broad visualization.'
    } catch {
      return undefined
    }
  }
}
