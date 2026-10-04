import type {JSX} from 'react'
import {useGraphViewerContext} from '../state/graph-viewer-context.js'
import type {ContextMenuState} from '../hooks/use-context-menu.js'

type Props = {
  menu: ContextMenuState
  onClose: () => void
}

export const ContextMenu: ({menu, onClose}: Props) => (JSX.Element) = ({menu, onClose}: Props) => {
  const {setNodeColor, hideNode, colorPalette} = useGraphViewerContext()

  if (!menu) return <div id="context-menu" hidden/>

  const left = Math.min(menu.xCoordinate, window.innerWidth - 190)
  const top = Math.min(menu.yCoordinate, window.innerHeight - 150)

  return (
      <div id="context-menu" style={{left, top}}>
        <strong>{menu.node.name}</strong>
        <div className="color-grid">
          {colorPalette.map((color) => (
              <button
                  key={color}
                  className="color-choice"
                  style={{background: color}}
                  title={color}
                  onClick={() => {
                    setNodeColor(menu.node.id, color)
                    onClose()
                  }}
              />
          ))}
        </div>
        <button
            className="hide-choice"
            onClick={() => {
              hideNode(menu.node.id)
              onClose()
            }}
        >
          Remove from canvas
        </button>
      </div>
  )
}
