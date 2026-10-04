import * as React from 'react'
import {useRef, useState} from 'react'
import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

export const PathLoader: () => React.JSX.Element = () => {
  const {path, setPath, openProjectPath, uploadDatabase} = useGraphViewerContext()
  const [fileName, setFileName] = useState('No database selected')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpen = () => {
    void openProjectPath(path.trim())
  }

  const handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setFileName(file?.name ?? 'No database selected')
  }

  const handleUpload: () => Promise<void> = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      fileInputRef.current?.click()
      return
    }
    await uploadDatabase(file)
  }

  return (
      <>
        <label>
          Project root or <code>codegraph.db</code>
          <input
              value={path}
              onChange={(event) => setPath(event.target.value)}
              placeholder="/path/to/project or /path/to/codegraph.db"
          />
        </label>
        <button onClick={handleOpen}>Open path</button>
        <div className="file-label">
          <span>{fileName}</span>
          <input ref={fileInputRef} type="file" accept=".db,application/vnd.sqlite3" hidden onChange={handleFileChange}/>
        </div>
        <button type="button" style={{width: 'auto', padding: '6px 9px', fontSize: '11px'}} onClick={handleUpload}>
          Upload database
        </button>
        <hr/>
      </>
  )
}
