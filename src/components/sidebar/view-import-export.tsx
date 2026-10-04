import * as React from 'react'
import {useRef} from 'react'
import {useGraphViewerContext} from '../../state/graph-viewer-context.js'

/*
  View/App state can be imported and exported.
  Beware - the exported path is full-path. Therefore, if you want to share it with a friend, he must modify the codegraph's DB/project's path manually.
 */
export const ViewImportExport = () => {
  const {graph, exportView, importView} = useGraphViewerContext()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await importView(file)
    } finally {
      event.target.value = ''
    }
  }

  return (
      <>
        <button disabled={!graph} onClick={exportView}>
          Export view JSON
        </button>
        <button disabled={!graph} onClick={() => fileInputRef.current?.click()}>
          Import view JSON
        </button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" hidden onChange={handleFileChange}/>
      </>
  )
}
