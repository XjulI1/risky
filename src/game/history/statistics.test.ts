import { describe, expect, it } from 'vitest'
import { classicMap, createGame, NEUTRAL_PLAYER_ID, type GameEvent, type GameState, type PlayerConfig } from '../../engine'
import { finalRanking, initialStatistics, recordStatistics } from './statistics'

const PLAYERS: PlayerConfig[] = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
  { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' },
  { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' },
]

function game(playerCount = 3): GameState {
  const created = createGame({ seed: 5, players: PLAYERS.slice(0, playerCount) })
  if (!created.ok) throw new Error(created.error.message)
  return created.state
}

function owned(state: GameState, playerId: string) {
  const territories = Object.values(state.territories).filter((territory) => territory.owner === playerId)
  return { territories: territories.length, armies: territories.reduce((sum, territory) => sum + territory.armies, 0) }
}

const roll = (attackerDice: number[], defenderDice: number[], attackerLosses: number, defenderLosses: number, defender = 'p2'): GameEvent => ({
  type: 'diceRolled',
  attacker: 'p1',
  defender,
  from: 'north_africa',
  to: 'brazil',
  attackerDice,
  defenderDice,
  defenderBonus: 0,
  attackerLosses,
  defenderLosses,
})

describe('snapshots', () => {
  it('records the first turn of a game that opens on it', () => {
    const state = game()
    const stats = initialStatistics(state, 1)
    expect(stats.snapshots).toEqual([
      { turn: 1, players: { p1: owned(state, 'p1'), p2: owned(state, 'p2'), p3: owned(state, 'p3') } },
    ])
  })

  it('records nothing during the set-up', () => {
    expect(initialStatistics(game(), 0).snapshots).toEqual([])
  })

  it('records territories and armies of every player at each turn start', () => {
    const state = game()
    const stats = recordStatistics(initialStatistics(state, 1), [{ type: 'turnStarted', playerId: 'p2', reserve: 3 }], state, 1)
    expect(stats.snapshots.map((snapshot) => snapshot.turn)).toEqual([1, 2])
    expect(stats.snapshots[1]?.players.p2).toEqual(owned(state, 'p2'))
  })

  it('leaves the neutral army out', () => {
    const stats = initialStatistics(game(2), 1)
    expect(Object.keys(stats.snapshots[0]?.players ?? {})).toEqual(['p1', 'p2'])
    expect(Object.keys(stats.counters)).toEqual(['p1', 'p2'])
  })
})

describe('counters', () => {
  it('counts lost and destroyed armies and the rolls won on the best die', () => {
    const state = game()
    const stats = recordStatistics(
      initialStatistics(state, 1),
      [roll([6, 5, 1], [4, 4], 0, 2), roll([3, 2], [3, 1], 1, 1)],
      state,
      1,
    )
    expect(stats.counters.p1).toMatchObject({ attacks: 1, armiesDestroyed: 3, armiesLost: 1, bestDieRolls: 1 })
    expect(stats.counters.p2).toMatchObject({ attacks: 0, armiesLost: 3, armiesDestroyed: 1 })
  })

  it('counts the armies of the neutral army destroyed by the attacker', () => {
    const state = game(2)
    const stats = recordStatistics(initialStatistics(state, 1), [roll([6, 5, 1], [4, 4], 0, 2, NEUTRAL_PLAYER_ID)], state, 1)
    expect(stats.counters.p1?.armiesDestroyed).toBe(2)
    expect(stats.counters).not.toHaveProperty(NEUTRAL_PLAYER_ID)
  })

  it('counts conquests, trades and the armies they gave', () => {
    const state = game()
    const stats = recordStatistics(
      initialStatistics(state, 1),
      [
        { type: 'cardsTraded', playerId: 'p1', cardIds: [1, 2, 3], armies: 6, bonusTerritory: 'peru' },
        { type: 'territoryConquered', playerId: 'p1', previousOwner: 'p2', from: 'north_africa', to: 'brazil' },
      ],
      state,
      1,
    )
    expect(stats.counters.p1).toMatchObject({ conquests: 1, trades: 1, armiesFromTrades: 8 })
  })

  it('dates the elimination of a player', () => {
    const state = game()
    const stats = recordStatistics(
      initialStatistics(state, 1),
      [{ type: 'playerEliminated', playerId: 'p2', by: 'p1', cardsTaken: 0 }],
      state,
      23,
    )
    expect(stats.counters.p2?.eliminatedAtTurn).toBe(23)
    expect(stats.counters.p1?.eliminatedAtTurn).toBeNull()
  })

  it('leaves the given statistics untouched', () => {
    const state = game()
    const before = initialStatistics(state, 1)
    const copy = structuredClone(before)
    recordStatistics(before, [roll([6, 5, 1], [4, 4], 0, 2), { type: 'turnStarted', playerId: 'p2', reserve: 3 }], state, 1)
    expect(before).toEqual(copy)
  })
})

describe('final ranking', () => {
  it('puts the winner first, then the others from the last eliminated to the first', () => {
    const state = game()
    let stats = initialStatistics(state, 1)
    stats = recordStatistics(stats, [{ type: 'playerEliminated', playerId: 'p1', by: 'p3', cardsTaken: 0 }], state, 18)
    stats = recordStatistics(stats, [{ type: 'playerEliminated', playerId: 'p2', by: 'p3', cardsTaken: 0 }], state, 30)
    expect(finalRanking(stats, 'p3')).toEqual(['p3', 'p2', 'p1'])
  })

  it('keeps every territory accounted for in a snapshot', () => {
    const snapshot = initialStatistics(game(), 1).snapshots[0]
    const total = Object.values(snapshot?.players ?? {}).reduce((sum, player) => sum + player.territories, 0)
    expect(total).toBe(classicMap.territoryIds.length)
  })
})
