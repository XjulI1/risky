import { applyActionInPlace, type GameState, type PlayerId } from '../../engine'
import { chooseHeuristicAction, progressAfter } from '../heuristic'
import { playerView } from '../playerView'
import type { TurnProgress } from '../strategy'
import { positionValue } from './positionValue'

const MAX_ROLLOUT_ACTIONS = 1500

/**
 * Plays every player at the hard level on `state`, which it modifies, until `me` starts its next turn or the game ends,
 * then returns the value of the reached position for `me`; `turn` is the progress of the turn under way.
 */
export function rollout(state: GameState, me: PlayerId, turn: TurnProgress): number {
  let progress = turn
  for (let step = 0; step < MAX_ROLLOUT_ACTIONS && state.phase.kind !== 'gameOver'; step++) {
    const player = state.players[state.currentPlayerIndex]
    if (player === undefined) {
      break
    }
    const action = chooseHeuristicAction(playerView(state, player.id), 'hard', progress)
    const result = applyActionInPlace(state, action)
    if (!result.ok) {
      throw new Error(`Rollout action ${action.type} rejected: ${result.error.message}`)
    }
    if (result.events.some((event) => event.type === 'turnStarted' && event.playerId === me)) {
      break
    }
    progress = progressAfter(progress, action, result.events)
  }
  return positionValue(state, me)
}
