import * as React from 'react'
import {useCallback, useMemo, useRef} from 'react'
import type {Camera, GraphEdge, GraphNode, Point} from '../types/graph.js'
import {callEdgePoints, nodeBoxHalfSize} from '../lib/graph-geometry.js'
import {fileLabel} from '../lib/graph-filter.js'
import {DEFAULT_CAMERA} from '../lib/constants.js'

export type PositionsRef = React.MutableRefObject<Map<string, Point>>
export type CameraRef = React.MutableRefObject<Camera>

type Options = {
  svgRef: React.RefObject<SVGSVGElement | null>
  positionsRef: PositionsRef
  cameraRef: CameraRef
  nodeGroupRefs: React.MutableRefObject<Map<string, SVGGElement>>
  edgeLineRefs: React.MutableRefObject<Map<number, SVGLineElement>>
  edges: GraphEdge[]
  nodesById: Map<string, GraphNode>
  fullPath: boolean
  onCommit: () => void
}

/** Handles camera pan/zoom and node dragging via direct DOM mutation (bypassing React state) for smooth 60fps interaction, mirroring the original imperative canvas implementation. */
export const usePanZoomDrag = ({svgRef, positionsRef, cameraRef, nodeGroupRefs, edgeLineRefs, edges, nodesById, fullPath, onCommit}: Options) => {
  const dragging = useRef<{ nodeId: string; offsetX: number; offsetY: number } | undefined>(undefined);
  const panning = useRef<{ startX: number; startY: number; cameraX: number; cameraY: number } | undefined>(undefined);
  const lastClicked = useRef<{ nodeId: string; at: number } | undefined>(undefined);

  const viewportSize = useCallback(() => {
    const svg = svgRef.current
    return {width: svg?.clientWidth || 900, height: svg?.clientHeight || 700}
  }, [svgRef])

  const setViewBox: () => void = useCallback(() => {
    const svg: SVGSVGElement | null | undefined = svgRef.current
    if (!svg) return
    const {width, height} = viewportSize()
    const camera: Camera = cameraRef.current
    svg.setAttribute('viewBox', `${camera.x} ${camera.y} ${width / camera.scale} ${height / camera.scale}`)
  }, [svgRef, cameraRef, viewportSize])

  const screenToWorld = useCallback(
      (clientX: number, clientY: number) => {
        const svg: SVGSVGElement | null | undefined = svgRef.current
        const bounds = svg?.getBoundingClientRect()
        const camera: Camera = cameraRef.current
        return {x: camera.x + (clientX - (bounds?.left ?? 0)) / camera.scale, y: camera.y + (clientY - (bounds?.top ?? 0)) / camera.scale}
      },
      [svgRef, cameraRef]
  )

  const refreshEdges = useCallback(() => {
    for (const [index, edge] of edges.entries()) {
      const line = edgeLineRefs.current.get(index)
      if (!line) continue
      const source = positionsRef.current.get(edge.source)
      const target = positionsRef.current.get(edge.target)
      if (!source || !target) continue
      const sourceNode = nodesById.get(edge.source)
      const targetNode = nodesById.get(edge.target)
      const points =
          edge.kind === 'calls' && sourceNode && targetNode
              ? callEdgePoints(nodeBoxHalfSize(sourceNode, fileLabel(sourceNode, fullPath)), nodeBoxHalfSize(targetNode, fileLabel(targetNode, fullPath)), source, target)
              : {source, target}
      line.setAttribute('x1', String(points.source.x))
      line.setAttribute('y1', String(points.source.y))
      line.setAttribute('x2', String(points.target.x))
      line.setAttribute('y2', String(points.target.y))
    }
  }, [edges, edgeLineRefs, positionsRef, nodesById, fullPath])

  const beginNodeDrag = useCallback(
      (event: React.PointerEvent, nodeId: string) => {
        if (event.button !== 0 || (event.target as Element).tagName.toLowerCase() === 'text') return
        const point = positionsRef.current.get(nodeId)
        if (!point) return
        const worldPoint = screenToWorld(event.clientX, event.clientY)
        dragging.current = {nodeId, offsetX: worldPoint.x - point.x, offsetY: worldPoint.y - point.y}
        event.stopPropagation()
      },
      [positionsRef, screenToWorld]
  )

  const isDoubleClick = useCallback((nodeId: string) => {
    const now = Date.now()
    const result = lastClicked.current?.nodeId === nodeId && now - lastClicked.current.at < 450
    lastClicked.current = result ? undefined : {nodeId, at: now}
    return result
  }, [])

  const beginPan = useCallback(
      (event: React.PointerEvent) => {
        if (event.button !== 0 || (event.target as Element).closest?.('.node')) return
        panning.current = {startX: event.clientX, startY: event.clientY, cameraX: cameraRef.current.x, cameraY: cameraRef.current.y}
        svgRef.current?.classList.add('panning')
      },
      [svgRef, cameraRef]
  )

  const onPointerMove = useCallback(
      (event: React.PointerEvent) => {
        if (dragging.current) {
          const point = positionsRef.current.get(dragging.current.nodeId)
          if (!point) return
          const worldPoint = screenToWorld(event.clientX, event.clientY)
          point.x = worldPoint.x - dragging.current.offsetX
          point.y = worldPoint.y - dragging.current.offsetY
          const group = nodeGroupRefs.current.get(dragging.current.nodeId)
          group?.setAttribute('transform', `translate(${point.x},${point.y})`)
          refreshEdges()
          return
        }
        if (panning.current) {
          const camera = cameraRef.current
          camera.x = panning.current.cameraX - (event.clientX - panning.current.startX) / camera.scale
          camera.y = panning.current.cameraY - (event.clientY - panning.current.startY) / camera.scale
          setViewBox()
        }
      },
      [positionsRef, screenToWorld, nodeGroupRefs, refreshEdges, panning, cameraRef, setViewBox]
  )

  const endInteraction = useCallback(() => {
    const wasInteracting = Boolean(dragging.current || panning.current)

    delete dragging.current
    delete panning.current

    svgRef.current?.classList.remove('panning')
    if (wasInteracting) onCommit()
  }, [svgRef, onCommit])

  const onWheel = useCallback(
      (event: React.WheelEvent) => {
        event.preventDefault()
        const before = screenToWorld(event.clientX, event.clientY)
        const camera = cameraRef.current
        camera.scale = Math.min(4, Math.max(0.2, camera.scale * (event.deltaY < 0 ? 1.1 : 0.9)))
        const after = screenToWorld(event.clientX, event.clientY)
        camera.x += before.x - after.x
        camera.y += before.y - after.y
        setViewBox()
        onCommit()
      },
      [screenToWorld, cameraRef, setViewBox, onCommit]
  )

  const panByKeyboard = useCallback(
      (dx: number, dy: number) => {
        const camera = cameraRef.current
        camera.x += dx / camera.scale
        camera.y += dy / camera.scale
        setViewBox()
        onCommit()
      },
      [cameraRef, setViewBox, onCommit]
  )

  const resetCamera = useCallback(() => {
    cameraRef.current = {...DEFAULT_CAMERA}
    setViewBox()
  }, [cameraRef, setViewBox])

  return useMemo(
      () => (
          {
            setViewBox,
            screenToWorld,
            refreshEdges,
            beginNodeDrag,
            isDoubleClick,
            beginPan,
            onPointerMove,
            endInteraction,
            onWheel,
            panByKeyboard,
            resetCamera,
          }
      ),
      [
        setViewBox,
        screenToWorld,
        refreshEdges,
        beginNodeDrag,
        isDoubleClick,
        beginPan,
        onPointerMove,
        endInteraction,
        onWheel,
        panByKeyboard,
        resetCamera,
      ]
  )
}
