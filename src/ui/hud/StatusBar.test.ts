import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createGame, type GameState, type PlayerControl } from '../../engine'
import { IDLE, viewOf } from '../../game/interaction'
import StatusBar from './StatusBar.vue'

function game(firstPlayer: PlayerControl): GameState {
  const created = createGame({
    seed: 2,
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', ...firstPlayer },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  state.currentPlayerIndex = 0
  state.phase = { kind: 'attack' }
  return state
}

function hintOf(state: GameState): string {
  const wrapper = mount(StatusBar, { props: { state, view: viewOf(state, IDLE), instantResult: null } })
  return wrapper.get('[data-testid="status-hint"]').text()
}

describe('StatusBar', () => {
  it('tells that an AI is thinking during its turn', () => {
    expect(hintOf(game({ kind: 'ai', level: 'hard' }))).toBe('Alice réfléchit…')
  })

  it('guides a human during its turn', () => {
    expect(hintOf(game({ kind: 'human' }))).toBe("Choisissez un territoire d'où attaquer.")
  })
})
