import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import * as React from "react";

export const ExcludedDirectoriesSelect = () => {
  const {graph, viewer, dispatch, directoryOptions} = useGraphViewerContext()

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = [...event.target.selectedOptions].map((option) => option.value)
    dispatch({type: 'SET_EXCLUDED_DIRECTORIES', values})
  }

  return (
      <label>
        Exclude packages/directories
        <select multiple size={6} disabled={!graph} value={viewer.excludedDirectories} onChange={handleChange}>
          {directoryOptions.map((directory) => (
              <option key={directory} value={directory}>
                {directory}
              </option>
          ))}
        </select>
      </label>
  )
}
