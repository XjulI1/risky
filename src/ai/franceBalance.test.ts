import { beforeAll, describe, expect, it } from 'vitest'
import { applyActionInPlace, mapById, type ContinentId, type GameState, type PlayerId } from '../engine'
import { NEW_TURN, nextAiAction, progressAfter } from './index'
import { newAiGame } from './testScenarios'

/** Enough games to measure the early takings of each region within a few points: 120 left them at ±9 points. */
const GAME_COUNT = 480
const PLAYER_COUNT = 3
const MAX_TURNS = 500
const FIRST_SEED = 9000
const MIN_HELD_SHARE = 0.2
const MAX_FIRST_HOLDER_WIN_SHARE = 0.6
/**
 * The advantage of a region is measured on the games where it is first taken by this round: a region taken
 * later mostly falls to the player already winning, whatever its bonus.
 */
const EARLY_ROUND_LIMIT = 6
/** Fewer early takings than this make the measure too noisy to judge. */
const MIN_EARLY_TAKINGS = 10

const france = mapById('france')

/** What happened to one region during one game. */
type RegionGame = {
  /** The first player to complete the region by a conquest; holding it from the deal does not count. */
  firstHolder: PlayerId | null
  /** Round (one turn of every player) of that first complete taking. */
  firstRound: number | null
  conquests: number
}

type GameResult = {
  winner: PlayerId | null
  regions: Record<ContinentId, RegionGame>
}

function holderOf(state: GameState, region: ContinentId): PlayerId | null {
  const territories = france.continents[region]?.territories ?? []
  const owner = state.territories[territories[0] ?? '']?.owner ?? null
  return owner !== null && territories.every((id) => state.territories[id]?.owner === owner) ? owner : null
}

function playGame(game: number): GameResult {
  const state = newAiGame(['hard', 'hard', 'hard'], FIRST_SEED + game, {}, 'france')
  const regions: Record<ContinentId, RegionGame> = Object.fromEntries(
    france.continentIds.map((id) => [id, { firstHolder: null, firstRound: null, conquests: 0 }]),
  )
  let turn = NEW_TURN
  let turns = 0
  while (state.phase.kind !== 'gameOver' && turns < MAX_TURNS) {
    const action = nextAiAction(state, turn)
    if (action === null) {
      break
    }
    const result = applyActionInPlace(state, action)
    if (!result.ok) {
      throw new Error(`${action.type}: ${result.error.message}`)
    }
    turns += result.events.filter((event) => event.type === 'turnStarted').length
    turn = progressAfter(turn, action, result.events)
    for (const event of result.events) {
      const region = event.type === 'territoryConquered' ? france.territories[event.to]?.continent : undefined
      const record = region === undefined ? undefined : regions[region]
      if (region === undefined || record === undefined) {
        continue
      }
      record.conquests += 1
      if (record.firstHolder === null && holderOf(state, region) !== null) {
        record.firstHolder = holderOf(state, region)
        record.firstRound = Math.ceil(turns / PLAYER_COUNT)
      }
    }
  }
  return { winner: state.winner, regions }
}

type RegionStats = {
  heldShare: number
  meanFirstRound: number
  earlyTakings: number
  firstHolderWinShare: number
  conquestsPerTerritory: number
}

function statsOf(results: GameResult[], region: ContinentId): RegionStats {
  const games = results.map((result) => ({ winner: result.winner, ...result.regions[region] }))
  const held = games.filter((game) => game.firstHolder !== null && game.firstHolder !== undefined)
  const early = held.filter((game) => (game.firstRound ?? Infinity) <= EARLY_ROUND_LIMIT)
  const size = france.continents[region]?.territories.length ?? 1
  return {
    heldShare: held.length / results.length,
    meanFirstRound: held.reduce((sum, game) => sum + (game.firstRound ?? 0), 0) / Math.max(1, held.length),
    earlyTakings: early.length,
    firstHolderWinShare: early.filter((game) => game.winner === game.firstHolder).length / Math.max(1, early.length),
    conquestsPerTerritory: games.reduce((sum, game) => sum + (game.conquests ?? 0), 0) / results.length / size,
  }
}

const percent = (share: number) => `${Math.round(share * 100)} %`.padStart(6)

describe.runIf(process.env.FRANCE_BALANCE !== undefined)('balance of the France map', () => {
  let stats: Record<ContinentId, RegionStats> = {}

  beforeAll(() => {
    const results = Array.from({ length: GAME_COUNT }, (_, game) => playGame(game))
    stats = Object.fromEntries(france.continentIds.map((region) => [region, statsOf(results, region)]))
    const lines = france.continentIds.map((region) => {
      const { heldShare, meanFirstRound, earlyTakings, firstHolderWinShare, conquestsPerTerritory } = stats[region] as RegionStats
      const name = `${france.continents[region]?.name} +${france.continents[region]?.bonus}`.padEnd(18)
      const victory = `${percent(firstHolderWinShare)} (${String(earlyTakings).padStart(3)})`
      return `${name}${percent(heldShare)}   ${meanFirstRound.toFixed(1).padStart(5)}   ${victory}   ${conquestsPerTerritory.toFixed(2).padStart(5)}`
    })
    console.info(
      [`France, ${GAME_COUNT} parties entre trois IA difficiles`, `Région            prise  1er tour  victoire si prise au tour ${EARLY_ROUND_LIMIT} au plus (parties)  conquêtes/territoire`, ...lines].join('\n'),
    )
  }, 0)

  it(`has every region taken whole in at least ${MIN_HELD_SHARE * 100} % of the games`, () => {
    const rare = france.continentIds.filter((region) => (stats[region]?.heldShare ?? 0) < MIN_HELD_SHARE)
    expect(rare).toEqual([])
  })

  it(`never gives the victory to the first to take a region by round ${EARLY_ROUND_LIMIT} in more than ${MAX_FIRST_HOLDER_WIN_SHARE * 100} % of the games`, () => {
    const decisive = france.continentIds.filter(
      (region) =>
        (stats[region]?.earlyTakings ?? 0) >= MIN_EARLY_TAKINGS && (stats[region]?.firstHolderWinShare ?? 0) > MAX_FIRST_HOLDER_WIN_SHARE,
    )
    expect(decisive).toEqual([])
  })

  it('makes Île-de-France change hands more often than any other region', () => {
    const idf = stats.ile_de_france?.conquestsPerTerritory ?? 0
    const others = france.continentIds.filter((region) => region !== 'ile_de_france').map((region) => stats[region]?.conquestsPerTerritory ?? 0)
    expect(idf).toBeGreaterThan(Math.max(...others))
  })
})
