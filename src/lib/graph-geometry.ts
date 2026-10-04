import type {GraphNode, Point} from '../types/graph.js'

export const nodeBoxHalfSize = (node: GraphNode, fileLabelText: string) => {
  const labels = [node.name, fileLabelText, node.kind ?? 'symbol']
  const width = Math.max(144, ...labels.map((label) => label.length * 6.5 + 24))
  return {x: width / 2, y: 30}
}

export const callEdgePoints = (
    sourceBox: { x: number; y: number },
    targetBox: { x: number; y: number },
    a: Point,
    b: Point
) => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  if (!length) return {source: a, target: b}
  const unitX = dx / length
  const unitY = dy / length
  const sourceDistance = Math.min(sourceBox.x / Math.max(Math.abs(unitX), 0.001), sourceBox.y / Math.max(Math.abs(unitY), 0.001)) + 3
  const targetDistance = Math.min(targetBox.x / Math.max(Math.abs(unitX), 0.001), targetBox.y / Math.max(Math.abs(unitY), 0.001)) + 7
  return {
    source: {x: a.x + unitX * sourceDistance, y: a.y + unitY * sourceDistance},
    target: {x: b.x - unitX * targetDistance, y: b.y - unitY * targetDistance},
  }
}

export const scatterPositions = (nodeIds: string[]) => {
  const positions = new Map<string, Point>()
  const columns = Math.max(1, Math.ceil(Math.sqrt(nodeIds.length * 1.5)))
  const horizontalGap = 190
  const verticalGap = 100
  nodeIds.forEach((id, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    positions.set(id, {x: 100 + column * horizontalGap + (Math.random() - 0.5) * 36, y: 80 + row * verticalGap + (Math.random() - 0.5) * 24})
  })
  return positions
}

export const gridPosition = (index: number, total: number) => {
  const columns = Math.max(1, Math.ceil(Math.sqrt(total * 1.5)))
  return {x: 100 + (index % columns) * 190, y: 80 + Math.floor(index / columns) * 100}
}
