import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from 'react'
import {useGraphData} from './use-graph-data.js'
import {initialViewerState, viewerReducer} from '../state/viewer-reducer.js'
import type {Camera, Graph, GraphNode, Point} from '../types/graph.js'
import type {ViewState} from '../types/view-state.js'
import {collectDirectories, filterGraph} from '../lib/graph-filter.js'
import {maximumFocusDepth} from '../lib/graph-domain.js'
import {gridPosition, scatterPositions} from '../lib/graph-geometry.js'
import {COLOR_PALETTE, DEFAULT_CAMERA} from '../lib/constants.js'
import {readSavedPath, readViewState, savePath, saveViewState} from '../lib/view-state-persistence.js'

export const useGraphViewer = () => {
  const {graph, status, message, openProjectPath: openProjectPathRequest, uploadDatabase: uploadDatabaseRequest, showError} = useGraphData()
  const [viewer, dispatch] = useReducer(viewerReducer, initialViewerState)
  const [path, setPath] = useState('')

  const positionsRef = useRef<Map<string, Point>>(new Map())
  const cameraRef = useRef<Camera>({...DEFAULT_CAMERA})

  const nodesById = useMemo(() => new Map((graph?.nodes ?? []).map((node) => [node.id, node])), [graph])

  const directoryOptions = useMemo(() => collectDirectories(graph), [graph])
  const edgeKindOptions = useMemo(() => [...new Set((graph?.edges ?? []).map((edge) => edge.kind).filter(Boolean))] as string[], [graph])

  const currentFocusDepth: (nodeId: string) => number = useCallback(
      (nodeId: string) => Math.min(maximumFocusDepth(graph?.edges ?? [], nodeId), Math.max(1, viewer.focusDepths[nodeId] ?? 1)),
      [graph, viewer.focusDepths]
  )

  const filtered = useMemo(
      () =>
          filterGraph(graph, {
            search: viewer.search,
            edgeKind: viewer.edgeKind,
            relationshipFilter: viewer.relationshipFilter,
            excludedDirectories: new Set(viewer.excludedDirectories),
            nodeTypes: new Set(viewer.nodeTypes),
            includeExternal: viewer.includeExternal,
            includeGenerated: viewer.includeGenerated,
            hiddenNodeIds: new Set(viewer.hiddenNodeIds),
            focusId: viewer.focusId,
            focusDepth: viewer.focusId ? currentFocusDepth(viewer.focusId) : undefined,
            limit: viewer.limit,
          }),
      [graph, viewer.search, viewer.edgeKind, viewer.relationshipFilter, viewer.excludedDirectories, viewer.nodeTypes, viewer.includeExternal, viewer.includeGenerated, viewer.hiddenNodeIds, viewer.focusId, viewer.limit, currentFocusDepth]
  )

  // Assign a default grid position to any newly-visible node that has never been placed before.
  // This mutates the ref as a side effect of rendering (mirrors the original imperative layout logic).
  filtered.nodes.forEach((node, index) => {
    if (!positionsRef.current.has(node.id)) {
      positionsRef.current.set(node.id, gridPosition(index, filtered.nodes.length))
    }
  })

  const selected = viewer.selectedId ? nodesById.get(viewer.selectedId) : undefined

  const buildViewState = useCallback(
      (): ViewState => ({
        path,
        search: viewer.search,
        edgeKind: viewer.edgeKind,
        relationshipFilter: viewer.relationshipFilter,
        excludedDirectories: viewer.excludedDirectories,
        limit: viewer.limit,
        nodeTypes: viewer.nodeTypes,
        includeExternal: viewer.includeExternal,
        includeGenerated: viewer.includeGenerated,
        fullPath: viewer.fullPath,
        hiddenNodeIds: viewer.hiddenNodeIds,
        nodeColors: viewer.nodeColors,
        focusDepths: viewer.focusDepths,
        leftWidth: viewer.leftWidth,
        rightWidth: viewer.rightWidth,
        focusId: viewer.focusId,
        selectedId: viewer.selectedId,
        camera: {...cameraRef.current},
        positions: Object.fromEntries(positionsRef.current),
      }),
      [path, viewer]
  )

  const persistView = useCallback(() => {
    if (!graph) return
    saveViewState(buildViewState())
  }, [graph, buildViewState])

  // Persist filter/UI changes (low-frequency) camera/position drags commit explicitly via persistView().
  useEffect(() => {
    if (graph) persistView()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, viewer])

  const applySavedState: (loadedGraph: NonNullable<Graph | undefined>, savedState: ViewState) => void = useCallback((loadedGraph: NonNullable<typeof graph>, savedState: ViewState) => {
    dispatch({type: 'APPLY_VIEW_STATE', state: savedState, maxLimit: Math.max(1, loadedGraph.nodes.length)})
    cameraRef.current = savedState.camera
        ? {x: savedState.camera.x, y: savedState.camera.y, scale: Math.min(4, Math.max(0.2, savedState.camera.scale))}
        : {...DEFAULT_CAMERA}
    positionsRef.current = new Map(Object.entries(savedState.positions ?? {}))
  }, [])

  const openProjectPath: (projectPath: string) => Promise<void> = useCallback(
      async (projectPath: string) => {
        const loaded = await openProjectPathRequest(projectPath)
        if (!loaded) return
        const maxLimit = Math.max(1, loaded.nodes.length)
        dispatch({type: 'RESET_FOR_NEW_GRAPH', maxLimit})
        cameraRef.current = {...DEFAULT_CAMERA}
        positionsRef.current = new Map()
        savePath(projectPath)
        const savedState = readViewState()
        if (savedState && savedState.path === loaded.source) applySavedState(loaded, savedState)
        setPath(projectPath)
      },
      [openProjectPathRequest, applySavedState]
  )

  const uploadDatabase = useCallback(
      async (file: File) => {
        const loaded = await uploadDatabaseRequest(file)
        if (!loaded) return
        const maxLimit = Math.max(1, loaded.nodes.length)
        dispatch({type: 'RESET_FOR_NEW_GRAPH', maxLimit})
        cameraRef.current = {...DEFAULT_CAMERA}
        positionsRef.current = new Map()
      },
      [uploadDatabaseRequest]
  )

  const resetView = useCallback(() => {
    dispatch({type: 'RESET_VIEW'})
    cameraRef.current = {...DEFAULT_CAMERA}
    positionsRef.current = scatterPositions(filtered.nodes.map((node) => node.id))
  }, [filtered.nodes])

  const exportView = useCallback(() => {
    const blob = new Blob([JSON.stringify(buildViewState(), null, 2)], {type: 'application/json'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'codegraph-view.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [buildViewState])

  const importView = useCallback(
      async (file: File) => {
        try {
          const state = JSON.parse(await file.text()) as ViewState
          if (!state || typeof state !== 'object' || !state.camera || !state.positions) throw new Error('Invalid CodeGraph view JSON.')
          if (state.path) setPath(state.path)
          if (graph && state.path === graph.source) {
            applySavedState(graph, state)
          } else if (state.path) {
            await openProjectPath(state.path)
            if (graph) applySavedState(graph, state)
          }
        } catch (error) {
          showError(error)
        }
      },
      [graph, applySavedState, openProjectPath, showError]
  )

  // Auto-open the last used project path on first mount.
  useEffect(() => {
    const savedPath = readSavedPath()
    if (savedPath) {
      setPath(savedPath)
      void openProjectPath(savedPath)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hideNode = useCallback((id: string) => dispatch({type: 'HIDE_NODE', id}), [])
  const setNodeColor = useCallback((id: string, color: string) => dispatch({type: 'SET_NODE_COLOR', id, color}), [])
  const selectNode = useCallback((id: string) => dispatch({type: 'SELECT_NODE', id}), [])
  const focusNode = useCallback((id?: string) => dispatch({type: 'SET_FOCUS', id}), [])
  const setFocusDepth = useCallback((id: string, depth: number) => dispatch({type: 'SET_FOCUS_DEPTH', id, depth}), [])
  const excludeDirectory = useCallback((directory: string) => dispatch({type: 'EXCLUDE_DIRECTORY', directory}), [])
  const setPanelWidth = useCallback((side: 'left' | 'right', width: number) => dispatch({type: 'SET_PANEL_WIDTH', side, width}), [])

  return {
    graph,
    status,
    message,
    path,
    setPath,
    viewer,
    dispatch,
    nodesById,
    directoryOptions,
    edgeKindOptions,
    filtered,
    selected,
    currentFocusDepth,
    positionsRef,
    cameraRef,
    openProjectPath,
    uploadDatabase,
    resetView,
    exportView,
    importView,
    persistView,
    hideNode,
    setNodeColor,
    selectNode,
    focusNode,
    setFocusDepth,
    excludeDirectory,
    setPanelWidth,
    colorPalette: COLOR_PALETTE,
  }
}

export type GraphViewer = ReturnType<typeof useGraphViewer>
export type {GraphNode}
