import { classicMap } from './maps/classic'
import { rollInt, ruleError, shuffleWithState } from './state'
import type {
  Card,
  CardSymbol,
  CreateGameResult,
  GameConfig,
  GameMap,
  GameSettings,
  GameState,
  Player,
  PlayerConfig,
  PlayerId,
  RuleError,
} from './types'

/** Identifier of the neutral army added to 2-player games. */
export const NEUTRAL_PLAYER_ID = 'neutral'
export const NEUTRAL_COLOR = '#9e9e9e'

/** Settings used for every value not given at game creation. */
export const DEFAULT_SETTINGS: GameSettings = {
  territoryDistribution: 'random',
  cardTradeScale: 'progressive',
  attackerMaxDice: 3,
  defenderMaxDice: 2,
  fortifyMode: 'connected',
}

const MIN_PLAYERS = 2
const MAX_PLAYERS = 6
const INITIAL_ARMIES: Record<number, number> = { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 }
const NEUTRAL_TERRITORY_COUNT = 14
const CARD_SYMBOLS: CardSymbol[] = ['infantry', 'cavalry', 'artillery']
const JOKER_COUNT = 2

const ALLOWED_VALUES: { [K in keyof GameSettings]?: readonly GameSettings[K][] } = {
  territoryDistribution: ['random', 'choice'],
  cardTradeScale: ['progressive', 'fixed'],
  fortifyMode: ['connected', 'adjacent'],
}

function validatePlayers(players: PlayerConfig[]): RuleError | null {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    return ruleError('INVALID_PLAYER_COUNT', 'Une partie se joue de 2 à 6 joueurs.')
  }
  const ids = players.map((player) => player.id)
  if (new Set(ids).size !== ids.length || ids.includes(NEUTRAL_PLAYER_ID)) {
    return ruleError('DUPLICATE_PLAYER', 'Chaque joueur doit avoir un identifiant unique.')
  }
  const colors = players.map((player) => player.color.toLowerCase())
  if (players.length === MIN_PLAYERS) {
    colors.push(NEUTRAL_COLOR)
  }
  if (new Set(colors).size !== colors.length) {
    return ruleError('DUPLICATE_PLAYER', 'Chaque joueur doit avoir une couleur différente.')
  }
  return null
}

function isValidDiceCount(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 3
}

function resolveSettings(overrides: Partial<GameSettings> = {}): GameSettings | RuleError {
  const settings = { ...DEFAULT_SETTINGS, ...overrides }
  const enumKeys = Object.keys(ALLOWED_VALUES) as (keyof typeof ALLOWED_VALUES)[]
  const invalidEnum = enumKeys.some((key) => {
    const allowed: readonly unknown[] = ALLOWED_VALUES[key] ?? []
    return !allowed.includes(settings[key])
  })
  if (invalidEnum || !isValidDiceCount(settings.attackerMaxDice) || !isValidDiceCount(settings.defenderMaxDice)) {
    return ruleError('INVALID_SETTING', 'Un réglage de la partie est invalide.')
  }
  return settings
}

function buildDeck(map: GameMap): Card[] {
  const territoryCards: Card[] = map.territoryIds.map((territory, index) => ({
    id: index,
    symbol: CARD_SYMBOLS[index % CARD_SYMBOLS.length] as CardSymbol,
    territory,
  }))
  const jokers: Card[] = Array.from({ length: JOKER_COUNT }, (_, index) => ({
    id: territoryCards.length + index,
    symbol: 'joker',
    territory: null,
  }))
  return [...territoryCards, ...jokers]
}

function neutralPlayer(): Player {
  return {
    id: NEUTRAL_PLAYER_ID,
    name: 'Neutre',
    color: NEUTRAL_COLOR,
    kind: 'ai',
    isNeutral: true,
    eliminated: false,
  }
}

function placeNeutralArmy(state: GameState, territories: string[], initialArmies: number): void {
  for (const territory of territories) {
    state.territories[territory] = { owner: NEUTRAL_PLAYER_ID, armies: 1 }
  }
  for (let placed = territories.length; placed < initialArmies; placed++) {
    const territory = territories[rollInt(state, 0, territories.length - 1)] as string
    const target = state.territories[territory]
    if (target !== undefined) {
      target.armies += 1
    }
  }
}

function dealTerritories(
  state: GameState,
  territories: string[],
  players: PlayerConfig[],
  remaining: Record<PlayerId, number>,
): void {
  territories.forEach((territory, index) => {
    const owner = players[(state.firstPlayerIndex + index) % players.length] as PlayerConfig
    state.territories[territory] = { owner: owner.id, armies: 1 }
    remaining[owner.id] = (remaining[owner.id] ?? 0) - 1
  })
}

/**
 * Creates a new game: validates players and settings, adds the neutral army in a 2-player game,
 * shuffles the deck, draws the first player and distributes territories according to the settings.
 */
export function createGame(config: GameConfig): CreateGameResult {
  const playersError = validatePlayers(config.players)
  if (playersError !== null) {
    return { ok: false, error: playersError }
  }
  const settings = resolveSettings(config.settings)
  if ('code' in settings) {
    return { ok: false, error: settings }
  }

  const map = classicMap
  const withNeutral = config.players.length === MIN_PLAYERS
  const players: Player[] = [
    ...config.players.map((player) => ({ ...player, isNeutral: false, eliminated: false })),
    ...(withNeutral ? [neutralPlayer()] : []),
  ]
  const initialArmies = INITIAL_ARMIES[config.players.length] ?? 0
  const remaining: Record<PlayerId, number> = Object.fromEntries(
    config.players.map((player) => [player.id, initialArmies]),
  )

  const state: GameState = {
    settings,
    mapId: 'classic',
    players,
    territories: {},
    firstPlayerIndex: 0,
    currentPlayerIndex: 0,
    phase: { kind: 'claim', remaining },
    deck: [],
    discard: [],
    hands: Object.fromEntries(players.map((player) => [player.id, []])),
    tradeCount: 0,
    conqueredThisTurn: false,
    rngState: config.seed | 0,
    winner: null,
  }

  state.deck = shuffleWithState(state, buildDeck(map))
  state.firstPlayerIndex = rollInt(state, 0, config.players.length - 1)
  state.currentPlayerIndex = state.firstPlayerIndex

  let freeTerritories = shuffleWithState(state, map.territoryIds)
  if (withNeutral) {
    placeNeutralArmy(state, freeTerritories.slice(0, NEUTRAL_TERRITORY_COUNT), initialArmies)
    freeTerritories = freeTerritories.slice(NEUTRAL_TERRITORY_COUNT)
  }

  if (settings.territoryDistribution === 'random') {
    dealTerritories(state, freeTerritories, config.players, remaining)
    state.phase = { kind: 'placement', remaining }
  }

  return { ok: true, state }
}
