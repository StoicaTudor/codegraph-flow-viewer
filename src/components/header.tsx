import {useGraphViewerContext} from '../state/graph-viewer-context.js'

export const Header = () => {
  const {status} = useGraphViewerContext()
  return (
      <header>
        <div>
          <p className="eyebrow">LOCAL CODE INTELLIGENCE</p>
          <h1>CodeGraph Flow Viewer</h1>
          <p className="subtle">Explore symbols, imports, calls, and inheritance from a local CodeGraph index.</p>
        </div>
        <div className={`status ${status.bad ? 'bad' : ''}`}>{status.text}</div>
      </header>
  )
}
