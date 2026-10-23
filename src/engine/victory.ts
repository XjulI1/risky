import { holdsAllCapitals } from './capitals'
import { moveArmies } from './combat'
import { missionProgress } from './missions'
import type { GameEvent, GameState, PlayerId, PublicState, WinReason } from './types'

function afterMinimalConquestMove(state: GameState): PublicState {
  const phase = state.phase
  if (phase.kind !== 'conquestMove') {
    return state
  }
  const territories = { ...state.territories }
  const origin = territories[phase.from]
  const target = territories[phase.to]
  if (origin !== undefined && target !== undefined) {
    territories[phase.from] = { ...origin, armies: origin.armies - phase.minArmies }
    territories[phase.to] = { ...target, armies: target.armies + phase.minArmies }
  }
  return { ...state, territories }
}

function endGame(state: GameState, playerId: PlayerId, reason: WinReason, events: GameEvent[]): void {
  if (state.phase.kind === 'conquestMove') {
    moveArmies(state, playerId, state.phase.from, state.phase.to, state.phase.minArmies, events)
  }
  state.phase = { kind: 'gameOver' }
  state.winner = playerId
  state.winReason = reason
}

function endIfMissionAccomplished(state: GameState, playerId: PlayerId, events: GameEvent[]): boolean {
  const mission = state.missions?.[playerId]
  if (mission === undefined || !missionProgress(mission, afterMinimalConquestMove(state), playerId).accomplished) {
    return false
  }
  endGame(state, playerId, 'mission', events)
  events.push({ type: 'missionAccomplished', playerId, mission }, { type: 'gameWon', playerId })
  return true
}

function endIfCapitalsHeld(state: GameState, playerId: PlayerId, events: GameEvent[]): boolean {
  if (!holdsAllCapitals(state, playerId)) {
    return false
  }
  endGame(state, playerId, 'capitals', events)
  events.push({ type: 'gameWon', playerId })
  return true
}

/**
 * Ends the game in favor of `playerId` when it has accomplished its mission or holds every capital,
 * after moving the minimum armies of a pending conquest; a game already won by domination is left
 * as it is. Returns whether the game ended.
 */
export function endIfObjectiveReached(state: GameState, playerId: PlayerId, events: GameEvent[]): boolean {
  if (state.phase.kind === 'gameOver') {
    return false
  }
  return endIfMissionAccomplished(state, playerId, events) || endIfCapitalsHeld(state, playerId, events)
}
