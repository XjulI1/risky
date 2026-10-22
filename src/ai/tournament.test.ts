import { beforeAll, describe, expect, it } from 'vitest'
import type { AiLevel } from '../engine'
import { playUntilHumanOrEnd } from './index'
import { newAiGame } from './testScenarios'

const GAME_COUNT = 60
const MAX_TURNS = 500
const MIN_HARD_WIN_RATE = 0.45

const ORDERS: AiLevel[][] = [
  ['easy', 'normal', 'hard'],
  ['easy', 'hard', 'normal'],
  ['normal', 'easy', 'hard'],
  ['normal', 'hard', 'easy'],
  ['hard', 'easy', 'normal'],
  ['hard', 'normal', 'easy'],
]

function levelsFor(game: number): AiLevel[] {
  return ORDERS[game % ORDERS.length] ?? []
}

function winnerLevel(game: number): AiLevel | null {
  const { state } = playUntilHumanOrEnd(newAiGame(levelsFor(game), 5000 + game), { maxTurns: MAX_TURNS })
  const winner = state.players.find((player) => player.id === state.winner)
  return winner?.kind === 'ai' ? winner.level : null
}

describe('reference tournament', () => {
  const wins: Record<AiLevel, number> = { easy: 0, normal: 0, hard: 0 }
  let unfinished = 0

  beforeAll(() => {
    for (let game = 0; game < GAME_COUNT; game++) {
      const level = winnerLevel(game)
      if (level === null) {
        unfinished += 1
      } else {
        wins[level] += 1
      }
    }
  }, 120_000)

  it('plays every order of the levels as often', () => {
    const counts = ORDERS.map((order) =>
      Array.from({ length: GAME_COUNT }, (_, game) => levelsFor(game)).filter((levels) => levels === order).length,
    )
    expect(counts).toEqual(ORDERS.map(() => GAME_COUNT / ORDERS.length))
  })

  it('ends every game with a winner', () => {
    expect(unfinished).toBe(0)
  })

  it('makes each level win more than the one below', () => {
    expect(wins.normal).toBeGreaterThan(wins.easy)
    expect(wins.hard).toBeGreaterThan(wins.normal)
  })

  it(`makes the hard level win at least ${MIN_HARD_WIN_RATE * 100} % of the games`, () => {
    expect(wins.hard / GAME_COUNT).toBeGreaterThanOrEqual(MIN_HARD_WIN_RATE)
  })
})
