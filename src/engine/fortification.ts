import { invalidArmyCount, notOwner, unknownTerritory } from './errors'
import { areAdjacent } from './maps/classic'
import { mapOf, ruleError } from './state'
import { endTurn } from './turn'
import { endIfObjectiveReached } from './victory'
import type { Action, GameEvent, GameState, PlayerId, PublicState, RuleError, TerritoryId } from './types'

type FortifyAction = Extract<Action, { type: 'fortify' }>

/** Territories reachable from `from` through a chain of adjacent territories owned by `playerId`. */
export function connectedTerritories(state: PublicState, playerId: PlayerId, from: TerritoryId): Set<TerritoryId> {
  const map = mapOf(state)
  const reached = new Set<TerritoryId>([from])
  const queue = [from]
  while (queue.length > 0) {
    const current = queue.shift() as TerritoryId
    for (const neighbor of map.territories[current]?.neighbors ?? []) {
      if (!reached.has(neighbor) && state.territories[neighbor]?.owner === playerId) {
        reached.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  return reached
}

function validateRoute(state: GameState, action: FortifyAction): RuleError | null {
  if (action.from === action.to) {
    return ruleError('NOT_ADJACENT', 'Choisissez deux territoires différents.')
  }
  if (state.settings.fortifyMode === 'adjacent') {
    return areAdjacent(mapOf(state), action.from, action.to)
      ? null
      : ruleError('NOT_ADJACENT', 'En mode adjacent, la destination doit être voisine.')
  }
  return connectedTerritories(state, action.playerId, action.from).has(action.to)
    ? null
    : ruleError('NOT_CONNECTED', 'Aucun chemin de vos territoires ne relie ces deux territoires.')
}

export function fortify(state: GameState, action: FortifyAction, events: GameEvent[]): RuleError | null {
  const map = mapOf(state)
  if (map.territories[action.from] === undefined || map.territories[action.to] === undefined) {
    return unknownTerritory()
  }
  const origin = state.territories[action.from]
  const destination = state.territories[action.to]
  if (origin?.owner !== action.playerId || destination?.owner !== action.playerId) {
    return notOwner()
  }
  const routeError = validateRoute(state, action)
  if (routeError !== null) {
    return routeError
  }
  if (!Number.isInteger(action.armies) || action.armies < 1 || action.armies >= origin.armies) {
    return invalidArmyCount()
  }

  origin.armies -= action.armies
  destination.armies += action.armies
  events.push({ type: 'fortified', playerId: action.playerId, from: action.from, to: action.to, armies: action.armies })
  if (!endIfObjectiveReached(state, action.playerId, events)) {
    endTurn(state, events)
  }
  return null
}

export function skipFortify(state: GameState, events: GameEvent[]): RuleError | null {
  endTurn(state, events)
  return null
}
