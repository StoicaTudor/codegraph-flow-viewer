import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import {callEdgePoints, nodeBoxHalfSize} from '../../lib/graph-geometry.js'
import {fileLabel} from '../../lib/graph-filter.js'
import type {GraphEdge as GraphEdgeType, GraphNode, Point} from '../../types/graph.js'
import * as React from "react"

type Props = {
  edge: GraphEdgeType
  index: number
  edgeLineRefs: React.MutableRefObject<Map<number, SVGLineElement>>
}

export const GraphEdge: ({edge, index, edgeLineRefs}: Props) => (null | React.JSX.Element) = ({edge, index, edgeLineRefs}: Props) => {
  const {positionsRef, nodesById, viewer} = useGraphViewerContext()
  const a: Point | undefined = positionsRef.current.get(edge.source)
  const b: Point | undefined = positionsRef.current.get(edge.target)

  // mandatory - or else nothing makes any sense
  if (!a || !b) return null

  const sourceNode: GraphNode | undefined = nodesById.get(edge.source)
  const targetNode: GraphNode | undefined = nodesById.get(edge.target)
  const points: { source: Point; target: Point } =
      // Special case for 'calls', since this relation is being drawn differently - with arrows.
      // Purpose: to avoid the arrow overlapping the node box, we need to calculate the intersection point of the edge with the node box.
      edge.kind === 'calls' && sourceNode && targetNode
          ? callEdgePoints(
              nodeBoxHalfSize(sourceNode, fileLabel(sourceNode, viewer.fullPath)),
              nodeBoxHalfSize(targetNode, fileLabel(targetNode, viewer.fullPath)),
              a,
              b
          )
          : {source: a, target: b}

  return (
      <line
          ref={(element) => {
            if (element) edgeLineRefs.current.set(index, element)
            else edgeLineRefs.current.delete(index)
          }}
          x1={points.source.x}
          y1={points.source.y}
          x2={points.target.x}
          y2={points.target.y}
          className={`edge${edge.kind === 'calls' ? ' call-edge' : ''}`}
          data-source={edge.source}
          data-target={edge.target}
          data-kind={edge.kind ?? 'unknown'}
          markerEnd={edge.kind === 'calls' ? 'url(#call-arrow)' : undefined}
      />
  )
}
