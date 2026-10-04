export type GraphNode = {
  id: string
  name: string
  qualified_name?: string
  kind?: string
  file_path?: string
  language?: string
  start_line?: number
  end_line?: number
  docstring?: string
  signature?: string
  generated?: boolean | number
  is_generated?: boolean | number
  external?: boolean | number
  is_external?: boolean | number
}

export type GraphEdge = { source: string; target: string; kind?: string; line?: number };

export type FileRecord = Record<string, unknown>

export type Graph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  files: FileRecord[]
  source: string
  warning?: string
}

export type NodeCategory =
    | 'file'
    | 'method'
    | 'field'
    | 'property'
    | 'variable'
    | 'namespace'
    | 'import'
    | 'class'
    | 'type'
    | 'other'

export const NODE_CATEGORIES: { value: NodeCategory; label: string }[] = [
  {value: 'file', label: 'File'},
  {value: 'method', label: 'Method'},
  {value: 'field', label: 'Field'},
  {value: 'namespace', label: 'Namespace'},
  {value: 'import', label: 'Import'},
  {value: 'class', label: 'Class'},
  {value: 'type', label: 'Type'},
  {value: 'variable', label: 'Variable'},
  {value: 'property', label: 'Property'},
  {value: 'other', label: 'Other'},
]

export type Point = { x: number; y: number };

export type Camera = { x: number; y: number; scale: number };
