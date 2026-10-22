import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { NEUTRAL_PLAYER_ID } from './setup'
import { apply, assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { Card, CardSymbol, GameState } from './types'

let nextCardId = 500

function cards(...symbols: CardSymbol[]): Card[] {
  return symbols.map((symbol) => {
    nextCardId += 1
    return { id: nextCardId, symbol, territory: 'japan' }
  })
}

function lastStand(playerCount = 3): GameState {
  const state = giveAllTerritoriesTo(createTestGame(playerCount), 'p2')
  assignTerritories(state, 'p1', ['north_africa'], 60)
  assignTerritories(state, 'p3', ['brazil'], 1)
  state.currentPlayerIndex = 0
  state.phase = { kind: 'attack' }
  return state
}

function attackBrazil(state: GameState) {
  return applyAction(state, { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' })
}

describe('elimination', () => {
  it('eliminates a player who loses the last territory and hands the cards to the attacker', () => {
    const state = lastStand()
    state.hands.p3 = cards('infantry', 'cavalry')
    const result = attackBrazil(state)
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.players.find((p) => p.id === 'p3')?.eliminated).toBe(true)
    expect(result.state.hands.p1).toEqual(state.hands.p3)
    expect(result.state.hands.p3).toEqual([])
    expect(result.events.at(-1)).toEqual({ type: 'playerEliminated', playerId: 'p3', by: 'p1', cardsTaken: 2 })
    expect(result.events.at(-2)?.type).toBe('territoryConquered')
  })

  it('keeps the game going while other players remain', () => {
    const result = attackBrazil(lastStand())
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.phase.kind).toBe('conquestMove')
    expect(result.state.winner).toBeNull()
  })

  it('skips eliminated players in the turn order', () => {
    const state = lastStand()
    state.players = state.players.map((p) => (p.id === 'p3' ? { ...p, eliminated: true } : p))
    state.currentPlayerIndex = 1
    state.phase = { kind: 'fortify' }
    const result = applyAction(state, { type: 'skipFortify', playerId: 'p2' })
    expect(result).toMatchObject({ ok: true, state: { currentPlayerIndex: 0 } })
  })
})

describe('forced trade after an elimination', () => {
  function conquestWithHands(attackerCards: Card[], defenderCards: Card[]): GameState {
    const state = lastStand()
    state.hands.p1 = attackerCards
    state.hands.p3 = defenderCards
    const attacked = apply(state, { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' })
    if (attacked.phase.kind !== 'conquestMove') throw new Error('expected a conquest')
    return apply(attacked, { type: 'moveAfterConquest', playerId: 'p1', armies: attacked.phase.minArmies })
  }

  it('requires trading down to 4 cards or fewer, then deploying, before attacking again', () => {
    const state = conquestWithHands(cards('infantry', 'infantry', 'infantry'), cards('cavalry', 'cavalry', 'artillery', 'artillery'))
    expect(state.hands.p1).toHaveLength(7)
    expect(state.phase).toEqual({ kind: 'eliminationTrade', reserve: 0 })

    const blocked = applyAction(state, { type: 'deploy', playerId: 'p1', territory: 'brazil', armies: 1 })
    expect(blocked).toMatchObject({ ok: false, error: { code: 'TRADE_REQUIRED' } })
    expect(applyAction(state, { type: 'endAttack', playerId: 'p1' })).toMatchObject({
      ok: false,
      error: { code: 'WRONG_PHASE' },
    })

    const set = (state.hands.p1 ?? []).slice(0, 3).map((c) => c.id) as [number, number, number]
    const traded = apply(state, { type: 'tradeCards', playerId: 'p1', cardIds: set })
    expect(traded.hands.p1).toHaveLength(4)
    expect(traded.phase).toEqual({ kind: 'eliminationTrade', reserve: 4 })

    const deployed = apply(traded, { type: 'deploy', playerId: 'p1', territory: 'brazil', armies: 4 })
    expect(deployed.phase).toEqual({ kind: 'attack' })
  })

  it('does not require any trade below 6 cards', () => {
    const state = conquestWithHands(cards('infantry'), cards('cavalry', 'artillery'))
    expect(state.hands.p1).toHaveLength(3)
    expect(state.phase).toEqual({ kind: 'attack' })
  })
})

describe('victory', () => {
  it('ends the game when the last opponent is eliminated', () => {
    const state = lastStand()
    state.players = state.players.map((p) => (p.id === 'p2' ? { ...p, eliminated: true } : p))
    assignTerritories(state, 'p1', Object.keys(state.territories).filter((id) => id !== 'brazil'), 2)
    assignTerritories(state, 'p1', ['north_africa'], 60)
    const result = attackBrazil(state)
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.phase).toEqual({ kind: 'gameOver' })
    expect(result.state.winner).toBe('p1')
    expect(result.events.at(-1)).toEqual({ type: 'gameWon', playerId: 'p1' })
  })

  it('moves the minimum armies into the last conquered territory', () => {
    const state = lastStand(2)
    assignTerritories(state, 'p2', ['brazil'], 1)
    assignTerritories(
      state,
      NEUTRAL_PLAYER_ID,
      Object.keys(state.territories).filter((id) => !['brazil', 'north_africa'].includes(id)),
    )
    const result = attackBrazil(state)
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.winner).toBe('p1')
    expect(result.state.territories.brazil?.armies).toBeGreaterThanOrEqual(1)
    expect(result.events.some((event) => event.type === 'conquestMoved')).toBe(true)
    const totalP1 = (result.state.territories.brazil?.armies ?? 0) + (result.state.territories.north_africa?.armies ?? 0)
    const losses = result.events.reduce((sum, e) => (e.type === 'diceRolled' ? sum + e.attackerLosses : sum), 0)
    expect(totalP1).toBe(60 - losses)
  })

  it('declares the winner of a 2-player game even though the neutral army still holds territories', () => {
    const state = lastStand(2)
    assignTerritories(state, 'p2', ['brazil'], 1)
    assignTerritories(
      state,
      NEUTRAL_PLAYER_ID,
      Object.keys(state.territories).filter((id) => !['brazil', 'north_africa'].includes(id)),
    )
    const result = attackBrazil(state)
    if (!result.ok) throw new Error(result.error.code)
    expect(result.state.phase).toEqual({ kind: 'gameOver' })
    expect(result.state.winner).toBe('p1')
  })

  it('rejects any action once the game is over', () => {
    const state = lastStand()
    state.phase = { kind: 'gameOver' }
    state.winner = 'p1'
    const result = applyAction(state, { type: 'endAttack', playerId: 'p1' })
    expect(result).toMatchObject({ ok: false, error: { code: 'GAME_OVER' } })
  })
})
