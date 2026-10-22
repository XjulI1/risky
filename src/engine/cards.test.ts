import { describe, expect, it } from 'vitest'
import { isValidSet, tradeValue } from './cards'
import { applyAction } from './index'
import { classicMap } from './maps/classic'
import { apply, assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { Card, CardSymbol, GameState } from './types'

let nextCardId = 100

function card(symbol: CardSymbol, territory = 'alaska'): Card {
  nextCardId += 1
  return { id: nextCardId, symbol, territory }
}

function joker(): Card {
  nextCardId += 1
  return { id: nextCardId, symbol: 'joker', territory: null }
}

function reinforcing(hand: Card[], owned: string[] = ['north_africa'], reserve = 3): GameState {
  const state = giveAllTerritoriesTo(createTestGame(3), 'p2')
  assignTerritories(state, 'p1', owned, 3)
  state.currentPlayerIndex = 0
  state.phase = { kind: 'reinforce', reserve }
  state.hands.p1 = hand
  return state
}

function ids(cards: Card[]): [number, number, number] {
  return cards.slice(0, 3).map((c) => c.id) as [number, number, number]
}

describe('isValidSet', () => {
  it.each([
    ['three identical symbols', [card('cavalry'), card('cavalry'), card('cavalry')]],
    ['three different symbols', [card('infantry'), card('cavalry'), card('artillery')]],
    ['two cards and a joker', [card('infantry'), card('infantry'), joker()]],
    ['a card and two jokers', [card('artillery'), joker(), joker()]],
  ])('accepts %s', (_, cards) => {
    expect(isValidSet(cards)).toBe(true)
  })

  it.each([
    ['two infantry and a cavalry', [card('infantry'), card('infantry'), card('cavalry')]],
    ['two cards', [card('infantry'), card('infantry')]],
    ['four cards', [card('infantry'), card('infantry'), card('infantry'), card('infantry')]],
  ])('rejects %s', (_, cards) => {
    expect(isValidSet(cards)).toBe(false)
  })
})

describe('tradeValue', () => {
  const set = [card('infantry'), card('cavalry'), card('artillery')]

  it('follows the progressive scale 4, 6, 8, 10, 12, 15, then +5', () => {
    const values = Array.from({ length: 9 }, (_, tradeCount) => tradeValue(set, 'progressive', tradeCount))
    expect(values).toEqual([4, 6, 8, 10, 12, 15, 20, 25, 30])
  })

  it.each([
    [[card('infantry'), card('infantry'), card('infantry')], 4],
    [[card('cavalry'), card('cavalry'), card('cavalry')], 6],
    [[card('artillery'), card('artillery'), card('artillery')], 8],
    [[card('infantry'), card('cavalry'), card('artillery')], 10],
    [[card('infantry'), card('cavalry'), joker()], 10],
    [[card('artillery'), card('artillery'), joker()], 8],
    [[card('infantry'), joker(), joker()], 10],
  ])('values the fixed-scale set %# at %i', (cards, expected) => {
    expect(tradeValue(cards, 'fixed', 3)).toBe(expected)
  })
})

describe('tradeCards', () => {
  it('adds the set value to the reserve and discards the cards', () => {
    const hand = [card('infantry', 'india'), card('cavalry', 'china'), card('artillery', 'japan'), card('infantry')]
    const state = reinforcing(hand)
    const result = applyAction(state, { type: 'tradeCards', playerId: 'p1', cardIds: ids(hand) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toEqual({ kind: 'reinforce', reserve: 3 + 4 })
    expect(result.state.hands.p1).toEqual([hand[3]])
    expect(result.state.discard).toEqual(hand.slice(0, 3))
    expect(result.state.tradeCount).toBe(1)
    expect(result.events).toEqual([
      { type: 'cardsTraded', playerId: 'p1', cardIds: ids(hand), armies: 4, bonusTerritory: null },
    ])
  })

  it('rejects an invalid set', () => {
    const hand = [card('infantry'), card('infantry'), card('cavalry')]
    const result = applyAction(reinforcing(hand), { type: 'tradeCards', playerId: 'p1', cardIds: ids(hand) })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_CARD_SET' } })
  })

  it('rejects cards that are not in the hand', () => {
    const hand = [card('infantry'), card('cavalry'), card('artillery')]
    const result = applyAction(reinforcing(hand.slice(0, 2)), {
      type: 'tradeCards',
      playerId: 'p1',
      cardIds: ids(hand),
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'CARD_NOT_IN_HAND' } })
  })

  it('rejects the same card listed twice', () => {
    const hand = [card('infantry'), card('infantry'), card('infantry')]
    const first = hand[0]?.id ?? 0
    const result = applyAction(reinforcing(hand), {
      type: 'tradeCards',
      playerId: 'p1',
      cardIds: [first, first, hand[1]?.id ?? 0],
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'CARD_NOT_IN_HAND' } })
  })

  it('rejects a trade outside the reinforcement phase', () => {
    const hand = [card('infantry'), card('cavalry'), card('artillery')]
    const state = reinforcing(hand)
    state.phase = { kind: 'fortify' }
    const result = applyAction(state, { type: 'tradeCards', playerId: 'p1', cardIds: ids(hand) })
    expect(result).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } })
  })
})

