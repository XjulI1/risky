import { beforeAll, describe, expect, it } from 'vitest'
import type { GameSettings, HeuristicLevel, MapId } from '../engine'
import { playUntilHumanOrEnd } from './index'
import { newAiGame } from './testScenarios'

const GAME_COUNT = 60
const MAX_TURNS = 500
const MIN_HARD_WIN_RATE = 0.45
const MIN_FRANCE_HARD_WIN_RATE = 0.4

const ORDERS: HeuristicLevel[][] = [
  ['easy', 'normal', 'hard'],
  ['easy', 'hard', 'normal'],
  ['normal', 'easy', 'hard'],
  ['normal', 'hard', 'easy'],
  ['hard', 'easy', 'normal'],
  ['hard', 'normal', 'easy'],
]

function levelsFor(game: number): HeuristicLevel[] {
  return ORDERS[game % ORDERS.length] ?? []
}

function winnerLevel(game: number, settings: Partial<GameSettings>, mapId: MapId): HeuristicLevel | null {
  const { state } = playUntilHumanOrEnd(newAiGame(levelsFor(game), 5000 + game, settings, mapId), { maxTurns: MAX_TURNS })
  const winner = state.players.find((player) => player.id === state.winner)
  return winner?.kind === 'ai' && winner.level !== 'expert' ? winner.level : null
}

type TournamentResult = {
  wins: Record<HeuristicLevel, number>
  unfinished: number
}

function playTournament(settings: Partial<GameSettings>, mapId: MapId = 'classic'): TournamentResult {
  const wins: Record<HeuristicLevel, number> = { easy: 0, normal: 0, hard: 0 }
  let unfinished = 0
  for (let game = 0; game < GAME_COUNT; game++) {
    const level = winnerLevel(game, settings, mapId)
    if (level === null) {
      unfinished += 1
    } else {
      wins[level] += 1
    }
  }
  return { wins, unfinished }
}

describe.each([
  { variant: 'classic', settings: {} },
  { variant: 'with secret missions', settings: { secretMissions: true } },
  { variant: 'with capitals', settings: { capitals: true } },
])('reference tournament, $variant', ({ variant, settings }) => {
  let result: TournamentResult = { wins: { easy: 0, normal: 0, hard: 0 }, unfinished: 0 }

  beforeAll(() => {
    result = playTournament(settings)
  }, 120_000)

  it('plays every order of the levels as often', () => {
    const counts = ORDERS.map((order) =>
      Array.from({ length: GAME_COUNT }, (_, game) => levelsFor(game)).filter((levels) => levels === order).length,
    )
    expect(counts).toEqual(ORDERS.map(() => GAME_COUNT / ORDERS.length))
  })

  it('ends every game with a winner', () => {
    expect(result.unfinished).toBe(0)
  })

  it('makes each level win more than the one below', () => {
    expect(result.wins.normal).toBeGreaterThan(result.wins.easy)
    expect(result.wins.hard).toBeGreaterThan(result.wins.normal)
  })

  it.runIf(variant === 'classic')(`makes the hard level win at least ${MIN_HARD_WIN_RATE * 100} % of the games`, () => {
    expect(result.wins.hard / GAME_COUNT).toBeGreaterThanOrEqual(MIN_HARD_WIN_RATE)
  })
})

describe('reference tournament on the France map', () => {
  let result: TournamentResult = { wins: { easy: 0, normal: 0, hard: 0 }, unfinished: 0 }

  beforeAll(() => {
    result = playTournament({}, 'france')
  }, 120_000)

  it('ends every game with a winner', () => {
    expect(result.unfinished).toBe(0)
  })

  it('makes each level win more than the one below', () => {
    expect(result.wins.normal).toBeGreaterThan(result.wins.easy)
    expect(result.wins.hard).toBeGreaterThan(result.wins.normal)
  })

  it(`makes the hard level win at least ${MIN_FRANCE_HARD_WIN_RATE * 100} % of the games`, () => {
    expect(result.wins.hard / GAME_COUNT).toBeGreaterThanOrEqual(MIN_FRANCE_HARD_WIN_RATE)
  })
})
