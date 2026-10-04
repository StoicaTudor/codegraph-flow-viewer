import type {Graph} from '../types/graph.js'

const parseGraphResponse = async (response: Response): Promise<Graph> => {
  const data = await response.json()
  if (!response.ok || data.error) throw new Error(data.error ?? 'Request failed')
  return data as Graph
}

export const openProject = async (projectPath: string): Promise<Graph> => {
  const response = await fetch('/api/open', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({path: projectPath}),
  })
  return parseGraphResponse(response)
}

export const uploadDatabase = async (file: File): Promise<Graph> => {
  const response = await fetch('/api/upload', {method: 'POST', body: await file.arrayBuffer()})
  return parseGraphResponse(response)
}
