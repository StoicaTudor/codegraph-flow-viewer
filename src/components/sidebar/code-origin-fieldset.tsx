import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

export const CodeOriginFieldset = () => {
  const {graph, viewer, dispatch} = useGraphViewerContext()

  return (
      <>
        <fieldset>
          <legend>Code origin</legend>
          <label className="check">
            <input
                type="checkbox"
                checked={viewer.includeExternal}
                disabled={!graph}
                onChange={(event) => dispatch({type: 'SET_INCLUDE_EXTERNAL', value: event.target.checked})}
            />{' '}
            Include external code
          </label>
          <label className="check">
            <input
                type="checkbox"
                checked={viewer.includeGenerated}
                disabled={!graph}
                onChange={(event) => dispatch({type: 'SET_INCLUDE_GENERATED', value: event.target.checked})}
            />{' '}
            Include generated code
          </label>
        </fieldset>
        <label className="check">
          <input
              type="checkbox"
              checked={viewer.fullPath}
              disabled={!graph}
              onChange={(event) => dispatch({type: 'SET_FULL_PATH', value: event.target.checked})}
          />{' '}
          Show full package + file path
        </label>
      </>
  )
}
