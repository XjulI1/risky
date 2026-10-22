/** A value drawn from the generator, with the generator state to use for the next draw. */
export type Draw<T> = {
  value: T
  state: number
}

const UINT32_RANGE = 4294967296

/** Mulberry32 step: returns a float in [0, 1) and the next 32-bit state. */
export function nextFloat(state: number): Draw<number> {
  const next = (state + 0x6d2b79f5) | 0
  let mixed = Math.imul(next ^ (next >>> 15), next | 1)
  mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
  return { value: ((mixed ^ (mixed >>> 14)) >>> 0) / UINT32_RANGE, state: next }
}

/** Returns an integer in the inclusive range [min, max]. */
export function nextInt(state: number, min: number, max: number): Draw<number> {
  const draw = nextFloat(state)
  return { value: min + Math.floor(draw.value * (max - min + 1)), state: draw.state }
}

/** Returns a shuffled copy of `items` (Fisher-Yates), leaving `items` untouched. */
export function shuffle<T>(items: readonly T[], state: number): Draw<T[]> {
  const result = [...items]
  let current = state
  for (let i = result.length - 1; i > 0; i--) {
    const draw = nextInt(current, 0, i)
    current = draw.state
    const j = draw.value
    const swapped = result[i] as T
    result[i] = result[j] as T
    result[j] = swapped
  }
  return { value: result, state: current }
}
