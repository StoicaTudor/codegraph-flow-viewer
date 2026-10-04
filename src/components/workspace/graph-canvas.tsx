import * as React from 'react'
import {useCallback, useEffect, useRef} from 'react'
import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import type {GraphNode as GraphNodeType} from '../../types/graph.js'
import {usePanZoomDrag} from "../../hooks/use-pan-zoom-drag.js"
import {GraphNode} from "./graph-node.js"
import {GraphEdge} from "./graph-edge.js"
import {KeyboardKeys} from "../../types/keys.js"

type Props = {
  onNodeContextMenu: (event: React.MouseEvent, node: GraphNodeType) => void
}

export const GraphCanvas = ({onNodeContextMenu}: Props) => {
  const {
    filtered,
    viewer,
    nodesById,
    positionsRef,
    cameraRef,
    persistView,
    selectNode,
    focusNode,
    resetView,
    selected
  } = useGraphViewerContext()
  const svgRef = useRef<SVGSVGElement>(null)
  const nodeGroupRefs = useRef(new Map<string, SVGGElement>())
  const edgeLineRefs = useRef(new Map<number, SVGLineElement>())

  const panZoomDrag = usePanZoomDrag(
      {
        svgRef,
        positionsRef,
        cameraRef,
        nodeGroupRefs,
        edgeLineRefs,
        edges: filtered.edges,
        nodesById,
        fullPath: viewer.fullPath,
        onCommit: persistView,
      }
  )

  // Updates the SVG camera viewport (x, y, scale) whenever the number of nodes changes,
  // or when the panZoomDrag instance changes (e.g., on mount).
  useEffect(() => {
    panZoomDrag.setViewBox()
  }, [filtered.nodes.length, panZoomDrag])

  // handleResize
  useEffect(() => {
    const handleResize = () => panZoomDrag.setViewBox()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [panZoomDrag])

  // Keyboard shortcuts for panning and resetting the view
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetView, panZoomDrag])

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === KeyboardKeys.ESC) {
      resetView()
      return
    }
    const tag = (event.target as HTMLElement).tagName
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return
    const distance = event.shiftKey ? 160 : 80
    let dx: number = 0
    let dy: number = 0
    if (event.key === KeyboardKeys.ARROW_LEFT) dx = -distance
    if (event.key === KeyboardKeys.ARROW_RIGHT) dx = distance
    if (event.key === KeyboardKeys.ARROW_UP) dy = -distance
    if (event.key === KeyboardKeys.ARROW_DOWN) dy = distance
    if (event.key.startsWith('Arrow')) {
      event.preventDefault()
      panZoomDrag.panByKeyboard(dx, dy)
    }
  }

  const handleNodeClick = useCallback(
      (node: GraphNodeType) => {
        if (panZoomDrag.isDoubleClick(node.id)) focusNode(node.id)
        selectNode(node.id)
        persistView()
      },
      [panZoomDrag, focusNode, selectNode, persistView]
  )

  const handleNodeDoubleClick = useCallback(
      (node: GraphNodeType) => {
        focusNode(node.id)
        persistView()
      },
      [focusNode, persistView]
  )

  /*
    * The <defs> element is used to define reusable SVG elements that can be referenced later in the SVG document.
    * Usage: <line markerEnd="url(#arrow)" />
   */
  const reusableArrowMarkers = () => <defs>
    <marker id="arrow" markerWidth={8} markerHeight={8} refX={7} refY={3} orient="auto">
      <path d="M0,0 L0,6 L7,3 z"/>
    </marker>
    <marker id="call-arrow" markerWidth={12} markerHeight={12} refX={10} refY={4} markerUnits="userSpaceOnUse" orient="auto">
      <path d="M0,0 L0,8 L10,4 z" fill="#bd4b4b" stroke="#bd4b4b"/>
    </marker>
  </defs>

  return (
      <svg
          id="graph"
          ref={svgRef}
          role="img"
          aria-label="CodeGraph dependency graph"
          onContextMenu={(event: React.MouseEvent<SVGSVGElement>) => event.preventDefault()}
          onPointerDown={panZoomDrag.beginPan}
          onPointerMove={panZoomDrag.onPointerMove}
          onPointerUp={panZoomDrag.endInteraction}
          onPointerCancel={panZoomDrag.endInteraction}
          onWheel={panZoomDrag.onWheel}
      >
        {reusableArrowMarkers()}

        {
          filtered.edges.map((edge, index) => (
              <GraphEdge key={`${edge.source}->${edge.target}-${index}`} edge={edge} index={index} edgeLineRefs={edgeLineRefs}/>
          ))
        }

        {
          filtered.nodes.map((node) => (
              <GraphNode
                  key={node.id}
                  node={node}
                  selected={selected?.id === node.id}
                  nodeGroupRefs={nodeGroupRefs}
                  onPointerDown={(event) => panZoomDrag.beginNodeDrag(event, node.id)}
                  onClick={() => handleNodeClick(node)}
                  onDoubleClick={() => handleNodeDoubleClick(node)}
                  onContextMenu={(event) => onNodeContextMenu(event, node)}
              />
          ))
        }
      </svg>
  )
}
