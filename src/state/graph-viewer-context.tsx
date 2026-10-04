import * as React from 'react'
import {createContext, useContext} from 'react'
import type {GraphViewer} from '../hooks/use-graph-viewer.js'

export const GraphViewerContext: React.Context<GraphViewer | undefined> = createContext<GraphViewer | undefined>(undefined)

export const useGraphViewerContext: () => GraphViewer = (): GraphViewer => {
  const context: GraphViewer | undefined = useContext(GraphViewerContext)
  if (!context) throw new Error('useGraphViewerContext must be used within a GraphViewerContext.Provider')
  return context
}
