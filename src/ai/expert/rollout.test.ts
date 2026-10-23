import { describe, expect, it } from 'vitest'
import { NEW_TURN } from '../heuristic'
import { newAiGame, scenario } from '../testScenarios'
import { rollout } from './rollout'

function reinforcingGame() {
  const state = newAiGame(['expert', 'hard', 'hard'], 8)
  return { state, me: state.players[state.currentPlayerIndex]?.id ?? '' }
}

describe('rollout', () => {
  it('stops when the player starts its next turn', () => {
    const { state, me } = reinforcingGame()
    rollout(state, me, NEW_TURN)
    expect(state.phase.kind === 'gameOver' || (state.players[state.currentPlayerIndex]?.id === me && state.phase.kind === 'reinforce')).toBe(true)
  })

  it('lets every other player play its turn', () => {
    const { state, me } = reinforcingGame()
    const firstIndex = state.currentPlayerIndex
    rollout(state, me, NEW_TURN)
    expect(state.currentPlayerIndex).toBe(firstIndex)
    expect(state.phase.kind).toBe('reinforce')
  })

  it('returns a value between 0 and 1', () => {
    const { state, me } = reinforcingGame()
    const value = rollout(state, me, NEW_TURN)
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThanOrEqual(1)
  })

  it('stops at the end of the game', () => {
    const state = scenario({
      layout: { alaska: ['p1', 30] },
      filler: 'p1',
      playerCount: 2,
      phase: { kind: 'attack' },
    })
    state.territories.kamchatka = { owner: 'p2', armies: 1 }
    state.players = state.players.filter((player) => !player.isNeutral)
    expect(rollout(state, 'p1', NEW_TURN)).toBe(1)
    expect(state.winner).toBe('p1')
  })
})
