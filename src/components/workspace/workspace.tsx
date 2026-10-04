import {useGraphViewerContext} from '../../state/graph-viewer-context.js'
import type {GraphNode} from '../../types/graph.js'
import * as React from "react"
import {GraphCanvas} from "./graph-canvas.js"

type Props = {
  onNodeContextMenu: (event: React.MouseEvent, node: GraphNode) => void
}

export const Workspace: ({onNodeContextMenu}: Props) => React.JSX.Element = ({onNodeContextMenu}: Props) => {
  const {message} = useGraphViewerContext()

  return (
      <section className="workspace">
        <div className={`empty ${message.kind}`}>{message.text}</div>
        <GraphCanvas onNodeContextMenu={onNodeContextMenu}/>
      </section>
  )
}
