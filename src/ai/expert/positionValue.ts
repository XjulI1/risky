import { classicMap, tradeValue, type GameState, type PlayerId } from '../../engine'

const INCOME_WEIGHT = 3
const TERRITORIES_PER_ARMY = 3
const CARDS_PER_SET = 3
/** Mean of the fixed scale (4, 6, 8 and 10 armies). */
const FIXED_SET_VALUE = 7

function armiesOf(state: GameState, playerId: PlayerId): number {
  return Object.values(state.territories).reduce(
    (sum, territory) => (territory.owner === playerId ? sum + territory.armies : sum),
    0,
  )
}

/**
 * Reinforcements without the minimum of 3, so that every territory counts:
 * with fewer than 12 territories, a conquest would otherwise add nothing.
 */
function incomeOf(state: GameState, playerId: PlayerId): number {
  const territories = Object.values(state.territories).filter((territory) => territory.owner === playerId).length
  const continentBonus = classicMap.continentIds.reduce((sum, continentId) => {
    const continent = classicMap.continents[continentId]
    const held = continent?.territories.every((id) => state.territories[id]?.owner === playerId) ?? false
    return held && continent !== undefined ? sum + continent.bonus : sum
  }, 0)
  return territories / TERRITORIES_PER_ARMY + continentBonus
}

/** What a card is worth: a third of the armies of the next set. */
function cardValue(state: GameState): number {
  const setValue =
    state.settings.cardTradeScale === 'progressive' ? tradeValue([], 'progressive', state.tradeCount) : FIXED_SET_VALUE
  return setValue / CARDS_PER_SET
}

function strengthOf(state: GameState, playerId: PlayerId): number {
  return (
    armiesOf(state, playerId) +
    INCOME_WEIGHT * incomeOf(state, playerId) +
    cardValue(state) * (state.hands[playerId]?.length ?? 0)
  )
}

/**
 * How good the position is for `me`, from 0 (eliminated or beaten) to 1 (won): its share of the strength
 * of the players still in the game, the strength adding up armies, reinforcements and cards.
 */
export function positionValue(state: GameState, me: PlayerId): number {
  if (state.winner !== null) {
    return state.winner === me ? 1 : 0
  }
  const contenders = state.players.filter((player) => !player.isNeutral && !player.eliminated)
  if (!contenders.some((player) => player.id === me)) {
    return 0
  }
  const strengths = contenders.map((player) => strengthOf(state, player.id))
  const total = strengths.reduce((sum, strength) => sum + strength, 0)
  return total === 0 ? 0 : strengthOf(state, me) / total
}
