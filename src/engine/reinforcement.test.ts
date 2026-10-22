import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { reinforcementCount } from './reinforcement'
import { currentPlayer } from './state'
import { assignTerritories, createTestGame, giveAllTerritoriesTo, ownedBy, placeAll } from './testUtils'
import type { GameState } from './types'

const SCATTERED = [
  'alaska',
  'brazil',
  'iceland',
  'egypt',
  'ural',
  'indonesia',
  'ontario',
  'peru',
  'ukraine',
  'congo',
  'china',
  'new_guinea',
  'quebec',
  'india',
]

function boardFor(owned: string[]): GameState {
  const state = giveAllTerritoriesTo(createTestGame(3), 'p2')
  return assignTerritories(state, 'p1', owned)
}

describe('reinforcementCount', () => {
  it('gives at least 3 armies', () => {
    expect(reinforcementCount(boardFor(SCATTERED.slice(0, 7)), 'p1')).toBe(3)
  })

  it('divides the number of territories by 3, rounded down', () => {
    expect(reinforcementCount(boardFor(SCATTERED), 'p1')).toBe(4)
  })

  it('adds the bonus of every continent fully owned', () => {
    const owned = [
      'eastern_australia',
      'indonesia',
      'new_guinea',
      'western_australia',
      'venezuela',
      'brazil',
      'argentina',
      'peru',
      'alaska',
      'iceland',
      'egypt',
      'ural',
    ]
    expect(reinforcementCount(boardFor(owned), 'p1')).toBe(4 + 2 + 2)
  })
})

describe('deploy', () => {
  function reinforcing(): { state: GameState; playerId: string; territory: string; reserve: number } {
    const state = placeAll(createTestGame(3, { seed: 21 }))
    const playerId = currentPlayer(state).id
    const reserve = state.phase.kind === 'reinforce' ? state.phase.reserve : 0
    return { state, playerId, territory: ownedBy(state, playerId)[0] as string, reserve }
  }

  it('starts the turn with the computed reserve', () => {
    const { state, playerId, reserve } = reinforcing()
    expect(reserve).toBe(reinforcementCount(state, playerId))
  })

  it('moves part of the reserve onto an owned territory', () => {
    const { state, playerId, territory, reserve } = reinforcing()
    const before = state.territories[territory]?.armies ?? 0
    const result = applyAction(state, { type: 'deploy', playerId, territory, armies: 2 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories[territory]?.armies).toBe(before + 2)
    expect(result.state.phase).toEqual({ kind: 'reinforce', reserve: reserve - 2 })
    expect(result.events).toEqual([{ type: 'armiesDeployed', playerId, territory, armies: 2 }])
  })

  it('rejects a territory owned by another player', () => {
    const { state, playerId } = reinforcing()
    const enemy = Object.keys(state.territories).find((id) => state.territories[id]?.owner !== playerId)
    const result = applyAction(state, { type: 'deploy', playerId, territory: enemy as string, armies: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_OWNER' } })
  })

  it.each([0, -1, 1.5])('rejects %s armies', (armies) => {
    const { state, playerId, territory } = reinforcing()
    const result = applyAction(state, { type: 'deploy', playerId, territory, armies })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARMY_COUNT' } })
  })

  it('rejects more armies than the reserve', () => {
    const { state, playerId, territory, reserve } = reinforcing()
    const result = applyAction(state, { type: 'deploy', playerId, territory, armies: reserve + 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARMY_COUNT' } })
  })

  it('moves on to the attack phase once the reserve is empty', () => {
    const { state, playerId, territory, reserve } = reinforcing()
    const result = applyAction(state, { type: 'deploy', playerId, territory, armies: reserve })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toEqual({ kind: 'attack' })
  })
})
