import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { currentPlayer } from './state'
import { createTestGame, deepFreeze, ownedBy, placeAll } from './testUtils'
import type { Action, GameState } from './types'

function reinforcingGame(): GameState {
  return placeAll(createTestGame(3, { seed: 11 }))
}

function deployAction(state: GameState): Extract<Action, { type: 'deploy' }> {
  const playerId = currentPlayer(state).id
  return { type: 'deploy', playerId, territory: ownedBy(state, playerId)[0] as string, armies: 1 }
}

describe('applyAction validation', () => {
  it('rejects an action from a player whose turn it is not', () => {
    const state = createTestGame(3, { settings: { armyPlacement: 'manual' } })
    const other = state.players.find((player) => player.id !== currentPlayer(state).id)
    const result = applyAction(state, {
      type: 'placeInitialArmy',
      playerId: other?.id ?? '',
      territory: ownedBy(state, other?.id ?? '')[0] as string,
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_YOUR_TURN' } })
  })

  it('rejects an attack during the reinforcement phase', () => {
    const state = reinforcingGame()
    const playerId = currentPlayer(state).id
    const result = applyAction(state, { type: 'attack', playerId, from: 'alaska', to: 'kamchatka' })
    expect(result).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } })
  })

  it('gives every rejection a message', () => {
    const state = reinforcingGame()
    const result = applyAction(state, { type: 'endAttack', playerId: currentPlayer(state).id })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.message).toMatch(/\S/)
    }
  })
})

describe('applyAction purity', () => {
  it('never modifies the given state', () => {
    const state = deepFreeze(createTestGame(3, { settings: { armyPlacement: 'manual' } }))
    const snapshot = structuredClone(state)
    const playerId = currentPlayer(state).id
    const result = applyAction(state, {
      type: 'placeInitialArmy',
      playerId,
      territory: ownedBy(state, playerId)[0] as string,
    })
    expect(result.ok).toBe(true)
    expect(state).toEqual(snapshot)
  })

  it('leaves the state untouched when the action is rejected', () => {
    const state = reinforcingGame()
    const snapshot = structuredClone(state)
    applyAction(state, { ...deployAction(state), armies: 999 })
    expect(state).toEqual(snapshot)
  })
})

describe('serialization', () => {
  it('produces a JSON-serializable state', () => {
    const state = reinforcingGame()
    expect(JSON.parse(JSON.stringify(state))).toEqual(state)
  })

  it('continues identically after a JSON round trip', () => {
    const state = createTestGame(3, { seed: 5, settings: { armyPlacement: 'manual' } })
    const restored = JSON.parse(JSON.stringify(state)) as GameState
    const playerId = currentPlayer(state).id
    const action: Action = { type: 'placeInitialArmy', playerId, territory: ownedBy(state, playerId)[0] as string }
    const original = applyAction(state, action)
    expect(original.ok).toBe(true)
    expect(applyAction(restored, action)).toEqual(original)
  })
})
