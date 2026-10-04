import type {FileRecord, Graph, GraphNode} from '../types/graph.js'
import {focusNodeIds, isExcludedDirectory, isExternalNode, isGeneratedNode, nodeCategory} from './graph-domain.js'

export type FilterCriteria = {
  search: string
  edgeKind: string
  relationshipFilter: string
  excludedDirectories: Set<string>
  nodeTypes: Set<string>
  includeExternal: boolean
  includeGenerated: boolean
  hiddenNodeIds: Set<string>
  focusId?: string
  focusDepth?: number
  limit: number
}

export const fileRecord = (graph: Graph | undefined, node: GraphNode): FileRecord | undefined => {
  return graph?.files.find((file) => String(file.path ?? '') === String(node.file_path ?? ''))
}

export const fileLabel = (node: GraphNode, fullPath: boolean) => {
  const filePath = node.file_path ?? ''
  if (fullPath) return filePath
  return filePath.split(/[\\/]/).pop() ?? filePath
}

export const collectDirectories = (graph: Graph | undefined) => {
  const directories = new Set<string>();
  for (const node of graph?.nodes ?? []) {
    const parts = (node.file_path ?? '').replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '').split('/');
    for (let index = 1; index < parts.length; index += 1) directories.add(parts.slice(0, index).join('/'));
  }
  return [...directories].sort((a, b) => a.localeCompare(b));
}

export const filterGraph = (graph: Graph | undefined, criteria: FilterCriteria) => {
  if (!graph) return {nodes: [] as GraphNode[], edges: [] as Graph['edges']}
  const query = criteria.search.toLowerCase().trim()
  const relatedNodeIds = new Set(graph.edges.flatMap((edge) => [edge.source, edge.target]))
  let nodes = graph.nodes.filter(
      (node) =>
          !criteria.hiddenNodeIds.has(node.id) &&
          !isExcludedDirectory(node, criteria.excludedDirectories) &&
          (criteria.relationshipFilter === 'all' ||
              (criteria.relationshipFilter === 'connected' && relatedNodeIds.has(node.id)) ||
              (criteria.relationshipFilter === 'isolated' && !relatedNodeIds.has(node.id))) &&
          criteria.nodeTypes.has(nodeCategory(node)) &&
          (criteria.includeExternal || !isExternalNode(node, graph.source)) &&
          (criteria.includeGenerated || !isGeneratedNode(node, fileRecord(graph, node))) &&
          (!query || [node.name, node.qualified_name, node.file_path].join(' ').toLowerCase().includes(query))
  )
  if (criteria.focusId) {
    const nearby = focusNodeIds(graph.edges, criteria.focusId, criteria.focusDepth ?? 1)
    nodes = nodes.filter((node) => nearby.has(node.id))
  }
  nodes = nodes.slice(0, criteria.limit)
  const ids = new Set(nodes.map((node) => node.id))
  const edges = graph.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target) && (criteria.edgeKind === 'all' || edge.kind === criteria.edgeKind))
  return {nodes, edges}
}
