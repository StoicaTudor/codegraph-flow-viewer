import * as React from 'react'
import {useCallback, useEffect, useRef} from 'react'

type Side = 'left' | 'right'

/** Drives the resizer handles by writing CSS custom properties directly during drag, then committing the final width once the gesture ends. */
export const usePanelResizer = (onCommit: (side: Side, width: number) => void, widths: { left: number; right: number }) => {
  const resizing = useRef<{ side: Side; startX: number; startWidth: number; currentWidth: number } | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  const applyWidths = useCallback((left: number, right: number) => {
    const root = rootRef.current
    if (!root) return
    root.style.setProperty('--left-width', `${left}px`)
    root.style.setProperty('--right-width', `${right}px`)
  }, [])

  useEffect(() => {
    applyWidths(widths.left, widths.right)
  }, [widths.left, widths.right, applyWidths])

  const startResizing = useCallback(
      (side: Side) => (event: React.PointerEvent) => {
        const startWidth = side === 'left' ? widths.left : widths.right
        resizing.current = {side, startX: event.clientX, startWidth, currentWidth: startWidth}
        event.preventDefault()
        event.stopPropagation()
      },
      [widths]
  )

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const state = resizing.current
      if (!state) return
      const delta = event.clientX - state.startX
      const minimum = state.side === 'left' ? 180 : 200
      const maximum = 500
      const nextWidth = Math.min(maximum, Math.max(minimum, state.startWidth + (state.side === 'left' ? delta : -delta)))
      state.currentWidth = nextWidth
      applyWidths(state.side === 'left' ? nextWidth : widths.left, state.side === 'right' ? nextWidth : widths.right)
    }
    const handleUp = () => {
      const state = resizing.current
      if (!state) return
      delete resizing.current
      onCommit(state.side, state.currentWidth)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [applyWidths, onCommit, widths.left, widths.right])

  return {rootRef, startResizing}
}
