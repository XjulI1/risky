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

function mountBar(state: GameState, thinking = false) {
  return mount(StatusBar, { props: { state, view: viewOf(state, IDLE), thinking } })
}

function hintOf(state: GameState): string {
  return mountBar(state).get('[data-testid="status-hint"]').text()
}

describe('StatusBar', () => {
  it('tells that an AI is thinking during its turn', () => {
    expect(hintOf(game({ kind: 'ai', level: 'hard' }))).toBe('Alice réfléchit…')
  })

  it('shows animated dots after the thinking AI while a decision takes long', () => {
    const wrapper = mountBar(game({ kind: 'ai', level: 'expert' }), true)
    expect(wrapper.get('[data-testid="status-hint"]').text()).toContain('Alice réfléchit…')
    expect(wrapper.findAll('[data-testid="status-thinking"] > span')).toHaveLength(3)
  })

  it('shows no dots while no decision takes long', () => {
    expect(mountBar(game({ kind: 'ai', level: 'expert' })).find('[data-testid="status-thinking"]').exists()).toBe(false)
  })

  it('guides a human during its turn', () => {
    expect(hintOf(game({ kind: 'human' }))).toBe("Choisissez un territoire d'où attaquer.")
  })

  it('shows the name and the phase on two lines, so that a long phase never wraps the name', () => {
    const state = game({ kind: 'human' })
    state.phase = { kind: 'conquestMove', from: 'peru', to: 'brazil', minArmies: 1, maxArmies: 3 }
    const wrapper = mountBar(state)
    expect(wrapper.get('[data-testid="status-title"]').text()).toBe('Alice')
    expect(wrapper.get('[data-testid="status-phase"]').text()).toBe('Déplacement après conquête')
  })

  it('guides a human through the capital choice', () => {
    const state = game({ kind: 'human' })
    state.phase = { kind: 'capitalChoice', pending: {} }
    const wrapper = mountBar(state)
    expect(wrapper.get('[data-testid="status-title"]').text()).toBe('Alice')
    expect(wrapper.get('[data-testid="status-phase"]').text()).toBe('Choix de la capitale')
    expect(wrapper.get('[data-testid="status-hint"]').text()).toBe('Touchez un de vos territoires pour en faire votre capitale, en secret.')
  })

  it('shows the armies left to place on the line of the phase', () => {
    const attacking = mountBar(game({ kind: 'human' }))
    expect(attacking.find('[data-testid="status-reserve"]').exists()).toBe(false)
    const reinforcing = game({ kind: 'human' })
    reinforcing.phase = { kind: 'reinforce', reserve: 5 }
    const wrapper = mountBar(reinforcing)
    expect(wrapper.get('[data-testid="status-phase"]').text()).toBe('Renforts')
    expect(wrapper.get('[data-testid="status-reserve"]').text()).toBe('5 à placer')
    expect(wrapper.get('[data-testid="status-reserve"]').element.parentElement).toBe(
      wrapper.get('[data-testid="status-phase"]').element.parentElement,
    )
  })
})
