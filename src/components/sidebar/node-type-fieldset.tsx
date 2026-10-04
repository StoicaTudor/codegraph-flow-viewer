import {NODE_CATEGORIES} from '../../types/graph.js'
import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

export const NodeTypeFieldset = () => {
  const {graph, viewer, dispatch} = useGraphViewerContext()

  return (
      <fieldset>
        <legend>Node types</legend>
        {NODE_CATEGORIES.map(({value, label}) => (
            <label className="check" key={value}>
              <input
                  className="node-type"
                  type="checkbox"
                  value={value}
                  checked={viewer.nodeTypes.includes(value)}
                  disabled={!graph}
                  onChange={() => dispatch({type: 'TOGGLE_NODE_TYPE', value})}
              />{' '}
              {label}
            </label>
        ))}
      </fieldset>
  )
}
