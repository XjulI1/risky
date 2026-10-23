import { notOwner, unknownTerritory, wrongPhase } from './errors'
import { mapOf, rollInt, ruleError, territoriesOf } from './state'
import { nextPlayerIndex, startTurn } from './turn'
import type { Action, GameEvent, GameState, PlayerId, RuleError } from './types'

type ClaimAction = Extract<Action, { type: 'claimTerritory' }>
type PlaceAction = Extract<Action, { type: 'placeInitialArmy' }>

function firstIndexWithArmiesLeft(state: GameState, remaining: Record<PlayerId, number>, fromIndex: number): number {
  return nextPlayerIndex(
    state,
    fromIndex,
    (player) => !player.isNeutral && (remaining[player.id] ?? 0) > 0,
  )
}

/** Ends the set-up: opens the capital choice of the first player in the capitals mode, else starts the first turn. */
export function endSetup(state: GameState, events: GameEvent[]): void {
  if (state.settings.capitals) {
    state.phase = { kind: 'capitalChoice', pending: {} }
    state.currentPlayerIndex = state.firstPlayerIndex
  } else {
    startTurn(state, state.firstPlayerIndex, events)
  }
}

/** Spreads the initial armies left to each player at random over their territories, then ends the set-up. */
export function placeRemainingArmiesAtRandom(
  state: GameState,
  remaining: Record<PlayerId, number>,
  events: GameEvent[],
): void {
  for (const player of state.players) {
    const owned = territoriesOf(state, player.id)
    for (let left = remaining[player.id] ?? 0; left > 0 && owned.length > 0; left--) {
      const territory = state.territories[owned[rollInt(state, 0, owned.length - 1)] as string]
      if (territory !== undefined) {
        territory.armies += 1
      }
    }
    remaining[player.id] = 0
  }
  endSetup(state, events)
}

export function claimTerritory(state: GameState, action: ClaimAction, events: GameEvent[]): RuleError | null {
  if (state.phase.kind !== 'claim') {
    return wrongPhase()
  }
  const map = mapOf(state)
  if (map.territories[action.territory] === undefined) {
    return unknownTerritory()
  }
  if (state.territories[action.territory] !== undefined) {
    return ruleError('TERRITORY_TAKEN', 'Ce territoire appartient déjà à un joueur.')
  }

  const { remaining } = state.phase
  state.territories[action.territory] = { owner: action.playerId, armies: 1 }
  remaining[action.playerId] = (remaining[action.playerId] ?? 0) - 1
  events.push({ type: 'territoryClaimed', playerId: action.playerId, territory: action.territory })

  const allClaimed = map.territoryIds.every((id) => state.territories[id] !== undefined)
  if (allClaimed && state.settings.armyPlacement === 'random') {
    placeRemainingArmiesAtRandom(state, remaining, events)
  } else if (allClaimed) {
    state.phase = { kind: 'placement', remaining }
    state.currentPlayerIndex = firstIndexWithArmiesLeft(state, remaining, state.firstPlayerIndex - 1)
  } else {
    state.currentPlayerIndex = nextPlayerIndex(state, state.currentPlayerIndex)
  }
  return null
}

export function placeInitialArmy(state: GameState, action: PlaceAction, events: GameEvent[]): RuleError | null {
  if (state.phase.kind !== 'placement') {
    return wrongPhase()
  }
  const territory = state.territories[action.territory]
  if (mapOf(state).territories[action.territory] === undefined) {
    return unknownTerritory()
  }
  if (territory?.owner !== action.playerId) {
    return notOwner()
  }

  const { remaining } = state.phase
  territory.armies += 1
  remaining[action.playerId] = (remaining[action.playerId] ?? 0) - 1
  events.push({ type: 'initialArmyPlaced', playerId: action.playerId, territory: action.territory })

  const next = firstIndexWithArmiesLeft(state, remaining, state.currentPlayerIndex)
  if (next === -1) {
    endSetup(state, events)
  } else {
    state.currentPlayerIndex = next
  }
  return null
}
