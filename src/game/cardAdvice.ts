import {
  bonusTerritory,
  isValidSet,
  tradeableSets,
  tradeValue,
  type Card,
  type GameState,
  type PlayerId,
  type TerritoryId,
} from '../engine'

const TERRITORY_BONUS = 2

/** What trading a given set would bring: armies to the reserve, the bonus territory and the total. */
export type TradeOffer = {
  cardIds: [number, number, number]
  armies: number
  bonusTerritory: TerritoryId | null
  total: number
}

function pickCards(hand: Card[], cardIds: number[]): Card[] | null {
  const cards = cardIds.map((id) => hand.find((card) => card.id === id))
  return cards.every((card) => card !== undefined) ? (cards as Card[]) : null
}

/** Value of trading `cardIds` now, or `null` when they are not a valid set from the player's hand. */
export function tradeOffer(state: GameState, playerId: PlayerId, cardIds: number[]): TradeOffer | null {
  const cards = pickCards(state.hands[playerId] ?? [], cardIds)
  if (cards === null || cardIds.length !== 3 || new Set(cardIds).size !== 3 || !isValidSet(cards)) {
    return null
  }
  const armies = tradeValue(cards, state.settings.cardTradeScale, state.tradeCount)
  const bonus = bonusTerritory(state, playerId, cards)
  return {
    cardIds: cardIds as [number, number, number],
    armies,
    bonusTerritory: bonus,
    total: armies + (bonus === null ? 0 : TERRITORY_BONUS),
  }
}

/** The set of the player's hand worth the most armies, territory bonus included, or `null`. */
export function bestTrade(state: GameState, playerId: PlayerId): TradeOffer | null {
  return tradeableSets(state.hands[playerId] ?? [])
    .map((set) => tradeOffer(state, playerId, set))
    .reduce<TradeOffer | null>((best, offer) => (offer !== null && (best === null || offer.total > best.total) ? offer : best), null)
}
