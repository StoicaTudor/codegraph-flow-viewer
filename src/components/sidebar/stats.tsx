import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

export const Stats = () => {
  const {graph, filtered} = useGraphViewerContext()
  if (!graph) return <div className="stats"/>
  return (
      <div className="stats">
        {filtered.nodes.length} nodes · {filtered.edges.length} edges · {graph.files.length} files
      </div>
  )
}
