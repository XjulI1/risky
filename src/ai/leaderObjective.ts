import { mapOf, type PlayerId } from '../engine'
import { armiesOn, holdsContinent, opponentsOf, ownerOf, territoriesOwnedBy } from './evaluation'
import type { PlayerView } from './playerView'
import { attackOptions, inHeldContinent, maxBy, type AttackOption } from './strategy'

/** How much stronger than every other player an opponent must be to count as the runaway leader. */
export const LEAD_RATIO = 1.3

/** Lowest probability of conquest at which the runaway leader is worth attacking. */
export const LEADER_ATTACK_THRESHOLD = 0.5

const MIN_CONTENDERS = 4
const INCOME_WEIGHT = 3
const CARD_WEIGHT = 2
const TERRITORIES_PER_ARMY = 3
const MIN_REINFORCEMENT = 3
const BREAK_BONUS = 1

/** What a player weighs on the board: its armies, three turns of reinforcements and its cards. */
export function visibleStrength(view: PlayerView, playerId: PlayerId): number {
  const territories = territoriesOwnedBy(view, playerId)
  const armies = territories.reduce((sum, territory) => sum + armiesOn(view, territory), 0)
  const map = mapOf(view)
  const continentBonus = map.continentIds.reduce(
    (sum, continentId) =>
      holdsContinent(view, playerId, continentId) ? sum + (map.continents[continentId]?.bonus ?? 0) : sum,
    0,
  )
  const income = Math.max(MIN_REINFORCEMENT, Math.floor(territories.length / TERRITORIES_PER_ARMY)) + continentBonus
  return armies + INCOME_WEIGHT * income + CARD_WEIGHT * (view.handSizes[playerId] ?? 0)
}

/**
 * The opponent at least 30 % stronger than every other player still in the game, `me` included, or `null`;
 * there is none below 4 players, where weakening the leader mostly profits the third one.
 */
export function runawayLeader(view: PlayerView, me: PlayerId): PlayerId | null {
  const contenders = [me, ...opponentsOf(view, me)]
  if (contenders.length < MIN_CONTENDERS) {
    return null
  }
  const [first, second] = contenders
    .map((playerId) => ({ playerId, strength: visibleStrength(view, playerId) }))
    .sort((a, b) => b.strength - a.strength)
  if (first === undefined || second === undefined || first.playerId === me) {
    return null
  }
  return first.strength >= LEAD_RATIO * second.strength ? first.playerId : null
}

/** The best attack on the runaway leader from a probability of 0.5, a territory of one of its continents first, or `null`. */
export function leaderAttack(view: PlayerView, me: PlayerId): AttackOption | null {
  const leader = runawayLeader(view, me)
  if (leader === null) {
    return null
  }
  const options = attackOptions(view, me).filter(
    (option) => ownerOf(view, option.to) === leader && option.probability >= LEADER_ATTACK_THRESHOLD,
  )
  return maxBy(options, (option) => option.probability + (inHeldContinent(view, option.to) ? BREAK_BONUS : 0)) ?? null
}
