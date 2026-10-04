import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

export const LimitSlider = () => {
  const {graph, viewer, dispatch} = useGraphViewerContext()

  return (
      <label>
        Maximum nodes
        <input
            type="range"
            min={1}
            max={Math.max(1, viewer.maxLimit)}
            value={viewer.limit}
            disabled={!graph}
            onChange={(event) => dispatch({type: 'SET_LIMIT', value: Number(event.target.value)})}
        />
        <span>{viewer.limit}</span>
      </label>
  )
}
