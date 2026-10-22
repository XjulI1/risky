import { invalidArmyCount, notOwner, tradeRequired, wrongPhase } from './errors'
import { mapOf, territoriesOf } from './state'
import type { Action, GameEvent, GameState, PlayerId, PublicState, RuleError } from './types'

const MIN_REINFORCEMENT = 3
const TERRITORIES_PER_ARMY = 3

/** Armies a player receives at the start of a turn: territories / 3 (minimum 3) plus continent bonuses. */
export function reinforcementCount(state: PublicState, playerId: PlayerId): number {
  const map = mapOf(state)
  const territoryArmies = Math.max(
    MIN_REINFORCEMENT,
    Math.floor(territoriesOf(state, playerId).length / TERRITORIES_PER_ARMY),
  )
  const continentArmies = map.continentIds.reduce((sum, continentId) => {
    const continent = map.continents[continentId]
    const ownsAll = continent?.territories.every((t) => state.territories[t]?.owner === playerId) ?? false
    return ownsAll && continent !== undefined ? sum + continent.bonus : sum
  }, 0)
  return territoryArmies + continentArmies
}

export const FORCED_TRADE_HAND_SIZE = 5

type DeployAction = Extract<Action, { type: 'deploy' }>

function reserveOf(state: GameState): number | null {
  return state.phase.kind === 'reinforce' || state.phase.kind === 'eliminationTrade' ? state.phase.reserve : null
}

function setReserve(state: GameState, reserve: number): void {
  if (state.phase.kind === 'reinforce' || state.phase.kind === 'eliminationTrade') {
    state.phase.reserve = reserve
  }
}

/** Whether the player must trade a set before deploying: 5 cards or more in hand. */
export function mustTrade(state: GameState, playerId: PlayerId): boolean {
  return (state.hands[playerId]?.length ?? 0) >= FORCED_TRADE_HAND_SIZE
}

export function endReinforcementIfDone(state: GameState, playerId: PlayerId): void {
  if (reserveOf(state) === 0 && !mustTrade(state, playerId)) {
    state.phase = { kind: 'attack' }
  }
}

export function deploy(state: GameState, action: DeployAction, events: GameEvent[]): RuleError | null {
  const reserve = reserveOf(state)
  if (reserve === null) {
    return wrongPhase()
  }
  if (mustTrade(state, action.playerId)) {
    return tradeRequired()
  }
  const territory = state.territories[action.territory]
  if (territory?.owner !== action.playerId) {
    return notOwner()
  }
  if (!Number.isInteger(action.armies) || action.armies < 1 || action.armies > reserve) {
    return invalidArmyCount()
  }

  territory.armies += action.armies
  setReserve(state, reserve - action.armies)
  events.push({ type: 'armiesDeployed', playerId: action.playerId, territory: action.territory, armies: action.armies })
  endReinforcementIfDone(state, action.playerId)
  return null
}
