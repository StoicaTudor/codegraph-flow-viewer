import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import {maximumFocusDepth} from '../../lib/graph-domain.js'

export const FocusDepthControl = () => {
  const {graph, selected, currentFocusDepth, setFocusDepth, focusNode, persistView} = useGraphViewerContext()
  if (!graph || !selected) return null

  const maximumDepth = maximumFocusDepth(graph.edges, selected.id)
  const depth = currentFocusDepth(selected.id)

  return (
      <>
        <label>
          Neighbour depth
          <input
              type="range"
              min={1}
              max={maximumDepth}
              value={depth}
              onChange={(event) => setFocusDepth(selected.id, Number(event.target.value))}
              onMouseUp={() => {
                focusNode(selected.id)
                persistView()
              }}
              onKeyUp={(event) => {
                if (event.key.startsWith('Arrow')) {
                  focusNode(selected.id)
                  persistView()
                }
              }}
          />
          <span>
          {depth} / {maximumDepth}
        </span>
        </label>
        <button
            type="button"
            onClick={() => {
              focusNode(selected.id)
              persistView()
            }}
        >
          Focus this node
        </button>
      </>
  )
}
