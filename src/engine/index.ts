import { chooseCapital } from './capitals'
import { tradeCards } from './cards'
import { attack, endAttack, moveAfterConquest } from './combat'
import { fortify, skipFortify } from './fortification'
import { claimTerritory, placeInitialArmy } from './placement'
import { deploy } from './reinforcement'
import { currentPlayer, ruleError } from './state'
import type { Action, ActionResult, ActionType, GameEvent, GameState, PhaseKind, RuleError } from './types'
import { endIfObjectiveReached } from './victory'

const ALLOWED_PHASES: Record<ActionType, readonly PhaseKind[]> = {
  claimTerritory: ['claim'],
  placeInitialArmy: ['placement'],
  chooseCapital: ['capitalChoice'],
  tradeCards: ['reinforce', 'eliminationTrade'],
  deploy: ['reinforce', 'eliminationTrade'],
  attack: ['attack'],
  moveAfterConquest: ['conquestMove'],
  endAttack: ['attack'],
  fortify: ['fortify'],
  skipFortify: ['fortify'],
}

const SETUP_PHASES: readonly PhaseKind[] = ['claim', 'placement', 'capitalChoice']

function reject(error: RuleError): ActionResult {
  return { ok: false, error }
}

function handle(state: GameState, action: Action, events: GameEvent[]): RuleError | null {
  switch (action.type) {
    case 'claimTerritory':
      return claimTerritory(state, action, events)
    case 'placeInitialArmy':
      return placeInitialArmy(state, action, events)
    case 'chooseCapital':
      return chooseCapital(state, action, events)
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

function checkTurnAndPhase(state: GameState, action: Action): RuleError | null {
  if (state.phase.kind === 'gameOver') {
    return ruleError('GAME_OVER', 'La partie est terminée.')
  }
  if (action.playerId !== currentPlayer(state).id) {
    return ruleError('NOT_YOUR_TURN', "Ce n'est pas votre tour.")
  }
  if (!ALLOWED_PHASES[action.type].includes(state.phase.kind)) {
    return ruleError('WRONG_PHASE', "Cette action n'est pas possible dans la phase en cours.")
  }
  return null
}

function resolve(state: GameState, action: Action): ActionResult {
  const isSetup = SETUP_PHASES.includes(state.phase.kind)
  const events: GameEvent[] = []
  const error = handle(state, action, events)
  if (error !== null) {
    return reject(error)
  }
  if (!isSetup) {
    endIfObjectiveReached(state, action.playerId, events)
  }
  return { ok: true, state, events }
}

/**
 * Validates an action against the current state and applies it, then ends the game if the player who
 * played it has accomplished its mission or holds every capital (set-up actions excepted).
 * Returns the new state and the events it caused, or the rule it breaks; the given state is never modified.
 */
export function applyAction(state: GameState, action: Action): ActionResult {
  const error = checkTurnAndPhase(state, action)
  return error === null ? resolve(structuredClone(state), action) : reject(error)
}

/**
 * Same as `applyAction`, but modifies the given state instead of a copy and returns it, for simulations that
 * play many actions on a throwaway state; once an action is rejected, the state must no longer be used.
 */
export function applyActionInPlace(state: GameState, action: Action): ActionResult {
  const error = checkTurnAndPhase(state, action)
  return error === null ? resolve(state, action) : reject(error)
}

export { CAPITAL_DEFENSE_BONUS, capitalOwnerOf, defenderBonusOn, heldCapitals, holdsAllCapitals, isCapital } from './capitals'
export { bonusTerritory, isValidSet, tradeValue } from './cards'
export { resolveRoll } from './combat'
export { areAdjacent, classicMap } from './maps/classic'
export { attackOrigins, attackTargets, expectedReinforcement, fortifyDestinations, tradeableSets } from './queries'
export { FORCED_TRADE_HAND_SIZE, mustTrade } from './reinforcement'
export { nextFloat, nextInt } from './rng'
export { CONQUER_24_TERRITORIES, GENERAL_MISSIONS, missionProgress, missionText } from './missions'
export type { ContinentProgress, MissionProgress } from './missions'
export { AI_LEVELS, buildDeck, createGame, DEFAULT_SETTINGS, NEUTRAL_PLAYER_ID } from './setup'
export type * from './types'
