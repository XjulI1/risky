import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createGame, type GameState } from '../../engine'
import PlayersPanel from './PlayersPanel.vue'

function game(): GameState {
  const created = createGame({
    seed: 5,
    settings: { capitals: true },
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'ai', level: 'normal' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'ai', level: 'normal' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  return created.state
}

const rowOf = (state: GameState, name: string) =>
  mount(PlayersPanel, { props: { state } })
    .findAll('tbody tr')
    .find((row) => row.text().includes(name))

describe('PlayersPanel', () => {
  it('counts the capitals each player holds once they are revealed', () => {
    const state = game()
    state.capitals = { p1: 'egypt', p2: 'brazil', p3: 'peru' }
    state.territories.egypt = { owner: 'p1', armies: 3 }
    state.territories.brazil = { owner: 'p1', armies: 2 }
    state.territories.peru = { owner: 'p3', armies: 2 }
    expect(rowOf(state, 'Alice')?.text()).toContain('Capitales : 2/3')
    expect(rowOf(state, 'Bob')?.text()).toContain('Capitales : 0/3')
  })

  it('shows no capital count before the reveal', () => {
    expect(mount(PlayersPanel, { props: { state: game() } }).text()).not.toContain('Capitales')
  })
})
