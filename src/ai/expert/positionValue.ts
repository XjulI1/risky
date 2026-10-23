import { expectedReinforcement, type GameState, type PlayerId } from '../../engine'

const INCOME_WEIGHT = 3
const CARD_WEIGHT = 1

function armiesOf(state: GameState, playerId: PlayerId): number {
  return Object.values(state.territories).reduce(
    (sum, territory) => (territory.owner === playerId ? sum + territory.armies : sum),
    0,
  )
}

function strengthOf(state: GameState, playerId: PlayerId): number {
  return (
    armiesOf(state, playerId) +
    INCOME_WEIGHT * expectedReinforcement(state, playerId) +
    CARD_WEIGHT * (state.hands[playerId]?.length ?? 0)
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
