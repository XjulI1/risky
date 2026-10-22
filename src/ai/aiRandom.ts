import { nextFloat, nextInt, type AiLevel } from '../engine'
import type { PlayerView } from './playerView'

/** Random draws derived from what the AI sees only: the same view and level always give the same draws. */
export type AiRandom = {
  float: () => number
  int: (min: number, max: number) => number
  pick: <T>(items: readonly T[]) => T | undefined
}

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

/** 32-bit FNV-1a hash of the UTF-16 code units of `text`. */
export function fnv1a(text: string): number {
  let hash = FNV_OFFSET_BASIS
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME)
  }
  return hash >>> 0
}

/** A generator seeded with the hash of the serialized view and the level, computed at the first draw. */
export function aiRandom(view: PlayerView, level: AiLevel): AiRandom {
  let state: number | null = null
  const currentState = () => state ?? fnv1a(`${level}:${JSON.stringify(view)}`)

  const int = (min: number, max: number) => {
    const draw = nextInt(currentState(), min, max)
    state = draw.state
    return draw.value
  }

  return {
    float: () => {
      const draw = nextFloat(currentState())
      state = draw.state
      return draw.value
    },
    int,
    pick: <T>(items: readonly T[]) => (items.length === 0 ? undefined : items[int(0, items.length - 1)]),
  }
}
