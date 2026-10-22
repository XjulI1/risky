import { classicMap } from './maps/classic'
import { nextInt, shuffle } from './rng'
import type { GameMap, GameState, Player, PlayerId, PublicState, RuleError, RuleErrorCode, TerritoryId } from './types'

export function mapOf(state: PublicState): GameMap {
  switch (state.mapId) {
    case 'classic':
      return classicMap
  }
}

export function currentPlayer(state: PublicState): Player {
  const player = state.players[state.currentPlayerIndex]
  if (player === undefined) {
    throw new Error(`No player at index ${state.currentPlayerIndex}`)
  }
  return player
}

export function playerById(state: PublicState, playerId: PlayerId): Player | undefined {
  return state.players.find((player) => player.id === playerId)
}

export function isInPlay(player: Player): boolean {
  return !player.isNeutral && !player.eliminated
}

export function territoriesOf(state: PublicState, playerId: PlayerId): TerritoryId[] {
  return Object.entries(state.territories)
    .filter(([, territory]) => territory.owner === playerId)
    .map(([id]) => id)
}

export function rollInt(state: GameState, min: number, max: number): number {
  const draw = nextInt(state.rngState, min, max)
  state.rngState = draw.state
  return draw.value
}

export function shuffleWithState<T>(state: GameState, items: readonly T[]): T[] {
  const draw = shuffle(items, state.rngState)
  state.rngState = draw.state
  return draw.value
}

export function ruleError(code: RuleErrorCode, message: string): RuleError {
  return { code, message }
}
