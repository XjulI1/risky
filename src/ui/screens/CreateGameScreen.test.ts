import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, type GameState } from '../../engine'
import { AI_NAMES } from '../../game/gameForm'
import CreateGameScreen from './CreateGameScreen.vue'

function mountForm() {
  return mount(CreateGameScreen)
}

const nameInputs = (wrapper: ReturnType<typeof mountForm>) => wrapper.findAll('[data-testid="player-name"]')
const startButton = (wrapper: ReturnType<typeof mountForm>) => wrapper.get('[data-testid="start-game"]')
const kindSelects = (wrapper: ReturnType<typeof mountForm>) => wrapper.findAll('[data-testid="player-kind"]')
const chooseAiLevel = (wrapper: ReturnType<typeof mountForm>, level: string) => wrapper.get(`[data-testid="ai-level-${level}"]`).trigger('click')
const pressedAiLevels = (wrapper: ReturnType<typeof mountForm>) =>
  wrapper.findAll('[data-testid^="ai-level-"]').filter((button) => button.attributes('aria-pressed') === 'true').map((button) => button.text())
const names = (wrapper: ReturnType<typeof mountForm>) =>
  nameInputs(wrapper).map((input) => (input.element as HTMLInputElement).value)
const rowColor = (wrapper: ReturnType<typeof mountForm>, row: number) =>
  wrapper.findAll('[data-testid="player-row"]')[row]?.attributes('data-color')

