import { describe, expect, it } from 'vitest'
import { aiRandom, fnv1a } from './aiRandom'
import { playerView } from './playerView'
import { newAiGame } from './testScenarios'

function draws(random: ReturnType<typeof aiRandom>, count = 8): number[] {
  return Array.from({ length: count }, () => random.float())
}

describe('fnv1a', () => {
  it('hashes text with the 32-bit FNV-1a function', () => {
    expect(fnv1a('')).toBe(0x811c9dc5)
    expect(fnv1a('a')).toBe(0xe40c292c)
    expect(fnv1a('foobar')).toBe(0xbf9cf968)
  })
})

describe('aiRandom', () => {
  const state = newAiGame(['normal', 'hard', 'easy'], 3)

  it('draws the same sequence for the same view and level', () => {
    expect(draws(aiRandom(playerView(state, 'p1'), 'normal'))).toEqual(
      draws(aiRandom(playerView(structuredClone(state), 'p1'), 'normal')),
    )
  })

  it('draws another sequence when the view changes', () => {
    const other = structuredClone(state)
    const territory = Object.values(other.territories)[0]
    if (territory !== undefined) {
      territory.armies += 1
    }
    expect(draws(aiRandom(playerView(other, 'p1'), 'normal'))).not.toEqual(
      draws(aiRandom(playerView(state, 'p1'), 'normal')),
    )
  })

  it('draws another sequence for another level', () => {
    const view = playerView(state, 'p1')
    expect(draws(aiRandom(view, 'easy'))).not.toEqual(draws(aiRandom(view, 'normal')))
  })

  it('ignores the generator state of the game', () => {
    const other = structuredClone(state)
    other.rngState += 99
    expect(draws(aiRandom(playerView(other, 'p1'), 'easy'))).toEqual(draws(aiRandom(playerView(state, 'p1'), 'easy')))
  })

  it('draws integers within the bounds and picks among the items', () => {
    const random = aiRandom(playerView(state, 'p1'), 'easy')
    for (let i = 0; i < 50; i++) {
      const value = random.int(2, 5)
      expect(value).toBeGreaterThanOrEqual(2)
      expect(value).toBeLessThanOrEqual(5)
      expect(['a', 'b']).toContain(random.pick(['a', 'b']))
    }
    expect(random.pick([])).toBeUndefined()
  })
})
