import { capitalOwnerOf, defenderBonusOn } from './capitals'
import { invalidArmyCount, notOwner, unknownTerritory, wrongPhase } from './errors'
import { areAdjacent } from './maps/classic'
import { mapOf, rollInt, ruleError } from './state'
import { declareWinner, eliminateIfDefeated, isLastStanding } from './turn'
import type { Action, GameEvent, GameState, PlayerId, RuleError, TerritoryState } from './types'

type AttackAction = Extract<Action, { type: 'attack' }>
type MoveAfterConquestAction = Extract<Action, { type: 'moveAfterConquest' }>

/** Outcome of one roll, with each side's dice sorted from highest to lowest. */
export type RollOutcome = {
  attackerDice: number[]
  defenderDice: number[]
  attackerLosses: number
  defenderLosses: number
}

const DIE_FACES = 6
const ELIMINATION_TRADE_HAND_SIZE = 6

const descending = (a: number, b: number) => b - a

/**
 * Compares the dice pair by pair, highest first; the defender wins ties. `defenderBonus` is added to
 * the highest defending die for the comparison only: the outcome keeps the dice as rolled.
 */
export function resolveRoll(attackerDice: number[], defenderDice: number[], defenderBonus = 0): RollOutcome {
  const attacker = [...attackerDice].sort(descending)
  const defender = [...defenderDice].sort(descending)
  const pairs = Math.min(attacker.length, defender.length)
  let attackerLosses = 0
  for (let i = 0; i < pairs; i++) {
    const bonus = i === 0 ? defenderBonus : 0
    if ((attacker[i] ?? 0) <= (defender[i] ?? 0) + bonus) {
      attackerLosses += 1
    }
  }
  return { attackerDice: attacker, defenderDice: defender, attackerLosses, defenderLosses: pairs - attackerLosses }
}

function rollDice(state: GameState, count: number): number[] {
  return Array.from({ length: count }, () => rollInt(state, 1, DIE_FACES))
}

function validateAttack(state: GameState, action: AttackAction): RuleError | null {
  const map = mapOf(state)
  if (map.territories[action.from] === undefined || map.territories[action.to] === undefined) {
    return unknownTerritory()
  }
  const from = state.territories[action.from]
  const to = state.territories[action.to]
  if (from?.owner !== action.playerId) {
    return notOwner()
  }
  if (to === undefined || to.owner === action.playerId) {
    return ruleError('OWN_TERRITORY', 'Vous ne pouvez pas attaquer un de vos territoires.')
  }
  if (!areAdjacent(map, action.from, action.to)) {
    return ruleError('NOT_ADJACENT', "Ces territoires ne sont pas voisins.")
  }
  if (from.armies < 2) {
    return ruleError('NOT_ENOUGH_ARMIES', 'Il faut au moins 2 armées pour attaquer.')
  }
  return null
}

function fightUntilDecided(
  state: GameState,
  action: AttackAction,
  attacker: TerritoryState,
  defender: TerritoryState,
  events: GameEvent[],
): number {
  const defenderId: PlayerId = defender.owner
  const defenderBonus = defenderBonusOn(state, action.to)
  let lastAttackerDice = 0
  while (attacker.armies > 1 && defender.armies > 0) {
    lastAttackerDice = Math.min(state.settings.attackerMaxDice, attacker.armies - 1)
    const defenderDiceCount = Math.min(state.settings.defenderMaxDice, defender.armies)
    const outcome = resolveRoll(rollDice(state, lastAttackerDice), rollDice(state, defenderDiceCount), defenderBonus)
    attacker.armies -= outcome.attackerLosses
    defender.armies -= outcome.defenderLosses
    events.push({
      type: 'diceRolled',
      attacker: action.playerId,
      defender: defenderId,
      from: action.from,
      to: action.to,
      attackerDice: outcome.attackerDice,
      defenderDice: outcome.defenderDice,
      defenderBonus,
      attackerLosses: outcome.attackerLosses,
      defenderLosses: outcome.defenderLosses,
    })
  }
  return lastAttackerDice
}

export function attack(state: GameState, action: AttackAction, events: GameEvent[]): RuleError | null {
  const error = validateAttack(state, action)
  if (error !== null) {
    return error
  }
  const attacker = state.territories[action.from] as TerritoryState
  const defender = state.territories[action.to] as TerritoryState
  const previousOwner = defender.owner

  const lastAttackerDice = fightUntilDecided(state, action, attacker, defender, events)
  if (defender.armies > 0) {
    return null
  }

  defender.owner = action.playerId
  state.conqueredThisTurn = true
  events.push({ type: 'territoryConquered', playerId: action.playerId, previousOwner, from: action.from, to: action.to })
  const capitalOwner = capitalOwnerOf(state, action.to)
  if (capitalOwner !== null) {
    events.push({ type: 'capitalCaptured', by: action.playerId, from: capitalOwner, territory: action.to })
  }
  state.phase = {
    kind: 'conquestMove',
    from: action.from,
    to: action.to,
    minArmies: lastAttackerDice,
    maxArmies: attacker.armies - 1,
  }

  if (eliminateIfDefeated(state, previousOwner, action.playerId, events) && isLastStanding(state)) {
    moveArmies(state, action.playerId, action.from, action.to, lastAttackerDice, events)
    declareWinner(state, events)
  }
  return null
}

export function moveArmies(
  state: GameState,
  playerId: PlayerId,
  from: string,
  to: string,
  armies: number,
  events: GameEvent[],
): void {
  const origin = state.territories[from]
  const target = state.territories[to]
  if (origin === undefined || target === undefined) {
    return
  }
  origin.armies -= armies
  target.armies += armies
  events.push({ type: 'conquestMoved', playerId, from, to, armies })
}

export function moveAfterConquest(
  state: GameState,
  action: MoveAfterConquestAction,
  events: GameEvent[],
): RuleError | null {
  if (state.phase.kind !== 'conquestMove') {
    return wrongPhase()
  }
  const { from, to, minArmies, maxArmies } = state.phase
  if (!Number.isInteger(action.armies) || action.armies < minArmies || action.armies > maxArmies) {
    return invalidArmyCount()
  }
  moveArmies(state, action.playerId, from, to, action.armies, events)
  const handSize = state.hands[action.playerId]?.length ?? 0
  state.phase = handSize >= ELIMINATION_TRADE_HAND_SIZE ? { kind: 'eliminationTrade', reserve: 0 } : { kind: 'attack' }
  return null
}

export function endAttack(state: GameState): RuleError | null {
  state.phase = { kind: 'fortify' }
  return null
}
