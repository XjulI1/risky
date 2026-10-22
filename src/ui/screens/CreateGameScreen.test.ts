import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type GameState } from '../../engine'
import CreateGameScreen from './CreateGameScreen.vue'

function mountForm() {
  return mount(CreateGameScreen)
}

const nameInputs = (wrapper: ReturnType<typeof mountForm>) => wrapper.findAll('[data-testid="player-name"]')
const startButton = (wrapper: ReturnType<typeof mountForm>) => wrapper.get('[data-testid="start-game"]')
const rowColor = (wrapper: ReturnType<typeof mountForm>, row: number) =>
  wrapper.findAll('[data-testid="player-row"]')[row]?.attributes('data-color')

describe('CreateGameScreen', () => {
  it('proposes 3 players with default names and distinct colors', () => {
    const wrapper = mountForm()
    expect(nameInputs(wrapper).map((input) => (input.element as HTMLInputElement).value)).toEqual([
      'Joueur 1',
      'Joueur 2',
      'Joueur 3',
    ])
    expect(new Set([0, 1, 2].map((row) => rowColor(wrapper, row))).size).toBe(3)
  })

  it('disables adding a player at 6 players', async () => {
    const wrapper = mountForm()
    for (let i = 0; i < 3; i++) {
      await wrapper.get('[data-testid="add-player"]').trigger('click')
    }
    expect(nameInputs(wrapper)).toHaveLength(6)
    expect(wrapper.get('[data-testid="add-player"]').attributes('disabled')).toBeDefined()
  })

  it('disables removing a player at 2 players', async () => {
    const wrapper = mountForm()
    await wrapper.findAll('[data-testid="remove-player"]')[2]?.trigger('click')
    expect(nameInputs(wrapper)).toHaveLength(2)
    expect(wrapper.findAll('[data-testid="remove-player"]').every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  })

  it('swaps colors when picking a color already used by another player', async () => {
    const wrapper = mountForm()
    const [first, second] = [rowColor(wrapper, 0), rowColor(wrapper, 1)]
    await wrapper.findAll('[data-testid="player-row"]')[0]?.get(`[data-testid="color-${second}"]`).trigger('click')
    expect(rowColor(wrapper, 0)).toBe(second)
    expect(rowColor(wrapper, 1)).toBe(first)
  })

  it('requires a name', async () => {
    const wrapper = mountForm()
    await nameInputs(wrapper)[1]?.setValue('   ')
    expect(wrapper.text()).toContain('Nom obligatoire')
    expect(startButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('rejects duplicate names', async () => {
    const wrapper = mountForm()
    await nameInputs(wrapper)[0]?.setValue('Alice')
    await nameInputs(wrapper)[1]?.setValue('Alice')
    expect(wrapper.text()).toContain('Nom déjà utilisé')
    expect(startButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('limits names to 20 characters', async () => {
    const wrapper = mountForm()
    await nameInputs(wrapper)[0]?.setValue('x'.repeat(21))
    expect(wrapper.text()).toContain('20 caractères maximum')
    expect(startButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('mentions the neutral army with 2 players only', async () => {
    const wrapper = mountForm()
    expect(wrapper.text()).not.toContain('armée neutre')
    await wrapper.findAll('[data-testid="remove-player"]')[2]?.trigger('click')
    expect(wrapper.text()).toContain('armée neutre')
  })

  it('starts a game with the default settings of the engine', async () => {
    const wrapper = mountForm()
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.settings).toEqual(DEFAULT_SETTINGS)
    expect(state.players.map((player) => player.name)).toEqual(['Joueur 1', 'Joueur 2', 'Joueur 3'])
  })

  it('passes the chosen settings to the engine', async () => {
    const wrapper = mountForm()
    await wrapper.get('[data-testid="setting-fortifyMode"]').setValue('adjacent')
    await wrapper.get('[data-testid="setting-defenderMaxDice"]').setValue('3')
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.settings).toEqual({ ...DEFAULT_SETTINGS, fortifyMode: 'adjacent', defenderMaxDice: 3 })
  })
})
