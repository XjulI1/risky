import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { attackOrigins, attackTargets, tradeableSets } from './queries'
import { currentPlayer, mapOf, territoriesOf } from './state'
import { createTestGame } from './testUtils'
import type { Action, GameConfig, GameEvent, GameState, TerritoryId } from './types'

const MAX_ACTIONS = 20000

function armies(state: GameState, territory: TerritoryId): number {
  return state.territories[territory]?.armies ?? 0
}

function strongest(state: GameState, territories: TerritoryId[]): TerritoryId | undefined {
  return [...territories].sort((a, b) => armies(state, b) - armies(state, a))[0]
}

function facesEnemy(state: GameState, playerId: string, territory: TerritoryId): boolean {
  return (mapOf(state).territories[territory]?.neighbors ?? []).some(
    (neighbor) => state.territories[neighbor]?.owner !== playerId,
  )
}

function frontline(state: GameState, playerId: string): TerritoryId {
  const owned = territoriesOf(state, playerId)
  const border = owned.filter((territory) => facesEnemy(state, playerId, territory))
  return strongest(state, border.length > 0 ? border : owned) as TerritoryId
}

function scriptedAction(state: GameState): Action {
  const playerId = currentPlayer(state).id
  const phase = state.phase
  switch (phase.kind) {
    case 'claim':
    case 'gameOver':
      throw new Error(`Unexpected phase ${phase.kind}`)
    case 'placement':
      return { type: 'placeInitialArmy', playerId, territory: frontline(state, playerId) }
    case 'capitalChoice':
      return { type: 'chooseCapital', playerId, territory: frontline(state, playerId) }
    case 'reinforce':
    case 'eliminationTrade': {
      const set = tradeableSets(state.hands[playerId] ?? [])[0]
      if (set !== undefined) {
        return { type: 'tradeCards', playerId, cardIds: set }
      }
      return { type: 'deploy', playerId, territory: frontline(state, playerId), armies: phase.reserve }
    }
    case 'attack': {
      for (const from of attackOrigins(state, playerId)) {
        const target = [...attackTargets(state, from)].sort((a, b) => armies(state, a) - armies(state, b))[0]
        if (target !== undefined && armies(state, from) > armies(state, target) + 1) {
          return { type: 'attack', playerId, from, to: target }
        }
      }
      return { type: 'endAttack', playerId }
    }
    case 'conquestMove':
      return { type: 'moveAfterConquest', playerId, armies: phase.maxArmies }
    case 'fortify':
      return { type: 'skipFortify', playerId }
  }
}

function boardTotal(state: GameState): number {
  return Object.values(state.territories).reduce((sum, territory) => sum + territory.armies, 0)
}

function armyDelta(events: GameEvent[]): number {
  return events.reduce((delta, event) => {
    switch (event.type) {
      case 'armiesDeployed':
        return delta + event.armies
      case 'initialArmyPlaced':
        return delta + 1
      case 'cardsTraded':
        return delta + (event.bonusTerritory === null ? 0 : 2)
      case 'diceRolled':
        return delta - event.attackerLosses - event.defenderLosses
      default:
        return delta
    }
  }, 0)
}

function playToTheEnd(seed: number, config: Partial<GameConfig> = {}): { state: GameState; actions: number } {
  let state = createTestGame(3, { seed, ...config })
  let actions = 0
  while (state.phase.kind !== 'gameOver') {
    if (actions >= MAX_ACTIONS) {
      throw new Error(`No winner after ${MAX_ACTIONS} actions`)
    }
    const result = applyAction(state, scriptedAction(state))
    if (!result.ok) {
      throw new Error(`Scripted action rejected: ${result.error.code} in ${state.phase.kind}`)
    }
    expect(boardTotal(result.state)).toBe(boardTotal(state) + armyDelta(result.events))
    expect(Object.values(result.state.territories).every((territory) => territory.armies >= 0)).toBe(true)
    state = result.state
    actions += 1
  }
  return { state, actions }
}

describe('full simulated game', () => {
  it('reaches a victory with consistent army counts at every step', () => {
    const { state } = playToTheEnd(2026)
    expect(state.winner).not.toBeNull()
    expect(state.players.filter((player) => !player.eliminated && !player.isNeutral)).toHaveLength(1)
    expect(territoriesOf(state, state.winner ?? '')).toHaveLength(42)
    expect(Object.values(state.territories).every((territory) => territory.armies >= 1)).toBe(true)
  })

  it('replays to the very same final state with the same seed', () => {
    expect(playToTheEnd(2026)).toEqual(playToTheEnd(2026))
  })

  it.each([1, 7, 42, 99])('also finishes with seed %i', (seed) => {
    expect(playToTheEnd(seed).state.winner).not.toBeNull()
  })
})

describe('full simulated game on the France map', () => {
  it('reaches a victory by domination', () => {
    const { state } = playToTheEnd(2026, { mapId: 'france' })
    expect(state.mapId).toBe('france')
    expect(territoriesOf(state, state.winner ?? '')).toHaveLength(42)
  })

  it('reaches a victory with secret missions', () => {
    const { state } = playToTheEnd(2026, { mapId: 'france', settings: { secretMissions: true } })
    expect(state.winner).not.toBeNull()
    expect(state.missions).not.toBeNull()
  })

  it('reaches a victory in the capitals mode', () => {
    const { state } = playToTheEnd(2026, { mapId: 'france', settings: { capitals: true } })
    expect(state.winner).not.toBeNull()
    expect(state.capitals).not.toBeNull()
  })
})
