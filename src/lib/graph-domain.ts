import type {FileRecord, GraphEdge, GraphNode, NodeCategory} from '../types/graph.js'

/*
  Attempt to unify multiple programming languages into the same common "language".
  Not everything is supported - this must be extended in the future.
  Example: some programming languages calls its methods functions. Some do have constructors. We unify everything into "methods".
 */
export const nodeCategory = (node: GraphNode): NodeCategory => {
  const kind = (node.kind ?? '').toLowerCase()
  if (kind === 'file' || kind === 'module_file') return 'file'
  if (kind === 'method' || kind === 'function' || kind === 'constructor') return 'method'
  if (kind.includes('field')) return 'field'
  if (kind === 'property') return 'property'
  if (kind === 'variable' || kind === 'constant') return 'variable'
  if (kind === 'namespace' || kind === 'module' || kind === 'package') return 'namespace'
  if (kind.includes('import')) return 'import'
  if (kind === 'class' || kind === 'interface' || kind === 'enum' || kind === 'struct' || kind === 'trait') return 'class'
  if (kind === 'type' || kind === 'type_alias' || kind === 'typedef') return 'type'
  return 'other'
}

export const normalizedPath = (value: string) => {
  return value.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '')
}

export const directoryForNode = (node: GraphNode) => {
  const filePath = normalizedPath(node.file_path ?? '')
  const separator = filePath.lastIndexOf('/')
  return separator > 0 ? filePath.slice(0, separator) : ''
}

export const isExcludedDirectory = (node: GraphNode, excluded: Set<string>) => {
  const directory = directoryForNode(node)
  return [...excluded].some((value) => directory === value || directory.startsWith(`${value}/`))
}

export const isGeneratedNode = (node: GraphNode, record?: FileRecord) => {
  const value = node.generated ?? node.is_generated ?? record?.generated
  const metadata = `${node.file_path ?? ''} ${node.name} ${node.signature ?? ''} ${node.docstring ?? ''}`
  return Boolean(value) || /(^|[\\/_.-])(generated|gen)([\\/_.-]|$)|lombok|@getter|@setter|@data|@builder/i.test(metadata)
}

/*
   Try to guess if a node is external: Java's lombok, JS's node_modules, etc
   Not everything is supported - this must be extended in the future.
 */
export const isExternalNode = (node: GraphNode, source: string) => {
  const kind = (node.kind ?? '').toLowerCase()
  const filePath = node.file_path ?? ''
  return (
      Boolean(node.external ?? node.is_external) ||
      kind === 'external' ||
      /(^|[\\/])(node_modules|vendor|third_party|third-party|external|dependencies|deps)([\\/]|$)/i.test(filePath) ||
      (filePath.startsWith('/') && Boolean(source) && !filePath.startsWith(source))
  )
}

export const focusNodeIds = (edges: GraphEdge[], nodeId: string, depth: number) => {
  const ids = new Set([nodeId])
  let frontier = new Set([nodeId])
  for (let level = 0; level < depth; level += 1) {
    const next = new Set<string>()
    for (const edge of edges) {
      if (frontier.has(edge.source) && !ids.has(edge.target)) next.add(edge.target)
      if (frontier.has(edge.target) && !ids.has(edge.source)) next.add(edge.source)
    }
    next.forEach((id) => ids.add(id))
    frontier = next
    if (!frontier.size) break
  }
  return ids
}

export const maximumFocusDepth = (edges: GraphEdge[], nodeId: string) => {
  let depth = 0
  let frontier = new Set([nodeId])
  const visited = new Set(frontier)
  while (frontier.size) {
    const next = new Set<string>()
    for (const edge of edges) {
      if (frontier.has(edge.source) && !visited.has(edge.target)) next.add(edge.target)
      if (frontier.has(edge.target) && !visited.has(edge.source)) next.add(edge.source)
    }
    if (!next.size) break
    next.forEach((id) => visited.add(id))
    frontier = next
    depth += 1
  }
  return Math.max(1, depth)
}
