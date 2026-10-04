import * as React from "react"

type Props = {
  ariaLabel: string
  onPointerDown: (event: React.PointerEvent) => void
}

export const ResizeHandle = ({ariaLabel, onPointerDown}: Props) => {
  return <div className="resizer" role="separator" aria-label={ariaLabel} onPointerDown={onPointerDown}/>
}
