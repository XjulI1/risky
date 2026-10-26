import { CONQUER_24_TERRITORIES, missionDeck } from './missions'
import { placeRemainingArmiesAtRandom } from './placement'
import { unknownMap } from './errors'
import { isMapId } from './maps'
import { mapOf, rollInt, ruleError, shuffleWithState } from './state'
import type {
  AiLevel,
  Card,
  CardSymbol,
  CreateGameResult,
  GameConfig,
  GameMap,
  GameSettings,
  GameState,
  Mission,
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
  armyPlacement: 'random',
  cardTradeScale: 'progressive',
  attackerMaxDice: 3,
  defenderMaxDice: 2,
  fortifyMode: 'connected',
  secretMissions: false,
  capitals: false,
}

const MIN_PLAYERS = 2
const MIN_MISSION_PLAYERS = 3
const MAX_PLAYERS = 6
const INITIAL_ARMIES: Record<number, number> = { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 }
const NEUTRAL_TERRITORY_COUNT = 14
const CARD_SYMBOLS: CardSymbol[] = ['infantry', 'cavalry', 'artillery']
const JOKER_COUNT = 2
/** Levels an AI player can have, easiest first. */
export const AI_LEVELS: readonly AiLevel[] = ['easy', 'normal', 'hard', 'expert']

const ALLOWED_VALUES: { [K in keyof GameSettings]?: readonly GameSettings[K][] } = {
  territoryDistribution: ['random', 'choice'],
  armyPlacement: ['random', 'manual'],
  cardTradeScale: ['progressive', 'fixed'],
  fortifyMode: ['connected', 'adjacent'],
}

function hasValidControl(player: PlayerConfig): boolean {
  return player.kind === 'human' || (player.kind === 'ai' && AI_LEVELS.includes(player.level))
}

function validatePlayers(players: PlayerConfig[]): RuleError | null {
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    return ruleError('INVALID_PLAYER_COUNT', 'Une partie se joue de 2 à 6 joueurs.')
  }
  if (!players.every(hasValidControl)) {
    return ruleError('INVALID_PLAYER', "Le type ou le niveau d'un joueur est invalide.")
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

function resolveSettings(overrides: Partial<GameSettings>, playerCount: number): GameSettings | RuleError {
  const settings = { ...DEFAULT_SETTINGS, ...overrides }
  if (typeof settings.secretMissions !== 'boolean' || typeof settings.capitals !== 'boolean') {
    return ruleError('INVALID_SETTING', 'Un réglage de la partie est invalide.')
  }
  if (settings.secretMissions && settings.capitals) {
    return ruleError('INVALID_SETTING', "Les variantes missions et capitales s'excluent.")
  }
  if (settings.secretMissions && playerCount < MIN_MISSION_PLAYERS) {
    return ruleError('INVALID_SETTING', 'Les missions secrètes exigent au moins 3 joueurs.')
  }
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

/** Every card of the game for `map`: one per territory, then the jokers. */
export function buildDeck(map: GameMap): Card[] {
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
    level: 'easy',
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

/** Gives the cards of `deck` to the players in order; a player drawing its own elimination gets 24 territories instead. */
export function dealMissions(deck: readonly Mission[], playerIds: readonly PlayerId[]): Record<PlayerId, Mission> {
  return Object.fromEntries(
    playerIds.map((playerId, index) => {
      const mission = deck[index] ?? CONQUER_24_TERRITORIES
      const ownElimination = mission.kind === 'eliminate' && mission.target === playerId
      return [playerId, ownElimination ? CONQUER_24_TERRITORIES : mission]
    }),
  )
}

/**
 * Creates a new game: validates players and settings, adds the neutral army in a 2-player game,
 * shuffles the deck, draws the first player, distributes territories according to the settings
 * and, when secret missions are on, deals one mission to each player. In the capitals mode, the set-up
 * ends on the capital choice instead of the first turn.
 */
export function createGame(config: GameConfig): CreateGameResult {
  const playersError = validatePlayers(config.players)
  if (playersError !== null) {
    return { ok: false, error: playersError }
  }
  const settings = resolveSettings(config.settings ?? {}, config.players.length)
  if ('code' in settings) {
    return { ok: false, error: settings }
  }

  const mapId = config.mapId ?? 'classic'
  if (!isMapId(mapId)) {
    return { ok: false, error: unknownMap(mapId) }
  }
  const map = mapOf({ mapId })
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
    mapId,
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
    winReason: null,
    missions: null,
    capitals: null,
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
    if (settings.armyPlacement === 'random') {
      placeRemainingArmiesAtRandom(state, remaining, [])
    } else {
      state.phase = { kind: 'placement', remaining }
    }
  }

  if (settings.secretMissions) {
    const playerIds = config.players.map((player) => player.id)
    state.missions = dealMissions(shuffleWithState(state, missionDeck(map, playerIds)), playerIds)
  }

  return { ok: true, state }
}
