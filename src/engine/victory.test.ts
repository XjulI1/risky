import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { classicMap } from './maps/classic'
import { CONQUER_24_TERRITORIES, GENERAL_MISSIONS } from './missions'
import { assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { ActionResult, ContinentId, GameState, Mission, PlayerId } from './types'

const NORTH_AMERICA_AND_OCEANIA = GENERAL_MISSIONS[1] as Mission
const EUROPE_SOUTH_AMERICA_AND_ONE = GENERAL_MISSIONS[4] as Mission
const EIGHTEEN_WITH_TWO = GENERAL_MISSIONS[7] as Mission

function territoriesOf(continent: ContinentId): string[] {
  return classicMap.continents[continent]?.territories ?? []
}

function missionGame(missions: Record<PlayerId, Mission>, current: PlayerId = 'p1'): GameState {
  const state = giveAllTerritoriesTo(createTestGame(4, { settings: { secretMissions: true } }), 'p4')
  state.missions = { p1: CONQUER_24_TERRITORIES, p2: CONQUER_24_TERRITORIES, p3: CONQUER_24_TERRITORIES, p4: CONQUER_24_TERRITORIES, ...missions }
  state.currentPlayerIndex = state.players.findIndex((player) => player.id === current)
  state.phase = { kind: 'attack' }
  return state
}

function succeed(result: ActionResult): Extract<ActionResult, { ok: true }> {
  if (!result.ok) throw new Error(result.error.code)
  return result
}

function attack(state: GameState, playerId: PlayerId, from: string, to: string) {
  return succeed(applyAction(state, { type: 'attack', playerId, from, to }))
}

describe('conversion of an elimination mission', () => {
  function carolOnHerLastTerritory(): GameState {
    const state = missionGame({ p1: CONQUER_24_TERRITORIES, p2: { kind: 'eliminate', target: 'p3' }, p4: { kind: 'eliminate', target: 'p1' } })
    assignTerritories(state, 'p1', ['north_africa'], 60)
    assignTerritories(state, 'p2', ['peru'], 1)
    assignTerritories(state, 'p3', ['brazil'], 1)
    return state
  }

  it('turns the mission into 24 territories when someone else eliminates the target', () => {
    const { state, events } = attack(carolOnHerLastTerritory(), 'p1', 'north_africa', 'brazil')
    expect(state.missions?.p2).toEqual(CONQUER_24_TERRITORIES)
    expect(events.filter((event) => event.type === 'missionConverted')).toEqual([{ type: 'missionConverted', playerId: 'p2' }])
    expect(state.missions?.p4).toEqual({ kind: 'eliminate', target: 'p1' })
    expect(state.phase.kind).toBe('conquestMove')
  })

  it('makes the holder win when it eliminates the target itself', () => {
    const start = carolOnHerLastTerritory()
    assignTerritories(start, 'p2', ['peru'], 60)
    start.currentPlayerIndex = 1
    const { state, events } = attack(start, 'p2', 'peru', 'brazil')
    expect(state.phase).toEqual({ kind: 'gameOver' })
    expect(state.winner).toBe('p2')
    expect(state.winReason).toBe('mission')
    expect(events.some((event) => event.type === 'missionConverted')).toBe(false)
    expect(events.slice(-2)).toEqual([
      { type: 'missionAccomplished', playerId: 'p2', mission: { kind: 'eliminate', target: 'p3' } },
      { type: 'gameWon', playerId: 'p2' },
    ])
  })
})

describe('victory by mission', () => {
  it('ends the game as soon as the last territory of Oceania is conquered, moving the minimum armies', () => {
    const start = missionGame({ p1: NORTH_AMERICA_AND_OCEANIA })
    assignTerritories(start, 'p1', [...territoriesOf('northAmerica'), 'indonesia', 'western_australia'])
    assignTerritories(start, 'p1', ['new_guinea'], 60)
    assignTerritories(start, 'p2', ['eastern_australia'], 1)
    const { state, events } = attack(start, 'p1', 'new_guinea', 'eastern_australia')
    expect(state.phase).toEqual({ kind: 'gameOver' })
    expect(state.winner).toBe('p1')
    expect(state.winReason).toBe('mission')
    const lastRoll = events.filter((event) => event.type === 'diceRolled').at(-1)
    expect(events.find((event) => event.type === 'conquestMoved')).toEqual({
      type: 'conquestMoved',
      playerId: 'p1',
      from: 'new_guinea',
      to: 'eastern_australia',
      armies: lastRoll?.attackerDice.length,
    })
    expect(Object.values(state.territories).every((territory) => territory.armies >= 1)).toBe(true)
    expect(events.at(-2)).toEqual({ type: 'missionAccomplished', playerId: 'p1', mission: NORTH_AMERICA_AND_OCEANIA })
  })

  it('goes on while the continent of choice is missing', () => {
    const start = missionGame({ p1: EUROPE_SOUTH_AMERICA_AND_ONE })
    assignTerritories(start, 'p1', [...territoriesOf('europe'), ...territoriesOf('southAmerica')])
    assignTerritories(start, 'p1', ['ukraine'], 60)
    const { state } = attack(start, 'p1', 'ukraine', 'ural')
    expect(state.phase.kind).toBe('conquestMove')
    expect(state.winner).toBeNull()
  })

  it('ends the game when a deployment brings an 18th territory to 2 armies', () => {
    const start = missionGame({ p1: EIGHTEEN_WITH_TWO })
    const territories = classicMap.territoryIds.slice(0, 20)
    assignTerritories(start, 'p1', territories, 1)
    assignTerritories(start, 'p1', territories.slice(0, 17), 2)
    start.phase = { kind: 'reinforce', reserve: 3 }
    const { state, events } = succeed(applyAction(start, { type: 'deploy', playerId: 'p1', territory: territories[19] as string, armies: 1 }))
    expect(state.phase).toEqual({ kind: 'gameOver' })
    expect(state.winner).toBe('p1')
    expect(events.at(-1)).toEqual({ type: 'gameWon', playerId: 'p1' })
  })

  it('ends the game on a fortification without passing the turn', () => {
    const start = missionGame({ p1: EIGHTEEN_WITH_TWO })
    const territories = territoriesOf('northAmerica').concat(territoriesOf('southAmerica'), territoriesOf('africa'))
    assignTerritories(start, 'p1', territories, 2)
    assignTerritories(start, 'p1', ['alaska', 'greenland'], 1)
    assignTerritories(start, 'p1', ['alberta'], 5)
    start.phase = { kind: 'fortify' }
    const { state, events } = succeed(
      applyAction(start, { type: 'fortify', playerId: 'p1', from: 'alberta', to: 'alaska', armies: 1 }),
    )
    expect(state.winner).toBe('p1')
    expect(state.currentPlayerIndex).toBe(0)
    expect(events.some((event) => event.type === 'turnStarted' || event.type === 'cardDrawn')).toBe(false)
  })

  it("does not check another player's mission during the current turn", () => {
    const start = missionGame({ p2: CONQUER_24_TERRITORIES })
    assignTerritories(start, 'p2', classicMap.territoryIds.slice(0, 30))
    assignTerritories(start, 'p1', ['brazil'])
    start.phase = { kind: 'reinforce', reserve: 3 }
    const { state } = succeed(applyAction(start, { type: 'deploy', playerId: 'p1', territory: 'brazil', armies: 3 }))
    expect(state.winner).toBeNull()
    expect(state.phase.kind).toBe('attack')
  })

  it('keeps the elimination of every opponent as a victory', () => {
    const start = missionGame({ p1: EIGHTEEN_WITH_TWO })
    start.players = start.players.map((player) => (['p2', 'p4'].includes(player.id) ? { ...player, eliminated: true } : player))
    giveAllTerritoriesTo(start, 'p1', 1)
    assignTerritories(start, 'p1', ['north_africa'], 60)
    assignTerritories(start, 'p3', ['brazil'], 1)
    const { state } = attack(start, 'p1', 'north_africa', 'brazil')
    expect(state.winner).toBe('p1')
    expect(state.winReason).toBe('domination')
  })

  it('records the domination as the reason of a classic victory', () => {
    const start = giveAllTerritoriesTo(createTestGame(3), 'p1')
    start.players = start.players.map((player) => (player.id === 'p2' ? { ...player, eliminated: true } : player))
    assignTerritories(start, 'p1', ['north_africa'], 60)
    assignTerritories(start, 'p3', ['brazil'], 1)
    start.currentPlayerIndex = 0
    start.phase = { kind: 'attack' }
    const { state } = attack(start, 'p1', 'north_africa', 'brazil')
    expect(state.winReason).toBe('domination')
    expect(state.missions).toBeNull()
  })
})
