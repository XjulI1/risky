import { beforeAll, describe, expect, it } from 'vitest'
import { applyActionInPlace, type AiLevel } from '../../engine'
import { NEW_TURN, nextAiAction, progressAfter } from '../index'
import { newAiGame } from '../testScenarios'

const GAME_COUNT = 60
const PLAYER_COUNT = 3
const MAX_TURNS = 500
const FIRST_SEED = 7000
const MIN_EXPERT_WINS = 30
const MAX_MEAN_MS = 250
const MAX_P95_MS = 500
const MAX_DECISION_MS = 1500

type GameResult = {
  expertWon: boolean
  finished: boolean
  rejection: string | null
  decisionMs: number[]
}

function levelsFor(game: number): AiLevel[] {
  return Array.from({ length: PLAYER_COUNT }, (_, seat) => (seat === game % PLAYER_COUNT ? 'expert' : 'hard'))
}

function playGame(game: number): GameResult {
  const state = newAiGame(levelsFor(game), FIRST_SEED + game)
  const expertId = state.players.find((player) => player.kind === 'ai' && player.level === 'expert')?.id
  const decisionMs: number[] = []
  let turn = NEW_TURN
  let turns = 0
  while (state.phase.kind !== 'gameOver' && turns < MAX_TURNS) {
    const isExpert = state.players[state.currentPlayerIndex]?.id === expertId
    const start = performance.now()
    const action = nextAiAction(state, turn)
    if (isExpert) {
      decisionMs.push(performance.now() - start)
    }
    if (action === null) {
      break
    }
    const result = applyActionInPlace(state, action)
    if (!result.ok) {
      return { expertWon: false, finished: false, rejection: `${action.type}: ${result.error.message}`, decisionMs }
    }
    turns += result.events.filter((event) => event.type === 'turnStarted').length
    turn = progressAfter(turn, action, result.events)
  }
  return { expertWon: state.winner === expertId, finished: state.winner !== null, rejection: null, decisionMs }
}

function percentile(sorted: number[], share: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * share))] ?? 0
}

describe.runIf(process.env.EXPERT_TOURNAMENT !== undefined)('expert tournament', () => {
  let results: GameResult[] = []
  let decisions: number[] = []

  beforeAll(() => {
    results = Array.from({ length: GAME_COUNT }, (_, game) => playGame(game))
    decisions = results.flatMap((result) => result.decisionMs).sort((a, b) => a - b)
    const mean = decisions.reduce((sum, ms) => sum + ms, 0) / decisions.length
    console.info(
      `Expert: ${results.filter((result) => result.expertWon).length}/${GAME_COUNT} wins; ` +
        `${decisions.length} decisions, mean ${mean.toFixed(0)} ms, p95 ${percentile(decisions, 0.95).toFixed(0)} ms, ` +
        `max ${(decisions.at(-1) ?? 0).toFixed(0)} ms`,
    )
  }, 0)

  it('ends every game with a winner, without any rejected action', () => {
    expect(results.map((result) => result.rejection).filter((rejection) => rejection !== null)).toEqual([])
    expect(results.every((result) => result.finished)).toBe(true)
  })

  it(`makes the expert win at least ${MIN_EXPERT_WINS} of the ${GAME_COUNT} games against two hard AIs`, () => {
    expect(results.filter((result) => result.expertWon).length).toBeGreaterThanOrEqual(MIN_EXPERT_WINS)
  })

  it('keeps the expert decisions short', () => {
    const mean = decisions.reduce((sum, ms) => sum + ms, 0) / decisions.length
    expect(mean).toBeLessThan(MAX_MEAN_MS)
    expect(percentile(decisions, 0.95)).toBeLessThan(MAX_P95_MS)
    expect(decisions.at(-1) ?? 0).toBeLessThan(MAX_DECISION_MS)
  })
})
