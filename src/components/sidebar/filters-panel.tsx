import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

export const FiltersPanel = () => {
  const {graph, viewer, dispatch, edgeKindOptions} = useGraphViewerContext()
  const disabled = !graph

  return (
      <>
        <label>
          Search symbols
          <input
              disabled={disabled}
              placeholder="name, file, qualified name"
              value={viewer.search}
              onChange={(event) => dispatch({type: 'SET_SEARCH', value: event.target.value})}
          />
        </label>
        <label>
          Edge type
          <select disabled={disabled} value={viewer.edgeKind} onChange={(event) => dispatch({type: 'SET_EDGE_KIND', value: event.target.value})}>
            <option value="all">All relationships</option>
            {edgeKindOptions.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
            ))}
          </select>
        </label>
        <label>
          Relationship filter
          <select
              disabled={disabled}
              value={viewer.relationshipFilter}
              onChange={(event) => dispatch({type: 'SET_RELATIONSHIP_FILTER', value: event.target.value})}
          >
            <option value="all">All nodes</option>
            <option value="connected">Nodes with relationships</option>
            <option value="isolated">Nodes without relationships</option>
          </select>
        </label>
      </>
  )
}
