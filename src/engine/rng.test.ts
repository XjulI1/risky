import { describe, expect, it } from 'vitest'
import { nextFloat, nextInt, shuffle } from './rng'

function drawInts(seed: number, count: number, min: number, max: number): number[] {
  const values: number[] = []
  let state = seed
  for (let i = 0; i < count; i++) {
    const draw = nextInt(state, min, max)
    values.push(draw.value)
    state = draw.state
  }
  return values
}

describe('nextFloat', () => {
  it('returns the same sequence for the same seed', () => {
    const first = nextFloat(42)
    const second = nextFloat(42)
    expect(second).toEqual(first)
    expect(nextFloat(first.state)).toEqual(nextFloat(second.state))
  })

  it('returns different sequences for different seeds', () => {
    expect(nextFloat(1).value).not.toBe(nextFloat(2).value)
  })

  it('returns values in [0, 1)', () => {
    let state = 7
    for (let i = 0; i < 1000; i++) {
      const draw = nextFloat(state)
      expect(draw.value).toBeGreaterThanOrEqual(0)
      expect(draw.value).toBeLessThan(1)
      state = draw.state
    }
  })
})

describe('nextInt', () => {
  it('returns the same integers for the same seed', () => {
    expect(drawInts(123, 20, 1, 6)).toEqual(drawInts(123, 20, 1, 6))
  })

  it('stays within the inclusive bounds and reaches both of them', () => {
    const values = drawInts(99, 2000, 1, 6)
    expect(values.every((value) => Number.isInteger(value) && value >= 1 && value <= 6)).toBe(true)
    expect(new Set(values)).toEqual(new Set([1, 2, 3, 4, 5, 6]))
  })

  it('returns the bound when min equals max', () => {
    expect(nextInt(5, 3, 3).value).toBe(3)
  })
})

describe('shuffle', () => {
  const items = Array.from({ length: 44 }, (_, i) => i)

  it('is deterministic for a given state', () => {
    expect(shuffle(items, 2026)).toEqual(shuffle(items, 2026))
  })

  it('keeps every element exactly once', () => {
    const { value } = shuffle(items, 2026)
    expect([...value].sort((a, b) => a - b)).toEqual(items)
  })

  it('changes the order', () => {
    expect(shuffle(items, 2026).value).not.toEqual(items)
  })

  it('does not mutate its input', () => {
    const input = [...items]
    shuffle(input, 2026)
    expect(input).toEqual(items)
  })
})
