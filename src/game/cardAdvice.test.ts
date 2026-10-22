import { describe, expect, it } from 'vitest'
import { createGame, type Card, type CardTradeScale, type GameState } from '../engine'
import { bestTrade, tradeOffer } from './cardAdvice'

const infantry = (id: number, territory = 'japan'): Card => ({ id, symbol: 'infantry', territory })
const cavalry = (id: number, territory = 'japan'): Card => ({ id, symbol: 'cavalry', territory })
const artillery = (id: number, territory = 'japan'): Card => ({ id, symbol: 'artillery', territory })

function game(hand: Card[], cardTradeScale: CardTradeScale = 'progressive', tradeCount = 0): GameState {
  const created = createGame({
    seed: 4,
    settings: { cardTradeScale },
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  for (const id of Object.keys(state.territories)) {
    state.territories[id] = { owner: 'p2', armies: 1 }
  }
  state.territories.peru = { owner: 'p1', armies: 3 }
  state.hands.p1 = hand
  state.tradeCount = tradeCount
  return state
}

describe('tradeOffer', () => {
  it('values a mixed set at 4 armies for the first trade of the game', () => {
    const hand = [infantry(1), cavalry(2), artillery(3)]
    expect(tradeOffer(game(hand), 'p1', [1, 2, 3])).toEqual({
      cardIds: [1, 2, 3],
      armies: 4,
      bonusTerritory: null,
      total: 4,
    })
  })

  it('follows the progressive scale with the number of trades already made', () => {
    const hand = [infantry(1), cavalry(2), artillery(3)]
    expect(tradeOffer(game(hand, 'progressive', 6), 'p1', [1, 2, 3])?.total).toBe(20)
  })

  it('follows the fixed scale with the composition of the set', () => {
    const hand = [artillery(1), artillery(2), artillery(3)]
    expect(tradeOffer(game(hand, 'fixed'), 'p1', [1, 2, 3])?.total).toBe(8)
  })

  it('includes the territory bonus', () => {
    const hand = [infantry(1, 'peru'), cavalry(2), artillery(3)]
    expect(tradeOffer(game(hand), 'p1', [1, 2, 3])).toMatchObject({ armies: 4, bonusTerritory: 'peru', total: 6 })
  })

  it('returns nothing for an invalid set', () => {
    const hand = [infantry(1), infantry(2), cavalry(3)]
    expect(tradeOffer(game(hand), 'p1', [1, 2, 3])).toBeNull()
  })

  it('returns nothing for cards that are not in the hand', () => {
    expect(tradeOffer(game([infantry(1), cavalry(2)]), 'p1', [1, 2, 9])).toBeNull()
  })
})

describe('bestTrade', () => {
  it('suggests the set worth the most armies', () => {
    const hand = [infantry(1), infantry(2), infantry(3), cavalry(4), artillery(5)]
    expect(bestTrade(game(hand, 'fixed'), 'p1')?.total).toBe(10)
  })

  it('prefers the set with a territory bonus when values are equal', () => {
    const hand = [infantry(1), infantry(2), infantry(3), cavalry(4, 'peru'), artillery(5)]
    expect(bestTrade(game(hand), 'p1')).toMatchObject({ bonusTerritory: 'peru', total: 6 })
  })

  it('suggests nothing without a valid set', () => {
    expect(bestTrade(game([infantry(1), infantry(2), cavalry(3)]), 'p1')).toBeNull()
  })
})
