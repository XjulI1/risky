import { mapOf, ruleError, shuffleWithState } from './state'
import type {
  Action,
  Card,
  CardSymbol,
  CardTradeScale,
  GameEvent,
  GameState,
  PlayerId,
  PublicState,
  RuleError,
  TerritoryId,
} from './types'

type TradeCardsAction = Extract<Action, { type: 'tradeCards' }>

const SET_SIZE = 3
const TERRITORY_BONUS = 2
const PROGRESSIVE_VALUES = [4, 6, 8, 10, 12, 15]
const PROGRESSIVE_STEP = 5
const FIXED_TRIPLE_VALUES: Record<CardSymbol, number> = { infantry: 4, cavalry: 6, artillery: 8 }
const FIXED_MIXED_VALUE = 10
const SYMBOLS: CardSymbol[] = ['infantry', 'cavalry', 'artillery']

function isTriple(symbols: CardSymbol[]): boolean {
  const distinct = new Set(symbols).size
  return distinct === 1 || distinct === SET_SIZE
}

/** Three identical symbols, three different symbols, or any set containing a joker. */
export function isValidSet(cards: Card[]): boolean {
  if (cards.length !== SET_SIZE) {
    return false
  }
  const symbols = cards.flatMap((card) => (card.symbol === 'joker' ? [] : [card.symbol]))
  return symbols.length < SET_SIZE || isTriple(symbols)
}

function jokerSubstitutions(symbols: CardSymbol[], jokers: number): CardSymbol[][] {
  if (jokers === 0) {
    return [symbols]
  }
  return SYMBOLS.flatMap((symbol) => jokerSubstitutions([...symbols, symbol], jokers - 1))
}

function fixedValue(cards: Card[]): number {
  const symbols = cards.flatMap((card) => (card.symbol === 'joker' ? [] : [card.symbol]))
  const values = jokerSubstitutions(symbols, SET_SIZE - symbols.length)
    .filter(isTriple)
    .map((triple) => (new Set(triple).size === 1 ? FIXED_TRIPLE_VALUES[triple[0] as CardSymbol] : FIXED_MIXED_VALUE))
  return Math.max(0, ...values)
}

function progressiveValue(tradeCount: number): number {
  const last = PROGRESSIVE_VALUES.length - 1
  return PROGRESSIVE_VALUES[tradeCount] ?? (PROGRESSIVE_VALUES[last] ?? 0) + PROGRESSIVE_STEP * (tradeCount - last)
}

/** Armies a valid set is worth, given the trade scale and the number of sets already traded in the game. */
export function tradeValue(cards: Card[], scale: CardTradeScale, tradeCount: number): number {
  return scale === 'progressive' ? progressiveValue(tradeCount) : fixedValue(cards)
}

function facesEnemy(state: PublicState, playerId: PlayerId, territory: TerritoryId): boolean {
  return (mapOf(state).territories[territory]?.neighbors ?? []).some(
    (neighbor) => state.territories[neighbor]?.owner !== playerId,
  )
}

/** Territory receiving the +2 bonus: the first owned card territory facing an enemy, else the first owned one. */
export function bonusTerritory(state: PublicState, playerId: PlayerId, cards: Card[]): TerritoryId | null {
  const owned = cards.flatMap((card) =>
    card.territory !== null && state.territories[card.territory]?.owner === playerId ? [card.territory] : [],
  )
  return owned.find((territory) => facesEnemy(state, playerId, territory)) ?? owned[0] ?? null
}

function pickFromHand(hand: Card[], cardIds: number[]): Card[] | null {
  if (new Set(cardIds).size !== cardIds.length) {
    return null
  }
  const cards = cardIds.map((id) => hand.find((card) => card.id === id))
  return cards.every((card) => card !== undefined) ? (cards as Card[]) : null
}

export function tradeCards(state: GameState, action: TradeCardsAction, events: GameEvent[]): RuleError | null {
  if (state.phase.kind !== 'reinforce' && state.phase.kind !== 'eliminationTrade') {
    return ruleError('WRONG_PHASE', "Cette action n'est pas possible dans la phase en cours.")
  }
  const hand = state.hands[action.playerId] ?? []
  const cards = pickFromHand(hand, action.cardIds)
  if (cards === null) {
    return ruleError('CARD_NOT_IN_HAND', 'Ces cartes ne sont pas dans votre main.')
  }
  if (!isValidSet(cards)) {
    return ruleError('INVALID_CARD_SET', 'Ces cartes ne forment pas une série valide.')
  }

  const armies = tradeValue(cards, state.settings.cardTradeScale, state.tradeCount)
  const bonus = bonusTerritory(state, action.playerId, cards)
  state.tradeCount += 1
  state.phase.reserve += armies
  state.hands[action.playerId] = hand.filter((card) => !action.cardIds.includes(card.id))
  state.discard.push(...cards)
  const bonusTarget = bonus === null ? undefined : state.territories[bonus]
  if (bonusTarget !== undefined) {
    bonusTarget.armies += TERRITORY_BONUS
  }
  events.push({ type: 'cardsTraded', playerId: action.playerId, cardIds: [...action.cardIds], armies, bonusTerritory: bonus })
  return null
}

export function drawCard(state: GameState, playerId: PlayerId, events: GameEvent[]): void {
  if (state.deck.length === 0) {
    state.deck = shuffleWithState(state, state.discard)
    state.discard = []
  }
  const card = state.deck.shift()
  if (card === undefined) {
    return
  }
  state.hands[playerId] = [...(state.hands[playerId] ?? []), card]
  events.push({ type: 'cardDrawn', playerId, cardId: card.id })
}
