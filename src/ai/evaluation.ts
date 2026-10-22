import { classicMap, type ContinentId, type PlayerId, type TerritoryId } from '../engine'
import { conquestProbability } from './combatOdds'
import type { PlayerView } from './playerView'

const NEAR_COMPLETE_PREMIUMS: Record<number, number> = { 1: 3, 2: 1.5 }

/** Neighbors of a territory on the map. */
export function neighborsOf(territory: TerritoryId): TerritoryId[] {
  return classicMap.territories[territory]?.neighbors ?? []
}

/** Owner of a territory, or `undefined` while it is unclaimed. */
export function ownerOf(view: PlayerView, territory: TerritoryId): PlayerId | undefined {
  return view.territories[territory]?.owner
}

/** Armies on a territory, 0 while it is unclaimed. */
export function armiesOn(view: PlayerView, territory: TerritoryId): number {
  return view.territories[territory]?.armies ?? 0
}

/** Territories of a player, in map order. */
export function territoriesOwnedBy(view: PlayerView, playerId: PlayerId): TerritoryId[] {
  return classicMap.territoryIds.filter((id) => ownerOf(view, id) === playerId)
}

/** Players still in the game that can attack `playerId`: neither eliminated, nor neutral, nor the player itself. */
export function opponentsOf(view: PlayerView, playerId: PlayerId): PlayerId[] {
  return view.players
    .filter((player) => player.id !== playerId && !player.isNeutral && !player.eliminated)
    .map((player) => player.id)
}

/** Neighbors of a territory held by someone else than its owner. */
export function enemyNeighbors(view: PlayerView, territory: TerritoryId): TerritoryId[] {
  const owner = ownerOf(view, territory)
  return neighborsOf(territory).filter((neighbor) => {
    const neighborOwner = ownerOf(view, neighbor)
    return neighborOwner !== undefined && neighborOwner !== owner
  })
}

/** Whether a territory has at least one neighbor held by someone else. */
export function isBorder(view: PlayerView, territory: TerritoryId): boolean {
  return enemyNeighbors(view, territory).length > 0
}

/** Territories of a player facing someone else, in map order. */
export function borderTerritories(view: PlayerView, playerId: PlayerId): TerritoryId[] {
  return territoriesOwnedBy(view, playerId).filter((id) => isBorder(view, id))
}

/** Territories of a player surrounded by its own territories, in map order. */
export function interiorTerritories(view: PlayerView, playerId: PlayerId): TerritoryId[] {
  return territoriesOwnedBy(view, playerId).filter((id) => !isBorder(view, id))
}

/** Number of territories of a continent that have a neighbor outside of it. */
export function continentEntries(continentId: ContinentId): number {
  const continent = classicMap.continents[continentId]
  if (continent === undefined) {
    return 0
  }
  return continent.territories.filter((id) =>
    neighborsOf(id).some((neighbor) => classicMap.territories[neighbor]?.continent !== continentId),
  ).length
}

/** Whether a player holds every territory of a continent. */
export function holdsContinent(view: PlayerView, playerId: PlayerId, continentId: ContinentId): boolean {
  return classicMap.continents[continentId]?.territories.every((id) => ownerOf(view, id) === playerId) ?? false
}

/** How worthwhile a continent is for a player: share held × bonus / entries, with a premium when 1 or 2 territories are missing. */
export function continentScore(view: PlayerView, playerId: PlayerId, continentId: ContinentId): number {
  const continent = classicMap.continents[continentId]
  if (continent === undefined) {
    return 0
  }
  const held = continent.territories.filter((id) => ownerOf(view, id) === playerId).length
  const missing = continent.territories.length - held
  const premium = NEAR_COMPLETE_PREMIUMS[missing] ?? 1
  return ((held / continent.territories.length) * continent.bonus * premium) / Math.max(1, continentEntries(continentId))
}

/** The continent a player should complete next, or `null` when it holds a part of none it lacks. */
export function targetContinent(view: PlayerView, playerId: PlayerId): ContinentId | null {
  let best: ContinentId | null = null
  let bestScore = 0
  for (const continentId of classicMap.continentIds) {
    const score = holdsContinent(view, playerId, continentId) ? 0 : continentScore(view, playerId, continentId)
    if (score > bestScore) {
      best = continentId
      bestScore = score
    }
  }
  return best
}

/** Enemy armies next to a territory, each weighted by its probability of conquering the territory. */
export function threat(view: PlayerView, territory: TerritoryId): number {
  const owner = ownerOf(view, territory)
  if (owner === undefined) {
    return 0
  }
  const opponents = new Set(opponentsOf(view, owner))
  const defenders = armiesOn(view, territory)
  return neighborsOf(territory).reduce((sum, neighbor) => {
    const neighborOwner = ownerOf(view, neighbor)
    if (neighborOwner === undefined || !opponents.has(neighborOwner)) {
      return sum
    }
    const attackers = armiesOn(view, neighbor)
    return sum + attackers * conquestProbability(attackers, defenders, view.settings)
  }, 0)
}
