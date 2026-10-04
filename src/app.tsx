import {useGraphViewer} from "./hooks/use-graph-viewer.js"
import {usePanelResizer} from "./hooks/use-panel-resizer.js"
import {useContextMenu} from "./hooks/use-context-menu.js"
import {GraphViewerContext} from "./state/graph-viewer-context.js"
import {Header} from "./components/header.js";
import {Sidebar} from "./components/sidebar/sidebar.js";
import {ResizeHandle} from "./components/resize-handle.js";
import {Workspace} from "./components/workspace/workspace.js";
import {Inspector} from "./components/inspector/inspector.js";
import {ContextMenu} from "./components/context-menu.js";

export const App = () => {
  const viewer = useGraphViewer()
  const {rootRef, startResizing} = usePanelResizer(viewer.setPanelWidth, {left: viewer.viewer.leftWidth, right: viewer.viewer.rightWidth})
  const contextMenu = useContextMenu()

  return (
      <GraphViewerContext.Provider value={viewer}>
        <Header/>
        <div ref={rootRef}>
          <main>
            <Sidebar/>
            <ResizeHandle ariaLabel="Resize filters panel" onPointerDown={startResizing('left')}/>
            <Workspace onNodeContextMenu={contextMenu.open}/>
            <ResizeHandle ariaLabel="Resize inspector panel" onPointerDown={startResizing('right')}/>
            <Inspector/>
          </main>
        </div>
        <ContextMenu menu={contextMenu.menu} onClose={contextMenu.close}/>
      </GraphViewerContext.Provider>
  )
}
