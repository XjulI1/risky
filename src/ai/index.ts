import { applyAction, type Action, type AiLevel, type GameState, type RuleError } from '../engine'
import { expertAction } from './expert/expert'
import { chooseHeuristicAction, NEW_TURN, progressAfter } from './heuristic'
import { playerView, type PlayerView } from './playerView'
import type { TurnProgress } from './strategy'

export { chooseHeuristicAction, MAX_ATTACKS_PER_TURN, NEW_TURN, progressAfter } from './heuristic'
export type { TurnProgress } from './strategy'

function isClassic(view: PlayerView): boolean {
  return !view.settings.secretMissions && !view.settings.capitals
}

/**
 * The action an AI of the given level plays from what it sees; the same view, level and progress
 * always give the same action. The expert level searches in the classic mode only and plays like the hard level otherwise.
 * The view must be the one of the current player, in a phase where it can act.
 */
export function chooseAction(view: PlayerView, level: AiLevel, turn: TurnProgress = NEW_TURN): Action {
  if (level !== 'expert') {
    return chooseHeuristicAction(view, level, turn)
  }
  return isClassic(view) ? expertAction(view, turn) : chooseHeuristicAction(view, 'hard', turn)
}

/** The action of the current player when it is an AI, or `null` when a human must play or the game is over. */
export function nextAiAction(state: GameState, turn: TurnProgress): Action | null {
  const player = state.players[state.currentPlayerIndex]
  if (state.phase.kind === 'gameOver' || player === undefined || player.kind !== 'ai') {
    return null
  }
  return chooseAction(playerView(state, player.id), player.level, turn)
}

/** Outcome of an automatic run: the reached state, the actions played and, if any, the action the engine refused. */
export type AutoPlay = {
  state: GameState
  actions: Action[]
  turns: number
  rejection: { action: Action; error: RuleError } | null
}

type AutoPlayOptions = {
  maxTurns?: number
}

/** Plays the AI actions one after the other until a human must play, the game is over or `maxTurns` turns have started. */
export function playUntilHumanOrEnd(state: GameState, { maxTurns = Infinity }: AutoPlayOptions = {}): AutoPlay {
  const actions: Action[] = []
  let current = state
  let turn = NEW_TURN
  let turns = 0
  for (let action = nextAiAction(current, turn); action !== null && turns < maxTurns; action = nextAiAction(current, turn)) {
    const result = applyAction(current, action)
    if (!result.ok) {
      return { state: current, actions, turns, rejection: { action, error: result.error } }
    }
    actions.push(action)
    turns += result.events.filter((event) => event.type === 'turnStarted').length
    turn = progressAfter(turn, action, result.events)
    current = result.state
  }
  return { state: current, actions, turns, rejection: null }
}
