import type {Camera} from './graph.js'

/*
  The actual state of your application
  Can be:
  - serialized to JSON - imported/exported
  - stored in cookies
 */
export type ViewState = {
  // path of the current graph, used to load the graph from the server
  path: string

  //Filters

  // content of the search bar, used to filter nodes and edges (search for symbols, files, qualified names)
  search: string

  // kind of edges to show, used to filter edges (e.g. "calls", "contains", "references")
  edgeKind: string

  // Utility filter for "Nodes with relationships" and "Nodes without relationships"
  // Sometimes we simply do not care about lonely nodes, and we only want to visualize the ones with relationships
  relationshipFilter: string

  // Possibility to ignore specific packages/directories from the canvas - test, utility, etc
  excludedDirectories: string[]

  // Possibility to limit the total nr of nodes you want displayed
  limit: number

  // Currently hardcoded, can be improved in the future, based on the programming language/technology
  // Possibility to display a handful of node types: files, methods, fields, classes, etc
  nodeTypes: string[]

  // Filters for "Include external code", "Include generated code" (ex.: Lombok)
  includeExternal: boolean
  includeGenerated: boolean

  // Flag for showing the "full package + file path"
  fullPath: boolean


  // Misc

  // Sometimes you just want to ignore some specific nodes from the visualization - this property stores the IDs of those specific nodes
  hiddenNodeIds: string[]

  // Possibility to color nodes, for a better visualization
  nodeColors: Record<string, string>


  // When focusing a specific node, you sometimes want to check the relationship between the node itself and the hierarchy of callers
  // This controls how deep you want to visualize the hierarchy
  focusDepths: Record<string, number>

  // Camera position
  positions: Record<string, { x: number; y: number }>

  leftWidth: number
  rightWidth: number
  focusId?: string
  selectedId?: string
  camera: Camera
}
