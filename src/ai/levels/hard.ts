import { classicMap, defenderBonusOn, type PlayerId, type TerritoryId } from '../../engine'
import { capitalAttack, capitalDefense, lastCapitalStaging, safestTerritory } from '../capitalObjective'
import { conquestProbability } from '../combatOdds'
import {
  armiesOn,
  borderTerritories,
  neighborsOf,
  opponentsOf,
  ownerOf,
  territoriesOwnedBy,
  threat,
} from '../evaluation'
import { eliminationTarget, goalContinent, isMissionTarget } from '../missionObjective'
import type { PlayerView } from '../playerView'
import {
  attackOptions,
  bestSet,
  freeTerritories,
  inHeldContinent,
  maxBy,
  setValue,
  type AttackOption,
  type Deployment,
  type Strategy,
} from '../strategy'
import {
  ATTACK_THRESHOLD,
  claimForContinent,
  fortifyFromInterior,
  frontOrigin,
  mostThreatened,
  normal,
  plannedAttack,
  type DestinationChoice,
} from './normal'

const PRIORITY_THRESHOLD = 0.5
const MAX_ELIMINATION_TERRITORIES = 3
const MISSION_TARGET_PRIORITY = 3
const ELIMINATION_PRIORITY = 2
const BREAK_PRIORITY = 1
const OFFENSIVE_SHARE = 0.75
const CARD_ATTACK_THRESHOLD = 0.5

type Opening = {
  origin: TerritoryId
  target: TerritoryId
  priority: number
  probability: number
}

function ownNeighbors(view: PlayerView, me: PlayerId, target: TerritoryId): TerritoryId[] {
  return neighborsOf(target).filter((id) => ownerOf(view, id) === me)
}

function bestOrigin(view: PlayerView, me: PlayerId, target: TerritoryId, extraArmies: number) {
  return maxBy(
    ownNeighbors(view, me, target).map((origin) => ({
      origin,
      probability: conquestProbability(
        armiesOn(view, origin) + extraArmies,
        armiesOn(view, target),
        view.settings,
        defenderBonusOn(view, target),
      ),
    })),
    (candidate) => candidate.probability,
  )
}

function eliminationOdds(view: PlayerView, me: PlayerId, opponent: PlayerId, extraArmies: number): number {
  const territories = territoriesOwnedBy(view, opponent)
  if (territories.length === 0 || territories.length > MAX_ELIMINATION_TERRITORIES || (view.handSizes[opponent] ?? 0) === 0) {
    return 0
  }
  return territories.reduce(
    (odds, territory) => odds * (bestOrigin(view, me, territory, extraArmies)?.probability ?? 0),
    1,
  )
}

function priorityOf(view: PlayerView, me: PlayerId, target: TerritoryId, extraArmies: number): number {
  const owner = ownerOf(view, target)
  if (owner === undefined || !opponentsOf(view, me).includes(owner)) {
    return 0
  }
  if (isMissionTarget(view, target)) {
    return MISSION_TARGET_PRIORITY
  }
  if (eliminationTarget(view) === null && eliminationOdds(view, me, owner, extraArmies) >= PRIORITY_THRESHOLD) {
    return ELIMINATION_PRIORITY
  }
  return inHeldContinent(view, target) ? BREAK_PRIORITY : 0
}

function openings(view: PlayerView, me: PlayerId, extraArmies: number): Opening[] {
  return classicMap.territoryIds.flatMap((target) => {
    const priority = priorityOf(view, me, target, extraArmies)
    const best = priority === 0 ? undefined : bestOrigin(view, me, target, extraArmies)
    return best === undefined || best.probability < PRIORITY_THRESHOLD ? [] : [{ ...best, target, priority }]
  })
}

function bestOpening(view: PlayerView, me: PlayerId, extraArmies: number): Opening | undefined {
  return maxBy(openings(view, me, extraArmies), (opening) => opening.priority + opening.probability)
}

function priorityAttack(view: PlayerView, me: PlayerId): AttackOption | null {
  const options = attackOptions(view, me).filter((option) => option.probability >= PRIORITY_THRESHOLD)
  const best = maxBy(options, (option) => {
    const priority = priorityOf(view, me, option.to, 0)
    return priority === 0 ? -Infinity : priority + option.probability
  })
  return best !== undefined && priorityOf(view, me, best.to, 0) > 0 ? best : null
}

