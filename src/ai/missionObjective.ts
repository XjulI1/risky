import type { ContinentId, PlayerId, TerritoryId } from '../engine'
import { armiesOn, continentScore, holdsContinent, ownerOf, targetContinent, territoriesOwnedBy } from './evaluation'
import type { PlayerView } from './playerView'
import { maxBy, type ConquestMove } from './strategy'

/** Lowest probability of conquest at which a mission makes an attack worth it. */
export const MISSION_ATTACK_THRESHOLD = 0.5

const WEAK_TARGET_ARMIES = 2
const MISSION_MIN_ARMIES = 2

/** The continent to complete next: one the mission still requires, else the best one for the player. */
export function goalContinent(view: PlayerView, me: PlayerId): ContinentId | null {
  const mission = view.ownMission
  if (mission?.kind !== 'continents') {
    return targetContinent(view, me)
  }
  const missing = mission.required.filter((continentId) => !holdsContinent(view, me, continentId))
  return maxBy(missing, (continentId) => continentScore(view, me, continentId)) ?? targetContinent(view, me)
}

/** The player the mission asks to eliminate, while still in the game. */
export function eliminationTarget(view: PlayerView): PlayerId | null {
  const mission = view.ownMission
  if (mission?.kind !== 'eliminate') {
    return null
  }
  return view.players.find((player) => player.id === mission.target && !player.eliminated)?.id ?? null
}

/** Whether `territory` belongs to the player the mission asks to eliminate. */
export function isMissionTarget(view: PlayerView, territory: TerritoryId): boolean {
  const target = eliminationTarget(view)
  return target !== null && ownerOf(view, territory) === target
}

/** Whether conquering `territory` would eliminate a player other than the target of the mission. */
export function eliminatesAnotherPlayer(view: PlayerView, territory: TerritoryId): boolean {
  const owner = ownerOf(view, territory)
  return (
    eliminationTarget(view) !== null &&
    owner !== undefined &&
    owner !== eliminationTarget(view) &&
    territoriesOwnedBy(view, owner).length === 1
  )
}

function wantsTerritories(view: PlayerView): boolean {
  const mission = view.ownMission
  return mission?.kind === 'territories' && mission.minArmies < MISSION_MIN_ARMIES
}

/** The probability of conquest an attack on `territory` needs, lowered for the targets the mission favours. */
export function attackThreshold(view: PlayerView, territory: TerritoryId, threshold: number): number {
  const weakTarget = wantsTerritories(view) && armiesOn(view, territory) <= WEAK_TARGET_ARMIES
  return weakTarget || isMissionTarget(view, territory) ? Math.min(threshold, MISSION_ATTACK_THRESHOLD) : threshold
}

/** Armies a territory must keep for the mission: 2 when it asks for territories holding 2 armies, else 1. */
export function armiesToKeep(view: PlayerView): number {
  const mission = view.ownMission
  return mission?.kind === 'territories' ? Math.max(1, mission.minArmies) : 1
}

/** `armies` adjusted so that the origin and the conquered territory both keep what the mission needs, when possible. */
export function keepForMission(view: PlayerView, move: ConquestMove, armies: number): number {
  const keep = armiesToKeep(view)
  const low = Math.max(move.minArmies, keep)
  const high = Math.min(move.maxArmies, armiesOn(view, move.from) - keep)
  return low > high ? armies : Math.min(high, Math.max(low, armies))
}
