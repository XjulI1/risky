import { classicMap, type GameState } from '../engine'
import { browserStorage } from './animationSpeed'
import type { GameSetup } from './gameForm'
import type { JournalEntry } from './history/journal'
import type { GameStatistics } from './history/statistics'

/** Key of the single saved game in the browser storage. */
export const SAVE_KEY = 'risk.savedGame'

/** Version of the save format; a save of another version is rejected. */
export const SAVE_FORMAT_VERSION = 3

export type SaveStatus = 'inProgress' | 'finished'

/** Everything needed to resume a game where it stopped, or to show its end screen again. */
export type SavedGame = {
  formatVersion: typeof SAVE_FORMAT_VERSION
  savedAt: string
  status: SaveStatus
  creation: GameSetup
  engineState: GameState
  journal: JournalEntry[]
  statistics: GameStatistics
  turnNumber: number
}

/** What the browser storage holds. */
export type LoadedSave =
  | { kind: 'none' }
  | { kind: 'saved'; game: SavedGame }
  | { kind: 'unreadable' }
  | { kind: 'unavailable' }

export type SaveStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isJournalEntry(value: unknown): value is JournalEntry {
  return (
    isRecord(value) &&
    typeof value.turn === 'number' &&
    typeof value.playerId === 'string' &&
    typeof value.text === 'string' &&
    typeof value.header === 'boolean' &&
    Array.isArray(value.details) &&
    value.details.every((detail) => typeof detail === 'string')
  )
}

function isStatistics(value: unknown): value is GameStatistics {
  return (
    isRecord(value) &&
    Array.isArray(value.snapshots) &&
    value.snapshots.every((snapshot) => isRecord(snapshot) && typeof snapshot.turn === 'number' && isRecord(snapshot.players)) &&
    isRecord(value.counters)
  )
}

function isCreation(value: unknown): value is GameSetup {
  return (
    isRecord(value) &&
    Array.isArray(value.players) &&
    value.players.every((player) => isRecord(player) && typeof player.id === 'string' && typeof player.name === 'string') &&
    isRecord(value.settings)
  )
}

function isEngineState(value: unknown): value is GameState {
  if (!isRecord(value) || !Array.isArray(value.players) || !isRecord(value.territories) || !isRecord(value.phase)) {
    return false
  }
  const playerIds = new Set(value.players.flatMap((player) => (isRecord(player) && typeof player.id === 'string' ? [player.id] : [])))
  const territories = value.territories
  return (
    playerIds.size === value.players.length &&
    typeof value.phase.kind === 'string' &&
    typeof value.currentPlayerIndex === 'number' &&
    (value.missions === null || isRecord(value.missions)) &&
    (value.capitals === null || isRecord(value.capitals)) &&
    Object.keys(territories).length === classicMap.territoryIds.length &&
    classicMap.territoryIds.every((id) => {
      const territory = territories[id]
      return (
        isRecord(territory) &&
        typeof territory.owner === 'string' &&
        playerIds.has(territory.owner) &&
        typeof territory.armies === 'number'
      )
    })
  )
}

function isSavedGame(value: unknown): value is SavedGame {
  return (
    isRecord(value) &&
    value.formatVersion === SAVE_FORMAT_VERSION &&
    typeof value.savedAt === 'string' &&
    (value.status === 'inProgress' || value.status === 'finished') &&
    isCreation(value.creation) &&
    isEngineState(value.engineState) &&
    Array.isArray(value.journal) &&
    value.journal.every(isJournalEntry) &&
    isStatistics(value.statistics) &&
    typeof value.turnNumber === 'number'
  )
}

function parse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Reads the saved game; an unreadable save is deleted, and a storage that refuses access is unavailable. */
export function loadSavedGame(storage: SaveStorage | null = browserStorage()): LoadedSave {
  if (storage === null) {
    return { kind: 'unavailable' }
  }
  let text: string | null
  try {
    text = storage.getItem(SAVE_KEY)
  } catch {
    return { kind: 'unavailable' }
  }
  if (text === null) {
    return { kind: 'none' }
  }
  const value = parse(text)
  if (isSavedGame(value)) {
    return { kind: 'saved', game: value }
  }
  deleteSavedGame(storage)
  return { kind: 'unreadable' }
}

/** Writes the saved game, replacing the previous one; returns `false` when the storage refuses it. */
export function writeSavedGame(game: SavedGame, storage: SaveStorage | null = browserStorage()): boolean {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(game))
    return storage !== null
  } catch {
    return false
  }
}

/** Deletes the saved game, silently ignoring a storage that refuses it. */
export function deleteSavedGame(storage: SaveStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(SAVE_KEY)
  } catch {
    return
  }
}
