import { describe, expect, it } from 'vitest'
import { NEUTRAL_PLAYER_ID, type TerritoryId } from '../engine'
import {
  borderTerritories,
  continentEntries,
  continentScore,
  interiorTerritories,
  isBorder,
  targetContinent,
  threat,
} from './evaluation'
import { playerView, type PlayerView } from './playerView'
import { scenario } from './testScenarios'

const AUSTRALIA: TerritoryId[] = ['indonesia', 'new_guinea', 'western_australia', 'eastern_australia']

function view(layout: Record<TerritoryId, [string, number]>): PlayerView {
  return playerView(scenario({ layout, phase: { kind: 'attack' } }), 'p1')
}

describe('borders', () => {
  const owningAustralia = view(Object.fromEntries(AUSTRALIA.map((id) => [id, ['p1', 3]])))

  it('tells border territories, facing an enemy, from interior ones', () => {
    expect(isBorder(owningAustralia, 'indonesia')).toBe(true)
    expect(isBorder(owningAustralia, 'new_guinea')).toBe(false)
    expect(borderTerritories(owningAustralia, 'p1')).toEqual(['indonesia'])
    expect(interiorTerritories(owningAustralia, 'p1')).toEqual(['eastern_australia', 'new_guinea', 'western_australia'])
  })
})

describe('continents', () => {
  it('counts the territories of a continent reachable from outside', () => {
    const VIEW = view({})
    expect(continentEntries(VIEW, 'australia')).toBe(1)
    expect(continentEntries(VIEW, 'southAmerica')).toBe(2)
    expect(continentEntries(VIEW, 'africa')).toBe(3)
    expect(continentEntries(VIEW, 'northAmerica')).toBe(3)
    expect(continentEntries(VIEW, 'europe')).toBe(4)
    expect(continentEntries(VIEW, 'asia')).toBe(5)
  })

  it('favors a continent that is almost complete', () => {
    const threeOfFour = view({ indonesia: ['p1', 2], new_guinea: ['p1', 2], western_australia: ['p1', 2] })
    const twoOfFour = view({ indonesia: ['p1', 2], new_guinea: ['p1', 2] })
    expect(continentScore(threeOfFour, 'p1', 'australia')).toBeGreaterThan(2 * continentScore(twoOfFour, 'p1', 'australia'))
  })

  it('weighs the bonus against the borders to hold', () => {
    const halfOfEach = view({
      indonesia: ['p1', 2],
      new_guinea: ['p1', 2],
      siberia: ['p1', 2],
      ural: ['p1', 2],
      china: ['p1', 2],
      mongolia: ['p1', 2],
      india: ['p1', 2],
      siam: ['p1', 2],
    })
    expect(continentScore(halfOfEach, 'p1', 'australia')).toBeGreaterThan(continentScore(halfOfEach, 'p1', 'asia'))
  })

  it('targets the best continent not yet held', () => {
    const layout = Object.fromEntries(
      [...AUSTRALIA, 'venezuela', 'peru', 'brazil', 'egypt'].map((id): [string, [string, number]] => [id, ['p1', 2]]),
    )
    expect(targetContinent(view(layout), 'p1')).toBe('southAmerica')
  })
})

describe('threat', () => {
  it('grows with the enemy armies next to a border', () => {
    const weak = view({ indonesia: ['p1', 3], siam: ['p2', 2] })
    const strong = view({ indonesia: ['p1', 3], siam: ['p2', 8] })
    expect(threat(strong, 'indonesia')).toBeGreaterThan(threat(weak, 'indonesia'))
  })

  it('shrinks when the border holds more armies', () => {
    const thin = view({ indonesia: ['p1', 2], siam: ['p2', 6] })
    const thick = view({ indonesia: ['p1', 10], siam: ['p2', 6] })
    expect(threat(thick, 'indonesia')).toBeLessThan(threat(thin, 'indonesia'))
  })

  it('ignores the neutral army, which never attacks', () => {
    const state = scenario({ layout: { indonesia: ['p1', 3] }, phase: { kind: 'attack' }, playerCount: 2, filler: NEUTRAL_PLAYER_ID })
    expect(threat(playerView(state, 'p1'), 'indonesia')).toBe(0)
  })
})
