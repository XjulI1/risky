import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createGame, DEFAULT_SETTINGS, type PlayerConfig } from '../../engine'
import { initialStatistics } from '../../game/history/statistics'
import type { SavedGame, SaveStatus } from '../../game/persistence'
import HomeScreen from './HomeScreen.vue'

const players: PlayerConfig[] = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
  { id: 'p2', name: 'Napoléon', color: '#3a7bd5', kind: 'ai', level: 'normal' },
  { id: 'p3', name: 'Foch', color: '#3fa34d', kind: 'ai', level: 'normal' },
]

function saved(status: SaveStatus): SavedGame {
  const created = createGame({ players, seed: 4 })
  if (!created.ok) throw new Error(created.error.message)
  return {
    formatVersion: 1,
    savedAt: '2026-10-23T08:30:00.000Z',
    status,
    creation: { players, settings: { ...DEFAULT_SETTINGS } },
    engineState: created.state,
    journal: [],
    statistics: initialStatistics(created.state, 1),
    turnNumber: 12,
  }
}

function mountHome(props: { saved?: SavedGame | null; loadError?: boolean; updateReady?: boolean } = {}) {
  return mount(HomeScreen, { props: { saved: null, loadError: false, updateReady: false, ...props } })
}

const button = (wrapper: ReturnType<typeof mountHome>, label: string) =>
  wrapper.findAll('button').find((candidate) => candidate.text() === label)

describe('HomeScreen', () => {
  it('offers to resume a game in progress, with its players, turn and save date', async () => {
    const wrapper = mountHome({ saved: saved('inProgress') })
    const summary = wrapper.get('[data-testid="saved-summary"]').text()
    expect(summary).toContain('Alice, Napoléon, Foch')
    expect(summary).toContain('tour 12')
    expect(summary).toMatch(/23\/10\/2026/)
    await button(wrapper, 'Reprendre la partie')?.trigger('click')
    expect(wrapper.emitted('resume')).toHaveLength(1)
  })

  it('offers to see a finished game again', async () => {
    const wrapper = mountHome({ saved: saved('finished') })
    expect(button(wrapper, 'Reprendre la partie')).toBeUndefined()
    await button(wrapper, 'Voir la dernière partie')?.trigger('click')
    expect(wrapper.emitted('resume')).toHaveLength(1)
  })

  it('offers neither without a save', () => {
    const wrapper = mountHome()
    expect(button(wrapper, 'Reprendre la partie')).toBeUndefined()
    expect(button(wrapper, 'Voir la dernière partie')).toBeUndefined()
    expect(wrapper.find('[data-testid="saved-summary"]').exists()).toBe(false)
  })

  it('tells that the previous save could not be loaded', () => {
    expect(mountHome({ loadError: true }).text()).toContain("La sauvegarde précédente n'a pas pu être chargée")
    expect(mountHome().text()).not.toContain('La sauvegarde précédente')
  })

  it('asks before replacing a game in progress, and keeps it when cancelled', async () => {
    const wrapper = mountHome({ saved: saved('inProgress') })
    await button(wrapper, 'Nouvelle partie')?.trigger('click')
    expect(wrapper.emitted('create')).toBeUndefined()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await button(wrapper, 'Annuler')?.trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.emitted('create')).toBeUndefined()
    await button(wrapper, 'Nouvelle partie')?.trigger('click')
    await button(wrapper, 'Remplacer')?.trigger('click')
    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('creates a game at once without a game in progress', async () => {
    for (const wrapper of [mountHome(), mountHome({ saved: saved('finished') })]) {
      await button(wrapper, 'Nouvelle partie')?.trigger('click')
      expect(wrapper.emitted('create')).toHaveLength(1)
    }
  })

  it('offers to reload when a new version is ready', async () => {
    const wrapper = mountHome({ updateReady: true })
    expect(wrapper.get('[data-testid="update-banner"]').text()).toContain('Nouvelle version disponible')
    await button(wrapper, 'Recharger')?.trigger('click')
    expect(wrapper.emitted('reload')).toHaveLength(1)
  })

  it('shows no update banner without a new version', () => {
    const wrapper = mountHome()
    expect(wrapper.find('[data-testid="update-banner"]').exists()).toBe(false)
    expect(button(wrapper, 'Recharger')).toBeUndefined()
  })
})
