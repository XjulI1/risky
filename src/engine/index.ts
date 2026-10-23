import { tradeCards } from './cards'
import { attack, endAttack, moveAfterConquest } from './combat'
import { fortify, skipFortify } from './fortification'
import { claimTerritory, placeInitialArmy } from './placement'
import { deploy } from './reinforcement'
import { currentPlayer, ruleError } from './state'
import type { Action, ActionResult, ActionType, GameEvent, GameState, PhaseKind, RuleError } from './types'
import { endIfMissionAccomplished } from './victory'

const ALLOWED_PHASES: Record<ActionType, readonly PhaseKind[]> = {
  claimTerritory: ['claim'],
  placeInitialArmy: ['placement'],
  tradeCards: ['reinforce', 'eliminationTrade'],
  deploy: ['reinforce', 'eliminationTrade'],
  attack: ['attack'],
  moveAfterConquest: ['conquestMove'],
  endAttack: ['attack'],
  fortify: ['fortify'],
  skipFortify: ['fortify'],
}

const SETUP_PHASES: readonly PhaseKind[] = ['claim', 'placement']

function reject(error: RuleError): ActionResult {
  return { ok: false, error }
}

function handle(state: GameState, action: Action, events: GameEvent[]): RuleError | null {
  switch (action.type) {
    case 'claimTerritory':
      return claimTerritory(state, action, events)
    case 'placeInitialArmy':
      return placeInitialArmy(state, action, events)
    case 'tradeCards':
      return tradeCards(state, action, events)
    case 'deploy':
      return deploy(state, action, events)
    case 'attack':
      return attack(state, action, events)
    case 'moveAfterConquest':
      return moveAfterConquest(state, action, events)
    case 'endAttack':
      return endAttack(state)
    case 'fortify':
      return fortify(state, action, events)
    case 'skipFortify':
      return skipFortify(state, events)
    default:
      return ruleError('WRONG_PHASE', "Cette action n'est pas encore prise en charge.")
  }
}

/**
 * Validates an action against the current state and applies it, then ends the game if it accomplished
 * the mission of the player who played it (set-up actions excepted).
 * Returns the new state and the events it caused, or the rule it breaks; the given state is never modified.
 */
export function applyAction(state: GameState, action: Action): ActionResult {
  if (state.phase.kind === 'gameOver') {
    return reject(ruleError('GAME_OVER', 'La partie est terminée.'))
  }
  if (action.playerId !== currentPlayer(state).id) {
    return reject(ruleError('NOT_YOUR_TURN', "Ce n'est pas votre tour."))
  }
  if (!ALLOWED_PHASES[action.type].includes(state.phase.kind)) {
    return reject(ruleError('WRONG_PHASE', "Cette action n'est pas possible dans la phase en cours."))
  }

  const next = structuredClone(state)
  const events: GameEvent[] = []
  const error = handle(next, action, events)
  if (error !== null) {
    return reject(error)
  }
  if (!SETUP_PHASES.includes(state.phase.kind)) {
    endIfMissionAccomplished(next, action.playerId, events)
  }
  return { ok: true, state: next, events }
}

export { bonusTerritory, isValidSet, tradeValue } from './cards'
export { resolveRoll } from './combat'
export { areAdjacent, classicMap } from './maps/classic'
export { attackOrigins, attackTargets, expectedReinforcement, fortifyDestinations, tradeableSets } from './queries'
export { FORCED_TRADE_HAND_SIZE, mustTrade } from './reinforcement'
export { nextFloat, nextInt } from './rng'
export { CONQUER_24_TERRITORIES, GENERAL_MISSIONS, missionProgress, missionText } from './missions'
export type { ContinentProgress, MissionProgress } from './missions'
export { createGame, DEFAULT_SETTINGS, NEUTRAL_PLAYER_ID } from './setup'
export type * from './types'
