import { isValidSet } from './cards'
import { connectedTerritories } from './fortification'
import { reinforcementCount } from './reinforcement'
import { mapOf, territoriesOf } from './state'
import type { Card, PlayerId, PublicState, TerritoryId } from './types'

/** Reserve the player would receive if a turn started now. */
export function expectedReinforcement(state: PublicState, playerId: PlayerId): number {
  return reinforcementCount(state, playerId)
}

/** Enemy neighbors that can be attacked from `from` (empty when it holds fewer than 2 armies). */
export function attackTargets(state: PublicState, from: TerritoryId): TerritoryId[] {
  const origin = state.territories[from]
  if (origin === undefined || origin.armies < 2) {
    return []
  }
  return (mapOf(state).territories[from]?.neighbors ?? []).filter(
    (neighbor) => state.territories[neighbor]?.owner !== origin.owner,
  )
}

/** Territories of the player from which an attack is currently possible. */
export function attackOrigins(state: PublicState, playerId: PlayerId): TerritoryId[] {
  return territoriesOf(state, playerId).filter((territory) => attackTargets(state, territory).length > 0)
}

/** Valid fortification destinations from `from`, according to the fortify mode of the game. */
export function fortifyDestinations(state: PublicState, from: TerritoryId): TerritoryId[] {
  const origin = state.territories[from]
  if (origin === undefined || origin.armies < 2) {
    return []
  }
  if (state.settings.fortifyMode === 'adjacent') {
    return (mapOf(state).territories[from]?.neighbors ?? []).filter(
      (neighbor) => state.territories[neighbor]?.owner === origin.owner,
    )
  }
  return [...connectedTerritories(state, origin.owner, from)].filter((territory) => territory !== from)
}

/** Every valid set in a hand, as triples of card identifiers in hand order. */
export function tradeableSets(hand: Card[]): [number, number, number][] {
  const sets: [number, number, number][] = []
  hand.forEach((first, i) => {
    hand.slice(i + 1).forEach((second, j) => {
      hand.slice(i + j + 2).forEach((third) => {
        if (isValidSet([first, second, third])) {
          sets.push([first.id, second.id, third.id])
        }
      })
    })
  })
  return sets
}