describe('territory bonus', () => {
  const africa = ['madagascar', 'south_africa', 'east_africa', 'egypt']

  it('places 2 armies once, outside the reserve, on a single owned territory', () => {
    const hand = [card('infantry', 'egypt'), card('cavalry', 'east_africa'), card('artillery', 'india')]
    const result = applyAction(reinforcing(hand, africa), { type: 'tradeCards', playerId: 'p1', cardIds: ids(hand) })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toEqual({ kind: 'reinforce', reserve: 3 + 4 })
    expect(result.state.territories.egypt?.armies).toBe(5)
    expect(result.state.territories.east_africa?.armies).toBe(3)
    expect(result.events[0]).toMatchObject({ bonusTerritory: 'egypt' })
  })

  it('prefers the first eligible territory facing an enemy', () => {
    const hand = [card('infantry', 'madagascar'), card('cavalry', 'egypt'), joker()]
    const result = applyAction(reinforcing(hand, africa), { type: 'tradeCards', playerId: 'p1', cardIds: ids(hand) })
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.territories.madagascar?.armies).toBe(3)
    expect(result.state.territories.egypt?.armies).toBe(5)
  })

  it('falls back to the first eligible territory when none faces an enemy', () => {
    const allButArgentina = classicMap.territoryIds.filter((id) => id !== 'argentina')
    const hand = [card('infantry', 'madagascar'), card('cavalry', 'egypt'), joker()]
    const result = applyAction(reinforcing(hand, allButArgentina), {
      type: 'tradeCards',
      playerId: 'p1',
      cardIds: ids(hand),
    })
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.territories.madagascar?.armies).toBe(5)
    expect(result.state.territories.egypt?.armies).toBe(3)
  })
})

describe('forced trade', () => {
  const hand = [
    card('infantry', 'india'),
    card('cavalry', 'china'),
    card('artillery', 'japan'),
    card('infantry', 'peru'),
    card('cavalry', 'brazil'),
  ]

  it('blocks deployment while the player holds 5 cards', () => {
    const result = applyAction(reinforcing(hand), { type: 'deploy', playerId: 'p1', territory: 'north_africa', armies: 3 })
    expect(result).toMatchObject({ ok: false, error: { code: 'TRADE_REQUIRED' } })
  })

  it('reaches the attack phase only once a set has been traded and the reserve deployed', () => {
    const traded = apply(reinforcing(hand), { type: 'tradeCards', playerId: 'p1', cardIds: ids(hand) })
    expect(traded.phase).toEqual({ kind: 'reinforce', reserve: 7 })
    const deployed = apply(traded, { type: 'deploy', playerId: 'p1', territory: 'north_africa', armies: 7 })
    expect(deployed.phase).toEqual({ kind: 'attack' })
  })
})

describe('card draw at the end of the turn', () => {
  function attackingP1(): GameState {
    const state = giveAllTerritoriesTo(createTestGame(3), 'p2')
    assignTerritories(state, 'p1', ['north_africa'], 200)
    state.currentPlayerIndex = 0
    state.phase = { kind: 'attack' }
    return state
  }

  function conquer(state: GameState, to: string): GameState {
    const attacked = apply(state, { type: 'attack', playerId: 'p1', from: 'north_africa', to })
    if (attacked.phase.kind !== 'conquestMove') throw new Error('expected a conquest')
    return apply(attacked, { type: 'moveAfterConquest', playerId: 'p1', armies: attacked.phase.minArmies })
  }

  function endTurn(state: GameState) {
    const fortifying = apply(state, { type: 'endAttack', playerId: 'p1' })
    return applyAction(fortifying, { type: 'skipFortify', playerId: 'p1' })
  }

  it('draws exactly one card after several conquests', () => {
    const state = conquer(conquer(conquer(attackingP1(), 'egypt'), 'congo'), 'brazil')
    const result = endTurn(state)
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.hands.p1).toHaveLength(1)
    expect(result.state.deck).toHaveLength(43)
    expect(result.events.filter((event) => event.type === 'cardDrawn')).toHaveLength(1)
    expect(result.state.hands.p1?.[0]).toEqual(state.deck[0])
  })

  it('draws no card without a conquest', () => {
    const result = endTurn(attackingP1())
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.hands.p1).toHaveLength(0)
    expect(result.events.some((event) => event.type === 'cardDrawn')).toBe(false)
  })

  it('reshuffles the discard pile into the deck when the deck is empty', () => {
    const state = conquer(attackingP1(), 'egypt')
    const discarded = state.deck.slice(0, 6)
    state.discard = discarded
    state.deck = []
    const result = endTurn(state)
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.hands.p1).toHaveLength(1)
    expect(result.state.discard).toHaveLength(0)
    expect(result.state.deck).toHaveLength(5)
    const allCards = [...result.state.deck, ...(result.state.hands.p1 ?? [])].map((c) => c.id).sort()
    expect(allCards).toEqual(discarded.map((c) => c.id).sort())
  })
})
