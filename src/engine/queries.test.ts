import { describe, expect, it } from 'vitest'
import { attackOrigins, attackTargets, expectedReinforcement, fortifyDestinations, tradeableSets } from './queries'
import { assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { Card, FortifyMode, GameState } from './types'

function board(fortifyMode: FortifyMode = 'connected'): GameState {
  const state = giveAllTerritoriesTo(createTestGame(3, { settings: { fortifyMode } }), 'p2')
  assignTerritories(state, 'p1', ['north_africa', 'egypt', 'middle_east'], 1)
  assignTerritories(state, 'p1', ['north_africa'], 5)
  return state
}

describe('expectedReinforcement', () => {
  it('returns the reserve the player would receive at the start of a turn', () => {
    expect(expectedReinforcement(board(), 'p1')).toBe(3)
  })
})

describe('attackOrigins', () => {
  it('lists owned territories with at least 2 armies and an enemy neighbor', () => {
    expect(attackOrigins(board(), 'p1')).toEqual(['north_africa'])
  })
})

describe('attackTargets', () => {
  it('lists the enemy neighbors of an origin', () => {
    expect(attackTargets(board(), 'north_africa').sort()).toEqual(
      ['brazil', 'congo', 'east_africa', 'southern_europe', 'western_europe'].sort(),
    )
  })

  it('is empty for an origin with a single army', () => {
    expect(attackTargets(board(), 'egypt')).toEqual([])
  })
})

describe('fortifyDestinations', () => {
  it('lists own neighbors in adjacent mode', () => {
    expect(fortifyDestinations(board('adjacent'), 'north_africa')).toEqual(['egypt'])
  })

  it('lists every territory reachable through own territories in connected mode', () => {
    expect(fortifyDestinations(board(), 'north_africa').sort()).toEqual(['egypt', 'middle_east'])
  })

  it('is empty for an origin with a single army', () => {
    expect(fortifyDestinations(board(), 'egypt')).toEqual([])
  })
})

describe('tradeableSets', () => {
  const hand: Card[] = [
    { id: 1, symbol: 'infantry', territory: 'alaska' },
    { id: 2, symbol: 'infantry', territory: 'peru' },
    { id: 3, symbol: 'infantry', territory: 'china' },
    { id: 4, symbol: 'cavalry', territory: 'india' },
  ]

  it('lists every valid set in a hand', () => {
    expect(tradeableSets(hand)).toEqual([[1, 2, 3]])
  })

  it('includes sets completed by a joker', () => {
    const withJoker: Card[] = [...hand.slice(2), { id: 9, symbol: 'joker', territory: null }]
    expect(tradeableSets(withJoker)).toEqual([[3, 4, 9]])
  })

  it('is empty when no set can be formed', () => {
    expect(tradeableSets(hand.slice(2))).toEqual([])
  })
})
