// Shared geometry for the defense-in-depth diagram and its traffic overlay.
// Concentric rounded rectangles, outermost layer first.
export const WIDTH = 720
export const HEIGHT = 540
export const MARGIN = 28 // room for the "Internet" label above the outer ring
export const BAND = 30 // thickness of each ring

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Outer rectangle of ring `i` (0 = outermost). `i = layer count` gives the core. */
export function ringRect(i: number): Rect {
  const inset = i * BAND
  return {
    x: inset,
    y: MARGIN + inset,
    width: WIDTH - 2 * inset,
    height: HEIGHT - MARGIN - 2 * inset,
  }
}

/** Vertical middle of ring `i`'s top band, where packets meet that control. */
export function checkpointY(i: number): number {
  return MARGIN + i * BAND + BAND / 2
}