describe('CreateGameScreen', () => {
  it('proposes 3 players with distinct colors, the AIs named after distinct war leaders', () => {
    const wrapper = mountForm()
    const [human, ...ais] = names(wrapper)
    expect(human).toBe('Joueur 1')
    expect(ais.every((name) => AI_NAMES.includes(name))).toBe(true)
    expect(new Set(ais).size).toBe(2)
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

  it('removes a player with a cross button named after the player', async () => {
    const wrapper = mountForm()
    const [first, second, third] = names(wrapper)
    const removeButton = wrapper.findAll('[data-testid="remove-player"]')[1]
    expect(removeButton?.text()).toBe('✕')
    expect(removeButton?.attributes('aria-label')).toBe(`Retirer ${second}`)
    await removeButton?.trigger('click')
    expect(names(wrapper)).toEqual([first, third])
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
    expect(state.players.map((player) => player.name)).toEqual(names(wrapper))
  })

  it('makes player 1 human and the other players normal AIs by default', () => {
    const wrapper = mountForm()
    expect(kindSelects(wrapper).map((select) => (select.element as HTMLSelectElement).value)).toEqual(['human', 'ai', 'ai'])
    expect(pressedAiLevels(wrapper)).toEqual(['Normal'])
  })

  it('offers a single level for all the AIs of the game', async () => {
    const wrapper = mountForm()
    await wrapper.get('[data-testid="add-player"]').trigger('click')
    expect(wrapper.findAll('[data-testid="ai-level"]')).toHaveLength(1)
    await chooseAiLevel(wrapper, 'hard')
    expect(pressedAiLevels(wrapper)).toEqual(['Difficile'])
    await kindSelects(wrapper)[0]?.setValue('ai')
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.players.map((player) => (player.kind === 'ai' ? player.level : null))).toEqual(['hard', 'hard', 'hard', 'hard'])
  })

  it('offers four levels, from easy to expert', () => {
    const wrapper = mountForm()
    expect(wrapper.findAll('[data-testid^="ai-level-"]').map((button) => button.text())).toEqual(['Facile', 'Normal', 'Difficile', 'Expert'])
  })

  it('starts a game of expert AIs', async () => {
    const wrapper = mountForm()
    await chooseAiLevel(wrapper, 'expert')
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.players.map((player) => (player.kind === 'ai' ? player.level : null))).toEqual([null, 'expert', 'expert'])
  })

  describe('expert level', () => {
    const expertButton = (wrapper: ReturnType<typeof mountForm>) => wrapper.get('[data-testid="ai-level-expert"]')

    it('falls back to the hard level when a variant is checked, and is greyed out with the reason', async () => {
      const wrapper = mountForm()
      expect(wrapper.text()).not.toContain('Mode classique uniquement')
      await chooseAiLevel(wrapper, 'expert')
      await wrapper.get('[data-testid="setting-secretMissions"]').setValue(true)
      expect(pressedAiLevels(wrapper)).toEqual(['Difficile'])
      expect(expertButton(wrapper).attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toContain('Mode classique uniquement')
      await startButton(wrapper).trigger('click')
      const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
      expect(state.players.map((player) => (player.kind === 'ai' ? player.level : null))).toEqual([null, 'hard', 'hard'])
    })

    it('becomes available again when the variant is unchecked, the chosen level staying the same', async () => {
      const wrapper = mountForm()
      await chooseAiLevel(wrapper, 'easy')
      await wrapper.get('[data-testid="setting-capitals"]').setValue(true)
      expect(expertButton(wrapper).attributes('disabled')).toBeDefined()
      await wrapper.get('[data-testid="setting-capitals"]').setValue(false)
      expect(expertButton(wrapper).attributes('disabled')).toBeUndefined()
      expect(wrapper.text()).not.toContain('Mode classique uniquement')
      expect(pressedAiLevels(wrapper)).toEqual(['Facile'])
    })
  })

  it('gives the common level to a player turned into an AI and to an added player', async () => {
    const wrapper = mountForm()
    await chooseAiLevel(wrapper, 'easy')
    await kindSelects(wrapper)[0]?.setValue('ai')
    await wrapper.get('[data-testid="add-player"]').trigger('click')
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.players.map((player) => (player.kind === 'ai' ? player.level : null))).toEqual(['easy', 'easy', 'easy', 'easy'])
  })

  it('hides the AI level when every player is human', async () => {
    const wrapper = mountForm()
    await kindSelects(wrapper)[1]?.setValue('human')
    await kindSelects(wrapper)[2]?.setValue('human')
    expect(wrapper.find('[data-testid="ai-level"]').exists()).toBe(false)
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.players.map((player) => player.kind)).toEqual(['human', 'human', 'human'])
  })

  it('starts a game without any human', async () => {
    const wrapper = mountForm()
    await kindSelects(wrapper)[0]?.setValue('ai')
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.players.map((player) => player.kind)).toEqual(['ai', 'ai', 'ai'])
  })

  it('passes the chosen settings to the engine', async () => {
    const wrapper = mountForm()
    await wrapper.get('[data-testid="setting-fortifyMode"]').setValue('adjacent')
    await wrapper.get('[data-testid="setting-defenderMaxDice"]').setValue('3')
    await startButton(wrapper).trigger('click')
    const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
    expect(state.settings).toEqual({ ...DEFAULT_SETTINGS, fortifyMode: 'adjacent', defenderMaxDice: 3 })
  })

  describe('secret missions option', () => {
    const missionsBox = (wrapper: ReturnType<typeof mountForm>) => wrapper.get('[data-testid="setting-secretMissions"]')
    const isChecked = (wrapper: ReturnType<typeof mountForm>) => (missionsBox(wrapper).element as HTMLInputElement).checked
    const removeLastPlayer = (wrapper: ReturnType<typeof mountForm>) => wrapper.findAll('[data-testid="remove-player"]').at(-1)?.trigger('click')

    it('is unchecked by default', () => {
      const wrapper = mountForm()
      expect(isChecked(wrapper)).toBe(false)
      expect(missionsBox(wrapper).attributes('disabled')).toBeUndefined()
      expect(wrapper.text()).not.toContain('3 joueurs minimum')
    })

    it('is disabled with 2 players, with the reason', async () => {
      const wrapper = mountForm()
      await removeLastPlayer(wrapper)
      expect(missionsBox(wrapper).attributes('disabled')).toBeDefined()
      expect(wrapper.text()).toContain('3 joueurs minimum')
    })

    it('is unchecked when going down to 2 players', async () => {
      const wrapper = mountForm()
      await missionsBox(wrapper).setValue(true)
      expect(isChecked(wrapper)).toBe(true)
      await removeLastPlayer(wrapper)
      expect(isChecked(wrapper)).toBe(false)
      expect(missionsBox(wrapper).attributes('disabled')).toBeDefined()
    })

    it('starts a game with secret missions when checked', async () => {
      const wrapper = mountForm()
      await missionsBox(wrapper).setValue(true)
      await startButton(wrapper).trigger('click')
      const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
      expect(state.settings.secretMissions).toBe(true)
      expect(Object.keys(state.missions ?? {})).toHaveLength(3)
    })
  })

  describe('capitals mode option', () => {
    const box = (wrapper: ReturnType<typeof mountForm>, setting: 'capitals' | 'secretMissions') =>
      wrapper.get(`[data-testid="setting-${setting}"]`)
    const isChecked = (wrapper: ReturnType<typeof mountForm>, setting: 'capitals' | 'secretMissions') =>
      (box(wrapper, setting).element as HTMLInputElement).checked

    it('is unchecked by default', () => {
      const wrapper = mountForm()
      expect(isChecked(wrapper, 'capitals')).toBe(false)
      expect(wrapper.text()).toContain('Mode capitales')
    })

    it('stays available with 2 players', async () => {
      const wrapper = mountForm()
      await wrapper.findAll('[data-testid="remove-player"]').at(-1)?.trigger('click')
      expect(box(wrapper, 'capitals').attributes('disabled')).toBeUndefined()
      await box(wrapper, 'capitals').setValue(true)
      await startButton(wrapper).trigger('click')
      const [state] = (wrapper.emitted('start')?.[0] ?? []) as [GameState]
      expect(state.settings.capitals).toBe(true)
      expect(state.phase.kind).toBe('capitalChoice')
    })

    it('unchecks the secret missions when checked', async () => {
      const wrapper = mountForm()
      await box(wrapper, 'secretMissions').setValue(true)
      await box(wrapper, 'capitals').setValue(true)
      expect(isChecked(wrapper, 'secretMissions')).toBe(false)
      expect(isChecked(wrapper, 'capitals')).toBe(true)
    })

    it('is unchecked when the secret missions are checked', async () => {
      const wrapper = mountForm()
      await box(wrapper, 'capitals').setValue(true)
      await box(wrapper, 'secretMissions').setValue(true)
      expect(isChecked(wrapper, 'capitals')).toBe(false)
      expect(isChecked(wrapper, 'secretMissions')).toBe(true)
    })
  })
})
