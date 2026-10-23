import { classicMap, isCapital, type PlayerId, type TerritoryId } from '../engine'
import { armiesOn, isBorder, neighborsOf, opponentsOf, ownerOf, territoriesOwnedBy, threat } from './evaluation'
import type { PlayerView } from './playerView'
import { attackOptions, maxBy, type AttackOption, type Deployment } from './strategy'

/** Lowest probability of conquest, defense bonus included, at which a capital is worth attacking. */
export const CAPITAL_ATTACK_THRESHOLD = 0.5

const RECONQUEST_PRIORITY = 1

type CapitalCandidate = {
  territory: TerritoryId
  threat: number
  interior: boolean
  armies: number
}

function safer(a: CapitalCandidate, b: CapitalCandidate): number {
  return a.threat - b.threat || Number(b.interior) - Number(a.interior) || b.armies - a.armies
}

/** The territory that makes the safest capital: the least threatened, an interior one first, then the one holding the most armies. */
export function safestTerritory(view: PlayerView, me: PlayerId): TerritoryId {
  const candidates = territoriesOwnedBy(view, me).map((territory) => ({
    territory,
    threat: threat(view, territory),
    interior: !isBorder(view, territory),
    armies: armiesOn(view, territory),
  }))
  return [...candidates].sort(safer)[0]?.territory ?? ''
}

/** The capital of `me` once revealed, whoever holds it. */
export function ownCapital(view: PlayerView, me: PlayerId): TerritoryId | null {
  return view.capitals?.[me] ?? null
}

function opponentArmiesAround(view: PlayerView, me: PlayerId, territory: TerritoryId): number {
  const opponents = new Set(opponentsOf(view, me))
  return neighborsOf(territory)
    .filter((neighbor) => opponents.has(ownerOf(view, neighbor) ?? ''))
    .reduce((sum, neighbor) => sum + armiesOn(view, neighbor), 0)
}

/** The whole reserve on the capital of `me` when it holds fewer armies than the opponents around and the reserve makes up for it. */
export function capitalDefense(view: PlayerView, me: PlayerId, reserve: number): Deployment | null {
  const capital = ownCapital(view, me)
  if (capital === null || ownerOf(view, capital) !== me) {
    return null
  }
  const opponents = opponentArmiesAround(view, me, capital)
  const armies = armiesOn(view, capital)
  return armies < opponents && armies + reserve >= opponents ? { territory: capital, armies: reserve } : null
}

/** The attack on a capital worth launching first, the reconquest of its own capital before any other. */
export function capitalAttack(view: PlayerView, me: PlayerId): AttackOption | null {
  const own = ownCapital(view, me)
  const options = attackOptions(view, me).filter(
    (option) => isCapital(view, option.to) && option.probability >= CAPITAL_ATTACK_THRESHOLD,
  )
  return maxBy(options, (option) => (option.to === own ? RECONQUEST_PRIORITY : 0) + option.probability) ?? null
}

/** The only capital `me` lacks, or `null` when it lacks none or more than one. */
export function lastMissingCapital(view: PlayerView, me: PlayerId): TerritoryId | null {
  const missing = Object.values(view.capitals ?? {}).filter((territory) => ownerOf(view, territory) !== me)
  return missing.length === 1 ? (missing[0] ?? null) : null
}

function distancesFrom(origin: TerritoryId): Map<TerritoryId, number> {
  const distances = new Map([[origin, 0]])
  const queue = [origin]
  for (let territory = queue.shift(); territory !== undefined; territory = queue.shift()) {
    const distance = (distances.get(territory) ?? 0) + 1
    for (const neighbor of classicMap.territories[territory]?.neighbors ?? []) {
      if (!distances.has(neighbor)) {
        distances.set(neighbor, distance)
        queue.push(neighbor)
      }
    }
  }
  return distances
}

/** The territory of `me` closest to the last capital it lacks, the one holding the most armies among the closest; `null` outside of that case. */
export function lastCapitalStaging(view: PlayerView, me: PlayerId): TerritoryId | null {
  const target = lastMissingCapital(view, me)
  if (target === null) {
    return null
  }
  const distances = distancesFrom(target)
  const distance = (territory: TerritoryId) => distances.get(territory) ?? Infinity
  const closest = Math.min(...territoriesOwnedBy(view, me).map(distance))
  return maxBy(
    territoriesOwnedBy(view, me).filter((territory) => distance(territory) === closest),
    (territory) => armiesOn(view, territory),
  ) ?? null
}
