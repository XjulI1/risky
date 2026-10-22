import { classicMap, fortifyDestinations, type PlayerId, type TerritoryId } from '../../engine'
import { conquestProbability } from '../combatOdds'
import {
  armiesOn,
  borderTerritories,
  continentScore,
  enemyNeighbors,
  interiorTerritories,
  isBorder,
  ownerOf,
  targetContinent,
  territoriesOwnedBy,
  threat,
} from '../evaluation'
import type { PlayerView } from '../playerView'
import {
  attackOptions,
  bestSet,
  completesContinent,
  freeTerritories,
  maxBy,
  type AttackOption,
  type ConquestMove,
  type Fortification,
  type Strategy,
} from '../strategy'

export const ATTACK_THRESHOLD = 0.6
const TARGET_CONTINENT_BONUS = 1
const COMPLETION_BONUS = 1

function continentOf(territory: TerritoryId): string | undefined {
  return classicMap.territories[territory]?.continent
}

function claimValue(view: PlayerView, me: PlayerId, territory: TerritoryId): number {
  const continentId = continentOf(territory)
  const continent = continentId === undefined ? undefined : classicMap.continents[continentId]
  if (continentId === undefined || continent === undefined) {
    return 0
  }
  const claimed = { ...view, territories: { ...view.territories, [territory]: { owner: me, armies: 1 } } }
  const enemyHeld = continent.territories.filter((id) => {
    const owner = ownerOf(view, id)
    return owner !== undefined && owner !== me
  }).length
  return continentScore(claimed, me, continentId) * (1 - enemyHeld / continent.territories.length)
}

/** The free territory that best builds toward an easy-to-hold continent. */
export function claimForContinent(view: PlayerView, me: PlayerId): TerritoryId {
  return maxBy(freeTerritories(view), (territory) => claimValue(view, me, territory)) ?? ''
}

function bestOdds(view: PlayerView, origin: TerritoryId, targets: TerritoryId[], extraArmies: number): number {
  return Math.max(
    0,
    ...targets.map((target) => conquestProbability(armiesOn(view, origin) + extraArmies, armiesOn(view, target), view.settings)),
  )
}

/** The border territory from which `reserve` more armies best advance into the target continent, else anywhere. */
export function frontOrigin(view: PlayerView, me: PlayerId, reserve: number): TerritoryId {
  const continentId = targetContinent(view, me)
  const borders = borderTerritories(view, me)
  const continentTargets = (origin: TerritoryId) =>
    enemyNeighbors(view, origin).filter((target) => continentOf(target) === continentId)
  const front = borders.filter((origin) => continentTargets(origin).length > 0)
  const best =
    front.length > 0
      ? maxBy(front, (origin) => bestOdds(view, origin, continentTargets(origin), reserve))
      : maxBy(borders, (origin) => bestOdds(view, origin, enemyNeighbors(view, origin), reserve))
  return best ?? territoriesOwnedBy(view, me)[0] ?? ''
}

/** How much an attack serves the plan of the normal level: odds, target continent and continent completion. */
export function planScore(view: PlayerView, me: PlayerId, option: AttackOption): number {
  const continentId = targetContinent(view, me)
  return (
    option.probability +
    (continentOf(option.to) === continentId ? TARGET_CONTINENT_BONUS : 0) +
    (completesContinent(view, me, option.to) ? COMPLETION_BONUS : 0)
  )
}

/** The attack that best serves the plan among those reaching `threshold`, or `null`. */
export function plannedAttack(view: PlayerView, me: PlayerId, threshold: number): AttackOption | null {
  const options = attackOptions(view, me).filter((option) => option.probability >= threshold)
  return maxBy(options, (option) => planScore(view, me, option)) ?? null
}

/** Picks where interior armies go among the reachable border territories. */
export type DestinationChoice = (view: PlayerView, me: PlayerId, from: TerritoryId, destinations: TerritoryId[]) => TerritoryId | undefined

/** The most threatened destination. */
export const mostThreatened: DestinationChoice = (view, _me, _from, destinations) =>
  maxBy(destinations, (destination) => threat(view, destination))

/** Moves the armies of the largest interior territory to the border territory chosen by `choose`. */
export function fortifyFromInterior(view: PlayerView, me: PlayerId, choose: DestinationChoice): Fortification | null {
  const borderDestinations = (from: TerritoryId) =>
    fortifyDestinations(view, from).filter((destination) => isBorder(view, destination))
  const origins = interiorTerritories(view, me).filter(
    (id) => armiesOn(view, id) > 1 && borderDestinations(id).length > 0,
  )
  const from = maxBy(origins, (id) => armiesOn(view, id))
  if (from === undefined) {
    return null
  }
  const to = choose(view, me, from, borderDestinations(from))
  return to === undefined ? null : { from, to, armies: armiesOn(view, from) - 1 }
}

function splitAfterConquest(view: PlayerView, move: ConquestMove): number {
  if (!isBorder(view, move.from)) {
    return move.maxArmies
  }
  if (!isBorder(view, move.to)) {
    return move.minArmies
  }
  return Math.ceil(armiesOn(view, move.from) / 2)
}

/** Aims at a continent, concentrates its reinforcements on its front and attacks with good odds. */
export const normal: Strategy = {
  claim: ({ view, me }) => claimForContinent(view, me),
  place: ({ view, me }) => frontOrigin(view, me, 1),
  trade: ({ view }) => bestSet(view),
  deploy: ({ view, me }, reserve) => ({ territory: frontOrigin(view, me, reserve), armies: reserve }),
  attack: ({ view, me }) => plannedAttack(view, me, ATTACK_THRESHOLD),
  conquestMove: ({ view }, move) => splitAfterConquest(view, move),
  fortify: ({ view, me }) => fortifyFromInterior(view, me, mostThreatened),
}
