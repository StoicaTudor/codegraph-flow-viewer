import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import {directoryForNode} from '../../lib/graph-domain.js'
import {FocusDepthControl} from "./focus-depth-control.js";
import {FocusNeighbours} from "./focus-neighbours.js";

export const Inspector = () => {
  const {graph, selected, excludeDirectory, persistView} = useGraphViewerContext()

  if (!selected || !graph) {
    return (
        <aside className="inspector">
          <h2>Inspector</h2>
          <div className="empty small">Select a node to see its details.</div>
        </aside>
    )
  }

  const incoming = graph.edges.filter((edge) => edge.target === selected.id).length
  const outgoing = graph.edges.filter((edge) => edge.source === selected.id).length
  const directory = directoryForNode(selected)

  return (
      <aside className="inspector">
        <h2>Inspector</h2>
        <div className="small">
          <h3>{selected.name}</h3>
          <dl>
            <dt>Kind</dt>
            <dd>{selected.kind ?? 'unknown'}</dd>
            <dt>File</dt>
            <dd>
              {selected.file_path ?? 'unknown'}:{selected.start_line ?? '?'}
            </dd>
            <dt>Language</dt>
            <dd>{selected.language ?? 'unknown'}</dd>
            <dt>Qualified name</dt>
            <dd>{selected.qualified_name ?? selected.name}</dd>
            <dt>Relationships</dt>
            <dd>
              {incoming} incoming · {outgoing} outgoing
            </dd>
          </dl>
          <FocusDepthControl/>
          <FocusNeighbours/>
          {selected.signature && <pre>{selected.signature}</pre>}
          {selected.docstring && <p>{selected.docstring}</p>}
          {directory && (
              <>
                <button
                    type="button"
                    onClick={() => {
                      excludeDirectory(directory)
                      persistView()
                    }}
                >
                  Hide all nodes from this package/directory
                </button>
                <p className="subtle">{directory}</p>
              </>
          )}
        </div>
      </aside>
  )
}
