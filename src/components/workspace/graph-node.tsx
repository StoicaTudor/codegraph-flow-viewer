import * as React from 'react'
import {useLayoutEffect, useRef} from 'react'
import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import {fileLabel} from '../../lib/graph-filter.js'
import type {GraphNode as GraphNodeType} from '../../types/graph.js'

type Props = {
  node: GraphNodeType
  selected: boolean
  nodeGroupRefs: React.MutableRefObject<Map<string, SVGGElement>>
  onPointerDown: (event: React.PointerEvent) => void
  onClick: () => void
  onDoubleClick: () => void
  onContextMenu: (event: React.MouseEvent) => void
}

export const GraphNode = ({node, selected, nodeGroupRefs, onPointerDown, onClick, onDoubleClick, onContextMenu}: Props) => {
  const {positionsRef, viewer} = useGraphViewerContext()
  const rectRef = useRef<SVGRectElement | null>(null)
  const textRefs = useRef<(SVGTextElement | null)[]>([null, null, null])
  const position = positionsRef.current.get(node.id) ?? {x: 0, y: 0}
  const color = viewer.nodeColors[node.id]
  const label = fileLabel(node, viewer.fullPath)

  // Fit the node box to its text content, matching the original canvas rendering behaviour.
  useLayoutEffect(() => {
    const texts = textRefs.current.filter((text): text is SVGTextElement => Boolean(text))
    const textWidth = Math.max(0, ...texts.map((text) => text.getComputedTextLength() || (text.textContent?.length ?? 0) * 6))
    const width = Math.max(144, Math.ceil(textWidth + 24))
    rectRef.current?.setAttribute('x', String(-width / 2))
    rectRef.current?.setAttribute('width', String(width))
  })

  return (
      <g
          ref={(element) => {
            if (element) nodeGroupRefs.current.set(node.id, element)
            else nodeGroupRefs.current.delete(node.id)
          }}
          className={`node${selected ? ' selected' : ''}`}
          transform={`translate(${position.x},${position.y})`}
          onPointerDown={onPointerDown}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onContextMenu={onContextMenu}
      >
        <rect ref={rectRef} x={-72} y={-30} width={144} height={60} rx={6} style={color ? {fill: color} : undefined}/>
        <text ref={(element) => { textRefs.current[0] = element }} y={-10}>
          {node.name}
        </text>
        <text ref={(element) => { textRefs.current[1] = element }} y={3} className="file-label">
          {label}
        </text>
        <text ref={(element) => { textRefs.current[2] = element }} y={18} className="node-kind">
          {node.kind ?? 'symbol'}
        </text>
      </g>
  )
}
