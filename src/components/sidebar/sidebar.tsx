import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import {FiltersPanel} from "./filters-panel.js";
import {ExcludedDirectoriesSelect} from "./excluded-directories-select.js";
import {LimitSlider} from "./limit-slider.js";
import {NodeTypeFieldset} from "./node-type-fieldset.js";
import {CodeOriginFieldset} from "./code-origin-fieldset.js";
import {ViewImportExport} from "./view-import-export.js";
import {Stats} from "./stats.js";
import {PathLoader} from "./path-loader.js";


export const Sidebar = () => {
  const {graph, resetView} = useGraphViewerContext()

  return (
      <aside className="controls">
        <PathLoader/>
        <FiltersPanel/>
        <ExcludedDirectoriesSelect/>
        <LimitSlider/>
        <button disabled={!graph} onClick={resetView}>
          Reset full view
        </button>
        <NodeTypeFieldset/>
        <CodeOriginFieldset/>
        <ViewImportExport/>
        <p className="hint">Drag nodes to arrange them. Click a node to inspect it. Double-click a node to focus its local neighborhood.</p>
        <Stats/>
      </aside>
  )
}
