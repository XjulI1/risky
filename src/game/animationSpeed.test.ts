import { describe, expect, it } from 'vitest'
import {
  ANIMATION_DURATIONS,
  ANIMATION_SPEEDS,
  readSpeedPreference,
  SPEED_STORAGE_KEY,
  writeSpeedPreference,
} from './animationSpeed'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    values,
  }
}

const throwingStorage = {
  getItem: () => {
    throw new Error('blocked')
  },
  setItem: () => {
    throw new Error('blocked')
  },
}

describe('animation durations', () => {
  it('offers normal, fast and instant speeds', () => {
    expect(ANIMATION_SPEEDS).toEqual(['normal', 'fast', 'instant'])
  })

  it('gets shorter from normal to fast', () => {
    const { normal, fast } = ANIMATION_DURATIONS
    for (const key of Object.keys(normal) as (keyof typeof normal)[]) {
      expect(normal[key]).toBeGreaterThan(fast[key])
    }
  })

  it('makes every following roll of an attack faster than the first one', () => {
    for (const speed of ['normal', 'fast'] as const) {
      expect(ANIMATION_DURATIONS[speed].nextRoll).toBeLessThan(ANIMATION_DURATIONS[speed].firstRoll)
    }
  })

  it('animates nothing at the instant speed', () => {
    expect(Object.values(ANIMATION_DURATIONS.instant).every((duration) => duration === 0)).toBe(true)
  })
})

describe('speed preference', () => {
  it('reads the stored speed', () => {
    expect(readSpeedPreference(memoryStorage({ [SPEED_STORAGE_KEY]: 'fast' }), false)).toBe('fast')
  })

  it('writes the chosen speed', () => {
    const storage = memoryStorage()
    writeSpeedPreference('instant', storage)
    expect(storage.values.get(SPEED_STORAGE_KEY)).toBe('instant')
  })

  it('defaults to normal without a stored speed', () => {
    expect(readSpeedPreference(memoryStorage(), false)).toBe('normal')
  })

  it('ignores the slow speed remembered by an older version', () => {
    expect(readSpeedPreference(memoryStorage({ [SPEED_STORAGE_KEY]: 'slow' }), false)).toBe('normal')
  })

  it('ignores an unknown stored value', () => {
    expect(readSpeedPreference(memoryStorage({ [SPEED_STORAGE_KEY]: 'warp' }), false)).toBe('normal')
  })

  it('defaults to instant when the system asks for reduced motion', () => {
    expect(readSpeedPreference(memoryStorage(), true)).toBe('instant')
  })

  it('keeps a stored speed even with reduced motion', () => {
    expect(readSpeedPreference(memoryStorage({ [SPEED_STORAGE_KEY]: 'fast' }), true)).toBe('fast')
  })

  it('falls back to the default when the storage throws', () => {
    expect(readSpeedPreference(throwingStorage, false)).toBe('normal')
    expect(() => writeSpeedPreference('fast', throwingStorage)).not.toThrow()
  })

  it('falls back to the default without any storage', () => {
    expect(readSpeedPreference(null, false)).toBe('normal')
  })
})
