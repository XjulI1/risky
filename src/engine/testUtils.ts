import { applyAction } from './index'
import { classicMap } from './maps/classic'
import { createGame } from './setup'
import { currentPlayer } from './state'
import type { Action, GameConfig, GameState, PlayerConfig, PlayerId } from './types'

const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#00acc1']

export function testPlayers(count: number): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Joueur ${i + 1}`,
    color: COLORS[i] ?? `#00000${i}`,
    kind: 'human',
  }))
}

export function createTestGame(playerCount: number, overrides: Partial<GameConfig> = {}): GameState {
  const result = createGame({ players: testPlayers(playerCount), seed: 1, ...overrides })
  if (!result.ok) {
    throw new Error(`createGame failed: ${result.error.message}`)
  }
  return result.state
}

export function ownedBy(state: GameState, playerId: PlayerId): string[] {
  return Object.entries(state.territories)
    .filter(([, territory]) => territory.owner === playerId)
    .map(([id]) => id)
}

export function armiesOf(state: GameState, playerId: PlayerId): number {
  return Object.values(state.territories)
    .filter((territory) => territory.owner === playerId)
    .reduce((sum, territory) => sum + territory.armies, 0)
}

export function apply(state: GameState, action: Action): GameState {
  const result = applyAction(state, action)
  if (!result.ok) {
    throw new Error(`Unexpected rejection: ${result.error.code}`)
  }
  return result.state
}

export function freeTerritories(state: GameState): string[] {
  return classicMap.territoryIds.filter((id) => state.territories[id] === undefined)
}

export function claimAll(state: GameState): GameState {
  let current = state
  while (current.phase.kind === 'claim') {
    const territory = freeTerritories(current)[0] as string
    current = apply(current, { type: 'claimTerritory', playerId: currentPlayer(current).id, territory })
  }
  return current
}

export function placeAll(state: GameState): GameState {
  let current = state
  while (current.phase.kind === 'placement') {
    const playerId = currentPlayer(current).id
    const territory = ownedBy(current, playerId)[0] as string
    current = apply(current, { type: 'placeInitialArmy', playerId, territory })
  }
  return current
}

export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

export function assignTerritories(state: GameState, owner: PlayerId, territories: string[], armies = 1): GameState {
  for (const territory of territories) {
    state.territories[territory] = { owner, armies }
  }
  return state
}

export function giveAllTerritoriesTo(state: GameState, owner: PlayerId, armies = 1): GameState {
  return assignTerritories(state, owner, classicMap.territoryIds, armies)
}
