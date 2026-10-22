import { DEFAULT_SETTINGS, type GameSettings, type PlayerConfig } from '../engine'

/** Players and rules of a game, without the random seed: enough to start it again. */
export type GameSetup = {
  players: PlayerConfig[]
  settings: GameSettings
}

/** Six player colors, all distinct from the grey of the neutral army. */
export const PLAYER_PALETTE = ['#d64541', '#3a7bd5', '#3fa34d', '#e3b23c', '#8e5cc4', '#e8803a']

export const MIN_FORM_PLAYERS = 2
export const MAX_FORM_PLAYERS = 6
export const MAX_NAME_LENGTH = 20

function newPlayer(index: number, color: string): PlayerConfig {
  return { id: `player-${index + 1}`, name: `Joueur ${index + 1}`, color, kind: 'human' }
}

/** The form as it opens: 3 human players and the default rules. */
export function defaultSetup(): GameSetup {
  return {
    players: [0, 1, 2].map((index) => newPlayer(index, PLAYER_PALETTE[index] ?? '#000000')),
    settings: { ...DEFAULT_SETTINGS },
  }
}

/** Adds a player with the next free number and color, up to 6 players. */
export function addPlayer(players: PlayerConfig[]): PlayerConfig[] {
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
  return [...players, newPlayer(index, color)]
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
