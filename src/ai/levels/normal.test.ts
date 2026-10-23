import { describe, expect, it } from 'vitest'
import { classicMap, GENERAL_MISSIONS, type GameState, type Mission } from '../../engine'
import { isBorder } from '../evaluation'
import { playerView } from '../playerView'
import { decide, mustEliminateCarol, newAiGame, playWhile, scenario, territoryCard, type Scenario } from '../testScenarios'

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

  describe('with a secret mission', () => {
    const ASIA_AND_AFRICA = GENERAL_MISSIONS[3] as Mission
    const EIGHTEEN_WITH_TWO = GENERAL_MISSIONS[7] as Mission

    function nearOceaniaWithAfricanFront(missions?: Scenario['missions']): GameState {
      return scenario({
        layout: {
          indonesia: ['p1', 2],
          new_guinea: ['p1', 2],
          western_australia: ['p1', 2],
          eastern_australia: ['p2', 2],
          north_africa: ['p1', 2],
          egypt: ['p1', 2],
          east_africa: ['p1', 2],
          middle_east: ['p1', 2],
        },
        phase: { kind: 'reinforce', reserve: 5 },
        missions,
      })
    }

    function deployedOn(start: GameState): string[] {
      const { steps } = playWhile(start, 'normal', (current) => current.phase.kind === 'reinforce')
      return steps.flatMap(({ action }) => (action.type === 'deploy' ? [action.territory] : []))
    }

    const continentOf = (territory: string) => classicMap.territories[territory]?.continent

    it('reinforces a border of Asia or Africa for the mission « Asie et Afrique »', () => {
      expect(deployedOn(nearOceaniaWithAfricanFront()).every((territory) => continentOf(territory) === 'australia')).toBe(true)
      const deployed = deployedOn(nearOceaniaWithAfricanFront({ p1: ASIA_AND_AFRICA }))
      expect(deployed.length).toBeGreaterThan(0)
      expect(deployed.every((territory) => ['asia', 'africa'].includes(continentOf(territory) ?? ''))).toBe(true)
    })

    function conquestFromSix(missions?: Scenario['missions']): GameState {
      return scenario({
        layout: {
          indonesia: ['p1', 6],
          siam: ['p1', 0],
          new_guinea: ['p1', 1],
          western_australia: ['p1', 1],
          eastern_australia: ['p1', 1],
        },
        phase: { kind: 'conquestMove', from: 'indonesia', to: 'siam', minArmies: 2, maxArmies: 5 },
        missions,
      })
    }

    it('leaves 2 armies on both sides of a conquest for the mission « 18 territoires à 2 armées »', () => {
      expect(decide(conquestFromSix(), 'normal')).toMatchObject({ armies: 5 })
      const action = decide(conquestFromSix({ p1: EIGHTEEN_WITH_TWO }), 'normal')
      expect(action.type).toBe('moveAfterConquest')
      if (action.type === 'moveAfterConquest') {
        expect(action.armies).toBeGreaterThanOrEqual(2)
        expect(6 - action.armies).toBeGreaterThanOrEqual(2)
      }
    })

    it('attacks a territory of its target at 0.7 rather than another one at 0.9', () => {
      expect(decide(mustEliminateCarol(false), 'normal')).toMatchObject({ type: 'attack', to: 'eastern_australia' })
      expect(decide(mustEliminateCarol(true), 'normal')).toMatchObject({ type: 'attack', to: 'siam' })
    })
  })
})