function defensiveWeights(view: PlayerView, me: PlayerId): Map<TerritoryId, number> {
  return new Map(borderTerritories(view, me).map((territory) => [territory, threat(view, territory)]))
}

function deployByThreat(view: PlayerView, me: PlayerId, reserve: number): Deployment {
  const weights = defensiveWeights(view, me)
  const totalThreat = [...weights.values()].reduce((sum, weight) => sum + weight, 0)
  if (goalContinent(view, me) !== null || totalThreat === 0) {
    const front = frontOrigin(view, me, reserve)
    const offensiveWeight = totalThreat === 0 ? 1 : (totalThreat * OFFENSIVE_SHARE) / (1 - OFFENSIVE_SHARE)
    weights.set(front, (weights.get(front) ?? 0) + offensiveWeight)
  }
  const totalWeight = [...weights.values()].reduce((sum, weight) => sum + weight, 0)
  const armiesOnBorders = [...weights.keys()].reduce((sum, territory) => sum + armiesOn(view, territory), 0)
  const deficit = (territory: TerritoryId) =>
    ((armiesOnBorders + reserve) * (weights.get(territory) ?? 0)) / totalWeight - armiesOn(view, territory)
  const territory = maxBy([...weights.keys()], deficit) ?? frontOrigin(view, me, reserve)
  return { territory, armies: Math.min(reserve, Math.max(1, Math.round(deficit(territory)))) }
}

function lastCapitalDeployment(view: PlayerView, me: PlayerId, reserve: number): Deployment | null {
  const staging = lastCapitalStaging(view, me)
  return staging === null ? null : { territory: staging, armies: reserve }
}

function deploy(view: PlayerView, me: PlayerId, reserve: number): Deployment {
  const opening = bestOpening(view, me, reserve)
  return opening === undefined ? deployByThreat(view, me, reserve) : { territory: opening.origin, armies: reserve }
}

function reserveOf(view: PlayerView): number {
  return view.phase.kind === 'reinforce' || view.phase.kind === 'eliminationTrade' ? view.phase.reserve : 0
}

function needsCardsForOpening(view: PlayerView, me: PlayerId, armies: number): boolean {
  const reserve = reserveOf(view)
  return bestOpening(view, me, reserve) === undefined && bestOpening(view, me, reserve + armies) !== undefined
}

function blockingClaim(view: PlayerView, me: PlayerId): TerritoryId | undefined {
  const free = new Set(freeTerritories(view))
  return classicMap.continentIds
    .map((continentId) => classicMap.continents[continentId]?.territories ?? [])
    .flatMap((territories) => {
      const missing = territories.filter((id) => free.has(id))
      const owners = new Set(territories.flatMap((id) => (free.has(id) ? [] : [ownerOf(view, id)])))
      const [owner] = owners
      return missing.length === 1 && owners.size === 1 && owner !== me && owner !== undefined ? missing : []
    })[0]
}

const towardOffensiveFront: DestinationChoice = (view, me, from, destinations) => {
  const front = frontOrigin(view, me, armiesOn(view, from) - 1)
  return destinations.includes(front) ? front : mostThreatened(view, me, from, destinations)
}

/**
 * The normal strategy, plus breaking continents, eliminating opponents (its target first), defending by threat and keeping its cards;
 * in the capitals mode, gathers its whole reserve toward the last capital it lacks.
 */
export const hard: Strategy = {
  claim: ({ view, me }) => blockingClaim(view, me) ?? claimForContinent(view, me),
  place: ({ view, me }) => deploy(view, me, 1).territory,
  capital: ({ view, me }) => safestTerritory(view, me),
  trade: ({ view, me }) => {
    const set = bestSet(view)
    if (set === null || view.settings.cardTradeScale === 'fixed') {
      return set
    }
    return needsCardsForOpening(view, me, setValue(view, set)) ? set : null
  },
  deploy: ({ view, me }, reserve) =>
    capitalDefense(view, me, reserve) ?? lastCapitalDeployment(view, me, reserve) ?? deploy(view, me, reserve),
  attack: ({ view, me }) =>
    capitalAttack(view, me) ??
    priorityAttack(view, me) ??
    plannedAttack(view, me, view.conqueredThisTurn ? ATTACK_THRESHOLD : CARD_ATTACK_THRESHOLD),
  conquestMove: normal.conquestMove,
  fortify: ({ view, me }) => fortifyFromInterior(view, me, towardOffensiveFront),
}
