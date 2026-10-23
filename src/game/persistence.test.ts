import { describe, expect, it } from 'vitest'
import { createGame, DEFAULT_SETTINGS, type GameState } from '../engine'
import { initialStatistics } from './history/statistics'
import { deleteSavedGame, loadSavedGame, SAVE_FORMAT_VERSION, SAVE_KEY, writeSavedGame, type SavedGame } from './persistence'

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    values,
  }
}

const players = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' as const },
  { id: 'p2', name: 'Napoléon', color: '#3a7bd5', kind: 'ai' as const, level: 'hard' as const },
  { id: 'p3', name: 'Foch', color: '#3fa34d', kind: 'ai' as const, level: 'hard' as const },
]

function engineState(secretMissions = false): GameState {
  const created = createGame({ players, seed: 9, settings: { secretMissions } })
  if (!created.ok) throw new Error(created.error.message)
  return created.state
}

function savedGame(overrides: Partial<SavedGame> = {}): SavedGame {
  const state = engineState()
  return {
    formatVersion: SAVE_FORMAT_VERSION,
    savedAt: '2026-10-23T08:30:00.000Z',
    status: 'inProgress',
    creation: { players, settings: { ...DEFAULT_SETTINGS } },
    engineState: state,
    journal: [{ turn: 1, playerId: 'p1', text: 'Tour 1 — Alice', header: true, details: [] }],
    statistics: initialStatistics(state, 1),
    turnNumber: 1,
    ...overrides,
  }
}

function storageWith(value: unknown) {
  return memoryStorage({ [SAVE_KEY]: typeof value === 'string' ? value : JSON.stringify(value) })
}

describe('saved game', () => {
  it('reads back exactly what was written', () => {
    const storage = memoryStorage()
    const game = savedGame()
    expect(writeSavedGame(game, storage)).toBe(true)
    expect(loadSavedGame(storage)).toEqual({ kind: 'saved', game })
  })

  it('finds nothing in an empty storage', () => {
    expect(loadSavedGame(memoryStorage())).toEqual({ kind: 'none' })
  })

  it('treats invalid JSON as unreadable and deletes it', () => {
    const storage = storageWith('{ not json')
    expect(loadSavedGame(storage)).toEqual({ kind: 'unreadable' })
    expect(storage.values.has(SAVE_KEY)).toBe(false)
  })

  it('is at version 3 since the capitals mode', () => {
    expect(SAVE_FORMAT_VERSION).toBe(3)
  })

  it.each([1, 2, 4])('treats a save of version %i as unreadable and deletes it', (formatVersion) => {
    const storage = storageWith({ ...savedGame(), formatVersion })
    expect(loadSavedGame(storage)).toEqual({ kind: 'unreadable' })
    expect(storage.values.has(SAVE_KEY)).toBe(false)
  })

  it('keeps the missions of a game saved then resumed', () => {
    const storage = memoryStorage()
    const state = engineState(true)
    const game = savedGame({ engineState: state, creation: { players, settings: { ...DEFAULT_SETTINGS, secretMissions: true } } })
    writeSavedGame(game, storage)
    const loaded = loadSavedGame(storage)
    expect(loaded.kind === 'saved' && loaded.game.engineState.missions).toEqual(state.missions)
    expect(Object.keys(state.missions ?? {})).toHaveLength(3)
  })

  it('treats an engine state without missions as unreadable', () => {
    const game: SavedGame = structuredClone(savedGame())
    delete (game.engineState as Partial<GameState>).missions
    expect(loadSavedGame(storageWith(game))).toEqual({ kind: 'unreadable' })
  })

  it('treats an engine state without capitals as unreadable', () => {
    const game: SavedGame = structuredClone(savedGame())
    delete (game.engineState as Partial<GameState>).capitals
    expect(loadSavedGame(storageWith(game))).toEqual({ kind: 'unreadable' })
  })

  it.each(['savedAt', 'status', 'creation', 'engineState', 'journal', 'statistics', 'turnNumber'])(
    'treats a save without %s as unreadable',
    (field) => {
      const game: Record<string, unknown> = { ...savedGame() }
      delete game[field]
      expect(loadSavedGame(storageWith(game))).toEqual({ kind: 'unreadable' })
    },
  )

  it('treats an engine state that does not hold the 42 territories of known players as unreadable', () => {
    const game = savedGame()
    const missingTerritory = structuredClone(game)
    delete missingTerritory.engineState.territories.peru
    expect(loadSavedGame(storageWith(missingTerritory))).toEqual({ kind: 'unreadable' })
    const unknownOwner = structuredClone(game)
    unknownOwner.engineState.territories.peru = { owner: 'p9', armies: 3 }
    expect(loadSavedGame(storageWith(unknownOwner))).toEqual({ kind: 'unreadable' })
  })

  it('reports a failed write, such as a full storage, without throwing', () => {
    const full = {
      ...memoryStorage(),
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    }
    expect(writeSavedGame(savedGame(), full)).toBe(false)
    expect(writeSavedGame(savedGame(), null)).toBe(false)
  })

  it('treats a storage that refuses access as unavailable', () => {
    const blocked = {
      ...memoryStorage(),
      getItem: () => {
        throw new DOMException('denied', 'SecurityError')
      },
    }
    expect(loadSavedGame(blocked)).toEqual({ kind: 'unavailable' })
    expect(loadSavedGame(null)).toEqual({ kind: 'unavailable' })
  })

  it('deletes the save, silently when the storage refuses it', () => {
    const storage = storageWith(savedGame())
    deleteSavedGame(storage)
    expect(loadSavedGame(storage)).toEqual({ kind: 'none' })
    expect(() =>
      deleteSavedGame({
        ...memoryStorage(),
        removeItem: () => {
          throw new Error('denied')
        },
      }),
    ).not.toThrow()
  })
})
