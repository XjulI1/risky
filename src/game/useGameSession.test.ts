import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { classicMap, createGame, type GameState, type PlayerKind } from '../engine'
import { createGameSession } from './useGameSession'

function attackingGame(kinds: PlayerKind[] = ['human', 'human', 'human']): GameState {
  const created = createGame({
    seed: 12,
    players: kinds.map((kind, i) => ({ id: `p${i + 1}`, name: `Joueur ${i + 1}`, color: ['#d64541', '#3a7bd5', '#3fa34d'][i] ?? '#000', kind })),
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  for (const id of classicMap.territoryIds) {
    state.territories[id] = { owner: 'p2', armies: 1 }
  }
  state.territories.north_africa = { owner: 'p1', armies: 30 }
  state.territories.brazil = { owner: 'p2', armies: 6 }
  state.currentPlayerIndex = 0
  state.phase = { kind: 'attack' }
  return state
}

const attack = { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' } as const

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createGameSession', () => {
  it('updates the engine state at once and the displayed state at the end of the animations', async () => {
    const initial = attackingGame()
    const session = createGameSession(initial, { speed: 'normal' })
    session.dispatch(attack)
    expect(session.engineState.value).not.toBe(initial)
    expect(session.displayedState.value).toBe(initial)
    expect(session.isPresenting.value).toBe(true)
    await vi.runAllTimersAsync()
    expect(session.isPresenting.value).toBe(false)
    expect(session.displayedState.value).toBe(session.engineState.value)
  })

  it('shows the dice of each roll as the current step while presenting', async () => {
    const session = createGameSession(attackingGame(), { speed: 'normal' })
    session.dispatch(attack)
    expect(session.currentStep.value?.kind).toBe('roll')
    await vi.runAllTimersAsync()
    expect(session.currentStep.value).toBeNull()
  })

  it('does not animate at the instant speed', () => {
    const session = createGameSession(attackingGame(), { speed: 'instant' })
    session.dispatch(attack)
    expect(session.isPresenting.value).toBe(false)
    expect(session.displayedState.value).toBe(session.engineState.value)
  })

  it('ignores player input while presenting', () => {
    const session = createGameSession(attackingGame(), { speed: 'normal' })
    session.dispatch(attack)
    const engineState = session.engineState.value
    session.input({ kind: 'endAttack' })
    expect(session.engineState.value).toBe(engineState)
  })

  it('jumps to the final state when the animation is skipped', () => {
    const session = createGameSession(attackingGame(), { speed: 'normal' })
    session.dispatch(attack)
    session.skipAnimation()
    expect(session.isPresenting.value).toBe(false)
    expect(session.currentStep.value).toBeNull()
    expect(session.displayedState.value).toBe(session.engineState.value)
  })

  it('exposes the engine message when an action is rejected, without changing the state', () => {
    const initial = attackingGame()
    const session = createGameSession(initial, { speed: 'instant' })
    session.dispatch({ type: 'attack', playerId: 'p1', from: 'north_africa', to: 'india' })
    expect(session.error.value).toBe('Ces territoires ne sont pas voisins.')
    expect(session.engineState.value).toBe(initial)
    session.dismissError()
    expect(session.error.value).toBeNull()
  })

  it('turns player input into engine actions', () => {
    const session = createGameSession(attackingGame(), { speed: 'instant' })
    session.input({ kind: 'endAttack' })
    expect(session.engineState.value.phase.kind).toBe('fortify')
  })
})

describe('hand-off between humans', () => {
  function endTurn(kinds: PlayerKind[]) {
    const session = createGameSession(attackingGame(kinds), { speed: 'instant' })
    session.input({ kind: 'endAttack' })
    session.input({ kind: 'skipFortify' })
    return session
  }

  it('asks the next human to take the device', () => {
    const session = endTurn(['human', 'human', 'human'])
    expect(session.handoffTo.value?.id).toBe('p2')
    session.acknowledgeHandoff()
    expect(session.handoffTo.value).toBeNull()
  })

  it('does not interrupt a game with a single human', () => {
    expect(endTurn(['human', 'ai', 'ai']).handoffTo.value).toBeNull()
  })
})
