import { buildDeck, mapOf, type Card, type GameState, type PlayerId } from '../../engine'
import type { AiRandom } from '../aiRandom'
import type { PlayerView } from '../playerView'

const MAX_SEED = 0xffffffff

function shuffled<T>(items: readonly T[], random: AiRandom): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = random.int(0, i)
    const swapped = result[i] as T
    result[i] = result[j] as T
    result[j] = swapped
  }
  return result
}

function dealHands(view: PlayerView, unknown: Card[]): Record<PlayerId, Card[]> {
  return Object.fromEntries(
    view.players.map((player) => [
      player.id,
      player.id === view.viewer ? [...view.hand] : unknown.splice(0, view.handSizes[player.id] ?? 0),
    ]),
  )
}

/**
 * A complete game state matching what `view` shows: the cards the viewer cannot see are dealt at random
 * between the other hands, by their sizes, and the deck; the discard is empty and the dice generator is seeded from `random`.
 */
export function determinize(view: PlayerView, random: AiRandom): GameState {
  const known = new Set(view.hand.map((card) => card.id))
  const unknown = shuffled(
    buildDeck(mapOf(view)).filter((card) => !known.has(card.id)),
    random,
  )
  const hands = dealHands(view, unknown)
  return {
    settings: view.settings,
    mapId: view.mapId,
    players: view.players.map((player) => ({ ...player })),
    territories: Object.fromEntries(Object.entries(view.territories).map(([id, territory]) => [id, { ...territory }])),
    firstPlayerIndex: view.firstPlayerIndex,
    currentPlayerIndex: view.currentPlayerIndex,
    phase: structuredClone(view.phase),
    deck: unknown,
    discard: [],
    hands,
    tradeCount: view.tradeCount,
    conqueredThisTurn: view.conqueredThisTurn,
    rngState: random.int(0, MAX_SEED),
    winner: view.winner,
    winReason: view.winReason,
    missions: null,
    capitals: view.capitals === null ? null : { ...view.capitals },
  }
}
