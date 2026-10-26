import { beforeAll, describe, expect, it } from 'vitest'
import { applyAction, type AiLevel, type GameSettings, type GameState, type MapId } from '../engine'
import { NEW_TURN, nextAiAction, playUntilHumanOrEnd, progressAfter, type AutoPlay } from './index'
import { newAiGame } from './testScenarios'

const LEVELS: AiLevel[] = ['easy', 'normal', 'hard']
const GAME_COUNT = 100
const MAX_TURNS = 500
const MAX_DECISION_MS = 50

function settingsFor(game: number): GameSettings {
  return {
    territoryDistribution: game % 3 === 0 ? 'choice' : 'random',
    armyPlacement: game % 4 < 2 ? 'random' : 'manual',
    cardTradeScale: game % 5 < 3 ? 'progressive' : 'fixed',
    attackerMaxDice: [3, 3, 2, 3, 1][game % 5] as number,
    defenderMaxDice: [2, 1, 2, 3, 2, 2, 1][game % 7] as number,
    fortifyMode: game % 2 === 0 ? 'connected' : 'adjacent',
    secretMissions: game % 5 !== 0 && game % 3 !== 1,
    capitals: game % 3 === 1,
  }
}

function levelsFor(game: number): AiLevel[] {
  const playerCount = 2 + (game % 5)
  return Array.from({ length: playerCount }, (_, i) => LEVELS[(game * 7 + i * 5 + Math.floor(game / 5)) % 3] as AiLevel)
}

function gameFor(game: number, mapId: MapId): GameState {
  return newAiGame(levelsFor(game), 1000 + game * 37, settingsFor(game), mapId)
}

function slowestDecision(state: GameState): number {
  let current = state
  let turn = NEW_TURN
  let slowest = 0
  for (;;) {
    const started = performance.now()
    const action = nextAiAction(current, turn)
    slowest = Math.max(slowest, performance.now() - started)
    if (action === null) {
      return slowest
    }
    const result = applyAction(current, action)
    if (!result.ok) {
      throw new Error(result.error.message)
    }
    turn = progressAfter(turn, action, result.events)
    current = result.state
  }
}

type GameResult = AutoPlay & {
  game: number
  levels: AiLevel[]
  settings: GameSettings
}

describe.each<MapId>(['classic', 'france'])('games between AIs on the %s map', (mapId) => {
  let results: GameResult[] = []

  beforeAll(() => {
    results = Array.from({ length: GAME_COUNT }, (_, game) => ({
      game,
      levels: levelsFor(game),
      settings: settingsFor(game),
      ...playUntilHumanOrEnd(gameFor(game, mapId), { maxTurns: MAX_TURNS }),
    }))
  }, 60_000)

  it('are played on that map', () => {
    expect(results.every((result) => result.state.mapId === mapId)).toBe(true)
  })

  it('covers 2 to 6 players, every level and varied settings', () => {
    expect(new Set(results.map((result) => result.levels.length))).toEqual(new Set([2, 3, 4, 5, 6]))
    expect(results.filter((result) => result.settings.secretMissions).length).toBeGreaterThan(40)
    expect(results.filter((result) => result.settings.capitals).length).toBeGreaterThan(30)
    expect(new Set(results.filter((result) => result.settings.capitals).map((result) => result.levels.length))).toEqual(new Set([2, 3, 4, 5, 6]))
    expect(new Set(results.flatMap((result) => result.levels))).toEqual(new Set(LEVELS))
    expect(new Set(results.map((result) => JSON.stringify(result.settings))).size).toBeGreaterThan(20)
  })

  it('never submit an action the engine rejects', () => {
    expect(results.filter((result) => result.rejection !== null).map(({ game, rejection }) => ({ game, rejection }))).toEqual([])
  })

  it(`all end with a victory in less than ${MAX_TURNS} turns`, () => {
    const unfinished = results.filter((result) => result.state.phase.kind !== 'gameOver' || result.turns >= MAX_TURNS)
    expect(unfinished.map(({ game, levels, settings, turns }) => ({ game, levels, settings, turns }))).toEqual([])
  })

  it('replay identically from the same seed', () => {
    for (const game of [0, 13, 42, 77]) {
      const replay = playUntilHumanOrEnd(gameFor(game, mapId), { maxTurns: MAX_TURNS })
      expect(replay.actions).toEqual(results[game]?.actions)
      expect(replay.state.winner).toBe(results[game]?.state.winner)
    }
  })

  it(`decide in less than ${MAX_DECISION_MS} ms`, () => {
    const slowest = Math.max(...[3, 4, 9].map((game) => slowestDecision(gameFor(game, mapId))))
    expect(slowest).toBeLessThan(MAX_DECISION_MS)
  })
})
