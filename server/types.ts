export type Row = Record<string, unknown>
export type Graph = {
  nodes: Row[]
  edges: Row[]
  files: Row[]
  source: string
  warning?: string
}
