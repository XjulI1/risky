import { describe, expect, it } from 'vitest'
import { NEUTRAL_PLAYER_ID } from '../../engine'
import { newAiGame } from '../testScenarios'
import { positionValue } from './positionValue'

describe('positionValue', () => {
  it('is 1 for the winner and 0 for each of its opponents', () => {
    const state = newAiGame(['expert', 'hard', 'hard'], 3)
    state.winner = 'p1'
    expect(positionValue(state, 'p1')).toBe(1)
    expect(positionValue(state, 'p2')).toBe(0)
    expect(positionValue(state, 'p3')).toBe(0)
  })

  it('is 0 for an eliminated player', () => {
    const state = newAiGame(['expert', 'hard', 'hard'], 3)
    state.players[2]!.eliminated = true
    expect(positionValue(state, 'p3')).toBe(0)
  })

  it('shares 1 between the players still in the game', () => {
    const state = newAiGame(['expert', 'hard', 'hard'], 3)
    const total = ['p1', 'p2', 'p3'].reduce((sum, id) => sum + positionValue(state, id), 0)
    expect(total).toBeCloseTo(1)
  })

  it('leaves the neutral army out of the share', () => {
    const state = newAiGame(['expert', 'hard'], 3)
    expect(state.players.some((player) => player.id === NEUTRAL_PLAYER_ID)).toBe(true)
    expect(positionValue(state, 'p1') + positionValue(state, 'p2')).toBeCloseTo(1)
  })

  it('grows with the armies of the player', () => {
    const state = newAiGame(['expert', 'hard', 'hard'], 3)
    const before = positionValue(state, 'p1')
    const territory = Object.entries(state.territories).find(([, t]) => t.owner === 'p1')?.[0] ?? ''
    state.territories[territory]!.armies += 10
    expect(positionValue(state, 'p1')).toBeGreaterThan(before)
  })

  it('grows with the cards of the player', () => {
    const state = newAiGame(['expert', 'hard', 'hard'], 3)
    const before = positionValue(state, 'p1')
    state.hands.p1 = state.deck.splice(0, 2)
    expect(positionValue(state, 'p1')).toBeGreaterThan(before)
  })
})
