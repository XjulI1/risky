import { describe, expect, it } from 'vitest'
import type { AiLevel, GameState, TerritoryId } from '../engine'
import { decide, scenario, type Scenario } from './testScenarios'

const SMART_LEVELS: AiLevel[] = ['normal', 'hard']

function capitalChoice(layout: Scenario['layout'], pending: Record<string, TerritoryId> = {}): GameState {
  return scenario({ layout, phase: { kind: 'capitalChoice', pending }, settings: { capitals: true } })
}

const australiaHeld: Scenario['layout'] = {
  indonesia: ['p1', 9],
  new_guinea: ['p1', 1],
  western_australia: ['p1', 3],
  eastern_australia: ['p1', 2],
  siam: ['p2', 5],
}

describe('capital choice of the AIs', () => {
  it('makes the easy AI choose its territory holding the most armies', () => {
    const state = capitalChoice({ egypt: ['p1', 5], peru: ['p1', 2], ural: ['p1', 4], kamchatka: ['p3', 1] })
    expect(decide(state, 'easy')).toEqual({ type: 'chooseCapital', playerId: 'p1', territory: 'egypt' })
  })

  it.each(SMART_LEVELS)('makes the %s AI choose an interior territory, then the one holding the most armies', (level) => {
    const state = capitalChoice({ ...australiaHeld, kamchatka: ['p3', 1] })
    expect(decide(state, level)).toEqual({ type: 'chooseCapital', playerId: 'p1', territory: 'western_australia' })
  })

  it.each(SMART_LEVELS)('makes the %s AI prefer the least threatened border without an interior territory', (level) => {
    const state = capitalChoice({
      egypt: ['p1', 6],
      middle_east: ['p2', 8],
      peru: ['p1', 2],
      brazil: ['p3', 1],
      argentina: ['p3', 1],
      venezuela: ['p3', 1],
      kamchatka: ['p3', 1],
    })
    expect(decide(state, level)).toEqual({ type: 'chooseCapital', playerId: 'p1', territory: 'peru' })
  })

  it.each<AiLevel>(['easy', 'normal', 'hard'])('makes the %s AI choose the same capital whatever the others chose', (level) => {
    const layout = { ...australiaHeld, kamchatka: ['p3', 1] } satisfies Scenario['layout']
    const pendings: Record<string, TerritoryId>[] = [{}, { p3: 'kamchatka' }, { p3: 'ural' }]
    const choices = pendings.map((pending) => decide(capitalChoice(layout, pending), level))
    expect(new Set(choices.map((choice) => JSON.stringify(choice))).size).toBe(1)
  })
})

describe('capital strategy of the AIs', () => {
  const capitals = { p1: 'egypt', p2: 'alaska', p3: 'kamchatka' }

  it.each(SMART_LEVELS)('makes the %s AI put its whole reserve on its threatened capital', (level) => {
    const state = scenario({
      layout: {
        egypt: ['p1', 3],
        north_africa: ['p1', 1],
        east_africa: ['p1', 1],
        middle_east: ['p2', 4],
        southern_europe: ['p3', 2],
        kamchatka: ['p3', 1],
        indonesia: ['p1', 2],
        new_guinea: ['p1', 2],
        western_australia: ['p1', 2],
        eastern_australia: ['p2', 1],
      },
      phase: { kind: 'reinforce', reserve: 5 },
      settings: { capitals: true },
      capitals,
    })
    expect(decide(state, level)).toEqual({ type: 'deploy', playerId: 'p1', territory: 'egypt', armies: 5 })
  })

  it.each(SMART_LEVELS)('makes the %s AI reconquer its capital first from a probability of 0.6', (level) => {
    const state = scenario({
      layout: {
        egypt: ['p2', 3],
        middle_east: ['p1', 6],
        indonesia: ['p1', 2],
        new_guinea: ['p1', 9],
        western_australia: ['p1', 2],
        eastern_australia: ['p2', 1],
        kamchatka: ['p3', 1],
      },
      phase: { kind: 'attack' },
      settings: { capitals: true },
      capitals,
    })
    expect(decide(state, level)).toEqual({ type: 'attack', playerId: 'p1', from: 'middle_east', to: 'egypt' })
  })

  function againstBobsCapital(attackers: number, defenders: number): GameState {
    return scenario({
      layout: {
        middle_east: ['p1', attackers],
        egypt: ['p2', defenders],
        east_africa: ['p1', 1],
        southern_europe: ['p1', 1],
        ukraine: ['p1', 1],
        afghanistan: ['p1', 1],
        india: ['p1', 1],
        kamchatka: ['p3', 1],
      },
      phase: { kind: 'attack' },
      settings: { capitals: true },
      capitals: { p1: 'india', p2: 'egypt', p3: 'kamchatka' },
    })
  }

  it.each(SMART_LEVELS)('makes the %s AI attack an enemy capital from a bonified probability of 0.5', (level) => {
    expect(decide(againstBobsCapital(8, 5), level)).toEqual({ type: 'attack', playerId: 'p1', from: 'middle_east', to: 'egypt' })
    expect(decide(againstBobsCapital(4, 2), level)).toEqual({ type: 'endAttack', playerId: 'p1' })
  })

  function lastCapitalMissing(layout: Scenario['layout']): GameState {
    return scenario({
      layout: {
        egypt: ['p1', 10],
        brazil: ['p1', 4],
        kamchatka: ['p3', 6],
        yakutsk: ['p3', 1],
        irkutsk: ['p3', 1],
        mongolia: ['p3', 1],
        japan: ['p3', 1],
        ...layout,
      },
      phase: { kind: 'reinforce', reserve: 7 },
      settings: { capitals: true },
      capitals: { p1: 'egypt', p2: 'brazil', p3: 'kamchatka' },
    })
  }

  it('makes the hard AI put its whole reserve next to the last capital it lacks', () => {
    const state = lastCapitalMissing({ alaska: ['p1', 2], northwest_territory: ['p1', 8] })
    expect(decide(state, 'hard')).toEqual({ type: 'deploy', playerId: 'p1', territory: 'alaska', armies: 7 })
  })

  it('makes the hard AI put its whole reserve on its territory closest to the last capital it lacks', () => {
    const state = lastCapitalMissing({ alaska: ['p3', 1], northwest_territory: ['p1', 2], ural: ['p1', 3] })
    expect(decide(state, 'hard')).toEqual({ type: 'deploy', playerId: 'p1', territory: 'northwest_territory', armies: 7 })
  })
})
