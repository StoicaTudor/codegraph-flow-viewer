import * as React from 'react'
import {useCallback, useEffect, useState} from 'react'
import type {GraphNode} from '../types/graph.js'

export type ContextMenuState = { xCoordinate: number; yCoordinate: number; node: GraphNode } | undefined

export const useContextMenu = () => {
  const [menu, setMenu] = useState<ContextMenuState>(undefined)

  const open: (event: React.MouseEvent, node: GraphNode) => void = useCallback((event: React.MouseEvent, node: GraphNode) => {
    event.preventDefault()
    setMenu({xCoordinate: event.clientX, yCoordinate: event.clientY, node})
  }, [])

  const close: () => void = useCallback(() => setMenu(undefined), [])

  useEffect(() => {
    if (!menu) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target as Element).closest?.('#context-menu')) close()
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [menu, close])

  return {menu, open, close}
}
