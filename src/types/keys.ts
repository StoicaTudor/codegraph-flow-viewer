export const KeyboardKeys = {
  ESC: "Escape",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
} as const

export type KeyboardKeys = (typeof KeyboardKeys)[keyof typeof KeyboardKeys]
