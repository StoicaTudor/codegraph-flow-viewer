import {useCallback, useState} from 'react'
import {openProject, uploadDatabase as uploadDatabaseRequest} from '../api/graph-api.js'
import type {Graph} from '../types/graph.js'

export type StatusInfo = { text: string; bad: boolean };
export type MessageInfo = { text: string; kind: 'empty' | 'loaded' | 'error' };

export const useGraphData = () => {
  const [graph, setGraph] = useState<Graph>()
  const [status, setStatus] = useState<StatusInfo>({text: 'No database loaded', bad: false})
  const [message, setMessage] = useState<MessageInfo>({text: 'Open a CodeGraph project or database to begin.', kind: 'empty'})

  const showError = useCallback((error: unknown) => {
    setStatus({text: 'Could not load database', bad: true})
    setMessage({text: error instanceof Error ? error.message : String(error), kind: 'error'})
  }, [])

  const openProjectPath = useCallback(
      async (projectPath: string) => {
        if (!projectPath) return undefined
        try {
          setStatus({text: 'Opening…', bad: false})
          const loaded = await openProject(projectPath)
          setGraph(loaded)
          setStatus({text: `Loaded ${loaded.source}`, bad: false})
          setMessage({text: '', kind: 'loaded'})
          return loaded
        } catch (error) {
          showError(error)
          return undefined
        }
      },
      [showError]
  )

  const uploadDatabase = useCallback(
      async (file: File) => {
        try {
          setStatus({text: 'Uploading…', bad: false})
          const loaded = await uploadDatabaseRequest(file)
          setGraph(loaded)
          setStatus({text: `Loaded ${loaded.source}`, bad: false})
          setMessage({text: '', kind: 'loaded'})
          return loaded
        } catch (error) {
          showError(error)
          return undefined
        }
      },
      [showError]
  )

  return {graph, status, message, openProjectPath, uploadDatabase, showError}
}
