import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { FortifyMode, GameState } from './types'

function fortifying(owned: string[], fortifyMode: FortifyMode = 'connected', playerCount = 3): GameState {
  const state = giveAllTerritoriesTo(createTestGame(playerCount, { settings: { fortifyMode } }), 'p2')
  assignTerritories(state, 'p1', owned)
  assignTerritories(state, 'p1', ['north_africa'], 6)
  state.currentPlayerIndex = 0
  state.phase = { kind: 'fortify' }
  return state
}

describe('fortify', () => {
  it('moves armies to an owned neighbor and ends the turn', () => {
    const state = fortifying(['north_africa', 'egypt'])
    const result = applyAction(state, { type: 'fortify', playerId: 'p1', from: 'north_africa', to: 'egypt', armies: 4 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories.north_africa?.armies).toBe(2)
    expect(result.state.territories.egypt?.armies).toBe(5)
    expect(result.events[0]).toEqual({
      type: 'fortified',
      playerId: 'p1',
      from: 'north_africa',
      to: 'egypt',
      armies: 4,
    })
    expect(result.state.currentPlayerIndex).toBe(1)
    expect(result.state.phase.kind).toBe('reinforce')
    expect(result.events.at(-1)).toMatchObject({ type: 'turnStarted', playerId: 'p2' })
  })

  it('rejects emptying the origin', () => {
    const state = fortifying(['north_africa', 'egypt'])
    const result = applyAction(state, { type: 'fortify', playerId: 'p1', from: 'north_africa', to: 'egypt', armies: 6 })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARMY_COUNT' } })
  })

  it.each([0, 1.5])('rejects %s armies', (armies) => {
    const state = fortifying(['north_africa', 'egypt'])
    const result = applyAction(state, { type: 'fortify', playerId: 'p1', from: 'north_africa', to: 'egypt', armies })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARMY_COUNT' } })
  })

  it('rejects a destination owned by another player', () => {
    const state = fortifying(['north_africa'])
    const result = applyAction(state, { type: 'fortify', playerId: 'p1', from: 'north_africa', to: 'egypt', armies: 2 })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_OWNER' } })
  })

  it('rejects an origin owned by another player', () => {
    const state = fortifying(['north_africa'])
    const result = applyAction(state, { type: 'fortify', playerId: 'p1', from: 'egypt', to: 'north_africa', armies: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_OWNER' } })
  })

  it('ends the turn without moving anything when skipped', () => {
    const state = fortifying(['north_africa', 'egypt'])
    const result = applyAction(state, { type: 'skipFortify', playerId: 'p1' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories).toEqual(state.territories)
    expect(result.state.currentPlayerIndex).toBe(1)
    expect(result.state.phase.kind).toBe('reinforce')
  })

  it('skips the neutral army when the turn passes in a 2-player game', () => {
    const state = fortifying(['north_africa', 'egypt'], 'connected', 2)
    state.currentPlayerIndex = 1
    assignTerritories(state, 'p2', ['brazil'])
    const result = applyAction(state, { type: 'skipFortify', playerId: 'p2' })
    expect(result).toMatchObject({ ok: true, state: { currentPlayerIndex: 0 } })
  })
})

describe('adjacent fortify mode', () => {
  it('rejects a destination that is not a neighbor', () => {
    const state = fortifying(['north_africa', 'egypt', 'middle_east'], 'adjacent')
    const result = applyAction(state, {
      type: 'fortify',
      playerId: 'p1',
      from: 'north_africa',
      to: 'middle_east',
      armies: 2,
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_ADJACENT' } })
  })
})

describe('connected fortify mode', () => {
  it('accepts a destination linked to the origin through own territories', () => {
    const state = fortifying(['north_africa', 'egypt', 'middle_east'])
    const result = applyAction(state, {
      type: 'fortify',
      playerId: 'p1',
      from: 'north_africa',
      to: 'middle_east',
      armies: 2,
    })
    expect(result).toMatchObject({ ok: true })
  })

  it('rejects a destination only reachable through an enemy territory', () => {
    const state = fortifying(['north_africa', 'middle_east'])
    const result = applyAction(state, {
      type: 'fortify',
      playerId: 'p1',
      from: 'north_africa',
      to: 'middle_east',
      armies: 2,
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_CONNECTED' } })
  })
})
