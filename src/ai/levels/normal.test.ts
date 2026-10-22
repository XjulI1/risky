import { describe, expect, it } from 'vitest'
import { classicMap } from '../../engine'
import { isBorder } from '../evaluation'
import { playerView } from '../playerView'
import { decide, newAiGame, playWhile, scenario, territoryCard } from '../testScenarios'

function indonesiaAgainstSiam(originArmies: number, siamArmies: number) {
  return scenario({
    layout: {
      indonesia: ['p1', originArmies],
      new_guinea: ['p1', 1],
      western_australia: ['p1', 1],
      eastern_australia: ['p1', 1],
      siam: ['p2', siamArmies],
    },
    phase: { kind: 'attack' },
  })
}

describe('normal AI', () => {
  it('reinforces next to the last territory of Oceania and attacks it', () => {
    const start = scenario({
      layout: {
        indonesia: ['p1', 2],
        new_guinea: ['p1', 2],
        western_australia: ['p1', 2],
        eastern_australia: ['p2', 2],
        siam: ['p2', 1],
      },
      phase: { kind: 'reinforce', reserve: 3 },
    })
    const { state, steps } = playWhile(start, 'normal', (current) => current.phase.kind === 'reinforce')
    for (const { action } of steps) {
      expect(action.type).toBe('deploy')
      if (action.type === 'deploy') {
        expect(classicMap.territories[action.territory]?.neighbors).toContain('eastern_australia')
      }
    }
    expect(decide(state, 'normal')).toMatchObject({ type: 'attack', to: 'eastern_australia' })
  })

  it('never reinforces a territory without an enemy neighbor', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { steps } = playWhile(newAiGame(['normal', 'normal', 'normal'], seed), 'normal', (current) => current.phase.kind === 'reinforce')
      expect(steps.length).toBeGreaterThan(0)
      for (const { before, action } of steps) {
        if (action.type === 'deploy') {
          expect(isBorder(playerView(before, action.playerId), action.territory)).toBe(true)
        }
      }
    }
  })

  it('attacks from a probability of conquest of 0.6', () => {
    expect(decide(indonesiaAgainstSiam(5, 3), 'normal')).toEqual({ type: 'attack', playerId: 'p1', from: 'indonesia', to: 'siam' })
    expect(decide(indonesiaAgainstSiam(6, 5), 'normal')).toEqual({ type: 'endAttack', playerId: 'p1' })
    expect(decide(indonesiaAgainstSiam(5, 4), 'normal')).toEqual({ type: 'endAttack', playerId: 'p1' })
  })

  it('trades a set as soon as it has one', () => {
    const state = scenario({
      layout: { indonesia: ['p1', 3], siam: ['p2', 3] },
      phase: { kind: 'reinforce', reserve: 3 },
      hands: { p1: [territoryCard(1, 'infantry', 'alaska'), territoryCard(2, 'cavalry', 'peru'), territoryCard(3, 'artillery', 'japan')] },
    })
    expect(decide(state, 'normal')).toEqual({ type: 'tradeCards', playerId: 'p1', cardIds: [1, 2, 3] })
  })

  it('moves 5 armies from an interior territory of 6 to the front', () => {
    const state = scenario({
      layout: {
        indonesia: ['p1', 2],
        new_guinea: ['p1', 6],
        western_australia: ['p1', 1],
        eastern_australia: ['p1', 1],
      },
      phase: { kind: 'fortify' },
    })
    expect(decide(state, 'normal')).toEqual({ type: 'fortify', playerId: 'p1', from: 'new_guinea', to: 'indonesia', armies: 5 })
  })

  it('claims Oceania first', () => {
    const state = newAiGame(['normal', 'normal', 'normal'], 1, { territoryDistribution: 'choice' })
    const action = decide(state, 'normal')
    expect(action.type).toBe('claimTerritory')
    if (action.type === 'claimTerritory') {
      expect(classicMap.territories[action.territory]?.continent).toBe('australia')
    }
  })
})
