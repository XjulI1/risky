import { notOwner, unknownTerritory, wrongPhase } from './errors'
import { mapOf } from './state'
import { nextPlayerIndex, startTurn } from './turn'
import type { Action, GameEvent, GameState, PlayerId, PublicState, RuleError, TerritoryId } from './types'

type ChooseCapitalAction = Extract<Action, { type: 'chooseCapital' }>

/** What the highest die of the defender of a capital gains for the comparison. */
export const CAPITAL_DEFENSE_BONUS = 1

/** The player whose capital `territory` is, or `null` when it is no revealed capital. */
export function capitalOwnerOf(state: Pick<PublicState, 'capitals'>, territory: TerritoryId): PlayerId | null {
  const entry = Object.entries(state.capitals ?? {}).find(([, capital]) => capital === territory)
  return entry === undefined ? null : entry[0]
}

/** Whether `territory` is a revealed capital, whoever holds it. */
export function isCapital(state: Pick<PublicState, 'capitals'>, territory: TerritoryId): boolean {
  return capitalOwnerOf(state, territory) !== null
}

/** What the highest die of the defender of `territory` gains: the capital bonus on a capital, else nothing. */
export function defenderBonusOn(state: Pick<PublicState, 'capitals'>, territory: TerritoryId): number {
  return isCapital(state, territory) ? CAPITAL_DEFENSE_BONUS : 0
}

/** Number of revealed capitals whose territory `playerId` holds, its own included. */
export function heldCapitals(state: PublicState, playerId: PlayerId): number {
  return Object.values(state.capitals ?? {}).filter((territory) => state.territories[territory]?.owner === playerId).length
}

/** Whether `playerId` holds the territory of every revealed capital. */
export function holdsAllCapitals(state: PublicState, playerId: PlayerId): boolean {
  const capitals = Object.values(state.capitals ?? {})
  return capitals.length > 0 && heldCapitals(state, playerId) === capitals.length
}

function inPlayerOrder(state: GameState, pending: Record<PlayerId, TerritoryId>): Record<PlayerId, TerritoryId> {
  return Object.fromEntries(
    state.players.flatMap((player) => {
      const territory = pending[player.id]
      return territory === undefined ? [] : [[player.id, territory]]
    }),
  )
}

export function chooseCapital(state: GameState, action: ChooseCapitalAction, events: GameEvent[]): RuleError | null {
  if (state.phase.kind !== 'capitalChoice') {
    return wrongPhase()
  }
  if (mapOf(state).territories[action.territory] === undefined) {
    return unknownTerritory()
  }
  if (state.territories[action.territory]?.owner !== action.playerId) {
    return notOwner()
  }

  const { pending } = state.phase
  pending[action.playerId] = action.territory
  events.push({ type: 'capitalChosen', playerId: action.playerId })

  const next = nextPlayerIndex(
    state,
    state.currentPlayerIndex,
    (player) => !player.isNeutral && pending[player.id] === undefined,
  )
  if (next !== -1) {
    state.currentPlayerIndex = next
    return null
  }
  state.capitals = inPlayerOrder(state, pending)
  events.push({ type: 'capitalsRevealed', capitals: { ...state.capitals } })
  startTurn(state, state.firstPlayerIndex, events)
  return null
}
