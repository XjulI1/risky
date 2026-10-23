import {
  applyAction,
  tradeableSets,
  type Action,
  type AiLevel,
  type GameEvent,
  type GameState,
  type RuleError,
} from '../engine'
import { aiRandom } from './aiRandom'
import { easy } from './levels/easy'
import { hard } from './levels/hard'
import { normal } from './levels/normal'
import { playerView, type PlayerView } from './playerView'
import { mustTradeNow, type DecisionContext, type Strategy, type TurnProgress } from './strategy'

export type { TurnProgress } from './strategy'

/** Attacks after which an AI ends its attack phase, whatever its strategy. */
export const MAX_ATTACKS_PER_TURN = 60

/** Progress at the start of a turn. */
export const NEW_TURN: TurnProgress = { attacks: 0, conquests: 0 }

const STRATEGIES: Record<AiLevel, Strategy> = {
  easy,
  normal,
  hard,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function reinforcementAction(strategy: Strategy, context: DecisionContext, reserve: number): Action {
  const playerId = context.me
  const sets = tradeableSets(context.view.hand)
  const chosenSet = sets.length > 0 ? strategy.trade(context) : null
  const forcedSet = mustTradeNow(context.view) ? (chosenSet ?? sets[0]) : undefined
  const set = forcedSet ?? chosenSet
  if (set !== null && set !== undefined) {
    return { type: 'tradeCards', playerId, cardIds: set }
  }
  const deployment = strategy.deploy(context, reserve)
  return { type: 'deploy', playerId, territory: deployment.territory, armies: clamp(deployment.armies, 1, reserve) }
}

/**
 * The action an AI of the given level plays from what it sees; the same view, level and progress
 * always give the same action. The view must be the one of the current player, in a phase where it can act.
 */
export function chooseAction(view: PlayerView, level: AiLevel, turn: TurnProgress = NEW_TURN): Action {
  const strategy = STRATEGIES[level]
  const context: DecisionContext = { view, me: view.viewer, random: aiRandom(view, level), turn }
  const playerId = view.viewer
  const phase = view.phase
  switch (phase.kind) {
    case 'claim':
      return { type: 'claimTerritory', playerId, territory: strategy.claim(context) }
    case 'placement':
      return { type: 'placeInitialArmy', playerId, territory: strategy.place(context) }
    case 'capitalChoice':
      return { type: 'chooseCapital', playerId, territory: strategy.capital(context) }
    case 'reinforce':
    case 'eliminationTrade':
      return reinforcementAction(strategy, context, phase.reserve)
    case 'attack': {
      const attack = turn.attacks >= MAX_ATTACKS_PER_TURN ? null : strategy.attack(context)
      return attack === null ? { type: 'endAttack', playerId } : { type: 'attack', playerId, from: attack.from, to: attack.to }
    }
    case 'conquestMove':
      return {
        type: 'moveAfterConquest',
        playerId,
        armies: clamp(strategy.conquestMove(context, phase), phase.minArmies, phase.maxArmies),
      }
    case 'fortify': {
      const fortification = strategy.fortify(context)
      return fortification === null ? { type: 'skipFortify', playerId } : { type: 'fortify', playerId, ...fortification }
    }
    case 'gameOver':
      throw new Error('No action is possible once the game is over')
  }
}

/** Progress of the turn once `action` has been applied and has caused `events`. */
export function progressAfter(turn: TurnProgress, action: Action, events: GameEvent[]): TurnProgress {
  if (events.some((event) => event.type === 'turnStarted')) {
    return NEW_TURN
  }
  return {
    attacks: turn.attacks + (action.type === 'attack' ? 1 : 0),
    conquests: turn.conquests + events.filter((event) => event.type === 'territoryConquered').length,
  }
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
