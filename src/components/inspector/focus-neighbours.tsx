import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import {focusNodeIds} from '../../lib/graph-domain.js'

export const FocusNeighbours = () => {
  const {graph, selected, currentFocusDepth, selectNode, persistView} = useGraphViewerContext()
  if (!graph || !selected) return null

  const depth = currentFocusDepth(selected.id)
  const nearby = focusNodeIds(graph.edges, selected.id, depth)
  const nearbyNodes = graph.nodes.filter((candidate) => nearby.has(candidate.id))

  return (
      <>
        <h3>Focused neighbourhood ({nearbyNodes.length})</h3>
        <div id="focus-neighbours">
          {nearbyNodes.map((candidate) => (
              <button
                  key={candidate.id}
                  className="focus-neighbour"
                  type="button"
                  onClick={() => {
                    selectNode(candidate.id)
                    persistView()
                  }}
              >
                {candidate.name} <small>({candidate.kind ?? 'unknown'})</small>
              </button>
          ))}
        </div>
      </>
  )
}
