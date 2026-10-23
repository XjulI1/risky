import {
  attackOrigins,
  attackTargets,
  bonusTerritory,
  classicMap,
  defenderBonusOn,
  FORCED_TRADE_HAND_SIZE,
  tradeableSets,
  tradeValue,
  type Card,
  type Phase,
  type PlayerId,
  type TerritoryId,
} from '../engine'
import type { AiRandom } from './aiRandom'
import { conquestProbability } from './combatOdds'
import { armiesOn, holdsContinent, ownerOf } from './evaluation'
import type { PlayerView } from './playerView'

/** Attacks and conquests already made in the current turn, counted by the automatic loop. */
export type TurnProgress = {
  attacks: number
  conquests: number
}

/** Everything a level may use to decide. */
export type DecisionContext = {
  view: PlayerView
  me: PlayerId
  random: AiRandom
  turn: TurnProgress
}

export type CardSet = [number, number, number]

export type AttackOption = {
  from: TerritoryId
  to: TerritoryId
  probability: number
}

export type Deployment = {
  territory: TerritoryId
  armies: number
}

export type Fortification = {
  from: TerritoryId
  to: TerritoryId
  armies: number
}

const TERRITORY_BONUS = 2

export type ConquestMove = Extract<Phase, { kind: 'conquestMove' }>

/** One decision function per phase; each returns a legal choice for the view it is given. */
export type Strategy = {
  claim: (context: DecisionContext) => TerritoryId
  place: (context: DecisionContext) => TerritoryId
  capital: (context: DecisionContext) => TerritoryId
  trade: (context: DecisionContext) => CardSet | null
  deploy: (context: DecisionContext, reserve: number) => Deployment
  attack: (context: DecisionContext) => AttackOption | null
  conquestMove: (context: DecisionContext, move: ConquestMove) => number
  fortify: (context: DecisionContext) => Fortification | null
}

/** Territories nobody has claimed yet, in map order. */
export function freeTerritories(view: PlayerView): TerritoryId[] {
  return classicMap.territoryIds.filter((id) => view.territories[id] === undefined)
}

/** Whether the hand is full enough to force a trade. */
export function mustTradeNow(view: PlayerView): boolean {
  return view.hand.length >= FORCED_TRADE_HAND_SIZE
}

function cardsOf(view: PlayerView, set: CardSet): Card[] {
  return set.flatMap((id) => view.hand.filter((card) => card.id === id))
}

/** Armies a set would bring, the territory bonus included. */
export function setValue(view: PlayerView, set: CardSet): number {
  const cards = cardsOf(view, set)
  const territoryBonus = bonusTerritory(view, view.viewer, cards) === null ? 0 : TERRITORY_BONUS
  return tradeValue(cards, view.settings.cardTradeScale, view.tradeCount) + territoryBonus
}

/** The set worth the most armies, keeping jokers when it costs nothing; `null` without a valid set. */
export function bestSet(view: PlayerView): CardSet | null {
  let best: CardSet | null = null
  let bestScore = -Infinity
  for (const set of tradeableSets(view.hand)) {
    const jokers = cardsOf(view, set).filter((card) => card.symbol === 'joker').length
    const score = setValue(view, set) - jokers / 2
    if (score > bestScore) {
      best = set
      bestScore = score
    }
  }
  return best
}

/** Every attack the player can launch, with its probability of conquest, the defense bonus of a capital included. */
export function attackOptions(view: PlayerView, playerId: PlayerId): AttackOption[] {
  return attackOrigins(view, playerId).flatMap((from) =>
    attackTargets(view, from).map((to) => ({
      from,
      to,
      probability: conquestProbability(armiesOn(view, from), armiesOn(view, to), view.settings, defenderBonusOn(view, to)),
    })),
  )
}

/** Whether conquering `territory` would give `playerId` the whole continent. */
export function completesContinent(view: PlayerView, playerId: PlayerId, territory: TerritoryId): boolean {
  const continentId = classicMap.territories[territory]?.continent
  if (continentId === undefined) {
    return false
  }
  return (
    classicMap.continents[continentId]?.territories.every((id) => id === territory || ownerOf(view, id) === playerId) ??
    false
  )
}

/** Whether `territory` belongs to a continent held entirely by its owner. */
export function inHeldContinent(view: PlayerView, territory: TerritoryId): boolean {
  const owner = ownerOf(view, territory)
  const continentId = classicMap.territories[territory]?.continent
  return owner !== undefined && continentId !== undefined && holdsContinent(view, owner, continentId)
}

/** The element of `items` with the highest score; the first one wins ties. */
export function maxBy<T>(items: readonly T[], score: (item: T) => number): T | undefined {
  let best: T | undefined
  let bestScore = -Infinity
  for (const item of items) {
    const value = score(item)
    if (value > bestScore) {
      best = item
      bestScore = value
    }
  }
  return best
}
