import {
  AI_LEVELS,
  DEFAULT_SETTINGS,
  type AiLevel,
  type GameSettings,
  type MapId,
  type PlayerConfig,
  type PlayerControl,
} from '../engine'

export { AI_LEVELS }

/** Players, map and rules of a game, without the random seed: enough to start it again. */
export type GameSetup = {
  players: PlayerConfig[]
  settings: GameSettings
  mapId: MapId
}

/** Six player colors, all distinct from the grey of the neutral army. */
export const PLAYER_PALETTE = ['#d64541', '#3a7bd5', '#3fa34d', '#e3b23c', '#8e5cc4', '#8d5a3b']

export const MIN_FORM_PLAYERS = 2
export const MAX_FORM_PLAYERS = 6
export const MAX_NAME_LENGTH = 20
export const MIN_MISSION_PLAYERS = 3

/** French labels of the AI levels. */
export const AI_LEVEL_LABELS: Record<AiLevel, string> = {
  easy: 'Facile',
  normal: 'Normal',
  hard: 'Difficile',
  expert: 'Expert',
}

/** Historical war leaders the AI players are named after. */
export const AI_NAMES = [
  'Jules César',
  'Hannibal',
  'Attila',
  'Léonidas',
  'Sun Tzu',
  'Vercingétorix',
  'Boudica',
  'Zénobie',
  'Charlemagne',
  'Saladin',
  'Gengis Khan',
  'Jeanne d\'Arc',
  'Tokugawa Ieyasu',
  'Vauban',
  'Napoléon',
  'Wellington',
  'Chaka',
  'Foch',
  'De Gaulle',
  'Joukov',
]

/** A source of random numbers in [0, 1), like `Math.random`. */
export type RandomSource = () => number

const HUMAN: PlayerControl = { kind: 'human' }
const DEFAULT_AI: PlayerControl = { kind: 'ai', level: 'normal' }

function humanName(id: string): string {
  return `Joueur ${id.replace('player-', '')}`
}

function freeAiName(players: PlayerConfig[], random: RandomSource): string {
  const used = new Set(players.map((player) => player.name.trim().toLowerCase()))
  const free = AI_NAMES.filter((name) => !used.has(name.toLowerCase()))
  return free[Math.floor(random() * free.length)] ?? `IA ${players.length + 1}`
}

function newPlayer(
  players: PlayerConfig[],
  index: number,
  color: string,
  control: PlayerControl,
  random: RandomSource,
): PlayerConfig {
  const id = `player-${index + 1}`
  const name = control.kind === 'ai' ? freeAiName(players, random) : humanName(id)
  return { id, name, color, ...control }
}

/** The form as it opens: a human player, two normal AIs named at random, the classic map and the default rules. */
export function defaultSetup(random: RandomSource = Math.random): GameSetup {
  const players = [0, 1, 2].reduce<PlayerConfig[]>(
    (created, index) => [
      ...created,
      newPlayer(created, index, PLAYER_PALETTE[index] ?? '#000000', index === 0 ? HUMAN : DEFAULT_AI, random),
    ],
    [],
  )
  return { players, settings: { ...DEFAULT_SETTINGS }, mapId: 'classic' }
}

/** Adds a normal AI with the next free number and color and a free historical name, up to 6 players. */
export function addPlayer(players: PlayerConfig[], random: RandomSource = Math.random): PlayerConfig[] {
  if (players.length >= MAX_FORM_PLAYERS) {
    return players
  }
  const usedColors = new Set(players.map((player) => player.color))
  const color = PLAYER_PALETTE.find((candidate) => !usedColors.has(candidate)) ?? '#000000'
  const usedIds = new Set(players.map((player) => player.id))
  let index = players.length
  while (usedIds.has(`player-${index + 1}`)) {
    index += 1
  }
  return [...players, newPlayer(players, index, color, DEFAULT_AI, random)]
}

/** Gives `level` to every AI player, so that all the AIs of a game play at the same level. */
export function applyAiLevel(players: PlayerConfig[], level: AiLevel): PlayerConfig[] {
  return players.map((player) => (player.kind === 'ai' ? { ...player, level } : player))
}

/**
 * Makes a player human or an AI of the given level. A player changing kind is renamed: a free
 * historical name for a new AI, a numbered name for a new human.
 */
export function chooseControl(
  players: PlayerConfig[],
  id: string,
  control: PlayerControl,
  random: RandomSource = Math.random,
): PlayerConfig[] {
  const others = players.filter((player) => player.id !== id)
  return players.map((player) => {
    if (player.id !== id) {
      return player
    }
    const name =
      player.kind === control.kind
        ? player.name
        : control.kind === 'ai'
          ? freeAiName(others, random)
          : humanName(player.id)
    return { id: player.id, name, color: player.color, ...control }
  })
}

/** Removes a player, down to 2 players. */
export function removePlayer(players: PlayerConfig[], id: string): PlayerConfig[] {
  return players.length <= MIN_FORM_PLAYERS ? players : players.filter((player) => player.id !== id)
}

/** Gives `color` to a player; a player who already had it takes the other one's color in exchange. */
export function chooseColor(players: PlayerConfig[], id: string, color: string): PlayerConfig[] {
  const previous = players.find((player) => player.id === id)?.color
  return players.map((player) => {
    if (player.id === id) {
      return { ...player, color }
    }
    return player.color === color && previous !== undefined ? { ...player, color: previous } : player
  })
}

/** A variant of the rules, exclusive of the other one. */
export type Variant = 'secretMissions' | 'capitals'

/** Checks or unchecks a variant; checking one unchecks the other, since they exclude each other. */
export function chooseVariant(settings: GameSettings, variant: Variant, checked: boolean): GameSettings {
  if (!checked) {
    return { ...settings, [variant]: false }
  }
  return { ...settings, secretMissions: variant === 'secretMissions', capitals: variant === 'capitals' }
}

/** Whether `level` can be chosen with these rules: the expert level is reserved to the classic mode. */
export function isLevelAvailable(level: AiLevel, settings: GameSettings): boolean {
  return level !== 'expert' || (!settings.secretMissions && !settings.capitals)
}

/** The level the AIs keep once the rules change: the hard level when the expert one is no longer available. */
export function levelForSettings(level: AiLevel, settings: GameSettings): AiLevel {
  return isLevelAvailable(level, settings) ? level : 'hard'
}

/** Error message for each player whose name is invalid. */
export function nameErrors(players: PlayerConfig[]): Record<string, string> {
  const counts = new Map<string, number>()
  for (const player of players) {
    const key = player.name.trim().toLowerCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const errors: Record<string, string> = {}
  for (const player of players) {
    const name = player.name.trim()
    if (name === '') {
      errors[player.id] = 'Nom obligatoire'
    } else if (name.length > MAX_NAME_LENGTH) {
      errors[player.id] = `${MAX_NAME_LENGTH} caractères maximum`
    } else if ((counts.get(name.toLowerCase()) ?? 0) > 1) {
      errors[player.id] = 'Nom déjà utilisé'
    }
  }
  return errors
}
