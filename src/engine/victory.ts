import { moveArmies } from './combat'
import { missionProgress } from './missions'
import type { GameEvent, GameState, PlayerId, PublicState } from './types'

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

/**
 * Ends the game in favor of `playerId` when its mission is accomplished, after moving the minimum
 * armies of a pending conquest; returns whether the game ended.
 */
export function endIfMissionAccomplished(state: GameState, playerId: PlayerId, events: GameEvent[]): boolean {
  const mission = state.missions?.[playerId]
  if (mission === undefined || state.phase.kind === 'gameOver') {
    return false
  }
  if (!missionProgress(mission, afterMinimalConquestMove(state), playerId).accomplished) {
    return false
  }
  if (state.phase.kind === 'conquestMove') {
    moveArmies(state, playerId, state.phase.from, state.phase.to, state.phase.minArmies, events)
  }
  state.phase = { kind: 'gameOver' }
  state.winner = playerId
  state.winReason = 'mission'
  events.push({ type: 'missionAccomplished', playerId, mission }, { type: 'gameWon', playerId })
  return true
}
