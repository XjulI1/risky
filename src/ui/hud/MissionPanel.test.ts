import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import {
  classicMap,
  CONQUER_24_TERRITORIES,
  createGame,
  generalMissions,
  type GameState,
  type Mission,
  type PlayerControl,
} from '../../engine'
import MissionPanel from './MissionPanel.vue'

const GENERAL_MISSIONS = generalMissions(classicMap)

const HUMAN: PlayerControl = { kind: 'human' }
const AI: PlayerControl = { kind: 'ai', level: 'normal' }

function game(controls: [PlayerControl, PlayerControl, PlayerControl] = [HUMAN, HUMAN, HUMAN], current = 0): GameState {
  const created = createGame({
    seed: 2,
    settings: { secretMissions: true },
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', ...controls[0] },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', ...controls[1] },
      { id: 'p3', name: 'Carol', color: '#3fa34d', ...controls[2] },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  for (const id of classicMap.territoryIds) {
    state.territories[id] = { owner: 'p2', armies: 1 }
  }
  state.missions = { p1: CONQUER_24_TERRITORIES, p2: GENERAL_MISSIONS[0] as Mission, p3: { kind: 'eliminate', target: 'p1' } }
  state.currentPlayerIndex = current
  state.phase = { kind: 'attack' }
  return state
}

function giveTo(state: GameState, owner: string, territories: string[], armies = 1): GameState {
  for (const id of territories) {
    state.territories[id] = { owner, armies }
  }
  return state
}

async function openedPanel(state: GameState) {
  const wrapper = mount(MissionPanel, { props: { state } })
  await wrapper.get('[data-testid="mission-button"]').trigger('click')
  return wrapper.get('[data-testid="mission-details"]')
}

const continent = (id: string) => classicMap.continents[id]?.territories ?? []

describe('MissionPanel', () => {
  it('stays closed until the button « Ma mission » is pressed', () => {
    const wrapper = mount(MissionPanel, { props: { state: game() } })
    expect(wrapper.get('[data-testid="mission-button"]').text()).toBe('Ma mission')
    expect(wrapper.find('[data-testid="mission-details"]').exists()).toBe(false)
  })

  it('shows the territories held in each continent of a continent mission', async () => {
    const state = game()
    state.missions = { ...state.missions, p1: GENERAL_MISSIONS[0] as Mission }
    giveTo(state, 'p1', [...continent('northAmerica').slice(0, 7), ...continent('africa').slice(0, 4)])
    const details = await openedPanel(state)
    expect(details.text()).toContain("Conquérir l'Amérique du Nord et l'Afrique")
    expect(details.text()).toContain('Amérique du Nord 7/9')
    expect(details.text()).toContain('Afrique 4/6')
  })

  it('shows the continent of choice of a mission that asks for one', async () => {
    const state = game()
    state.missions = { ...state.missions, p1: GENERAL_MISSIONS[4] as Mission }
    const details = await openedPanel(state)
    expect(details.text()).toContain('Continent au choix 0/1')
  })

  it('counts the territories for the mission « 24 territoires »', async () => {
    const state = giveTo(game(), 'p1', classicMap.territoryIds.slice(0, 20))
    const details = await openedPanel(state)
    expect(details.text()).toContain('Conquérir 24 territoires')
    expect(details.text()).toContain('Territoires 20/24')
  })

  it('counts the territories and those holding 2 armies for the mission « 18 territoires »', async () => {
    const state = giveTo(game(), 'p1', classicMap.territoryIds.slice(0, 20))
    giveTo(state, 'p1', classicMap.territoryIds.slice(0, 12), 2)
    state.missions = { ...state.missions, p1: GENERAL_MISSIONS[7] as Mission }
    const details = await openedPanel(state)
    expect(details.text()).toContain('Territoires 20')
    expect(details.text()).toContain('À 2 armées ou plus 12/18')
  })

  it('counts the territories left to the target of an elimination mission', async () => {
    const state = giveTo(game(), 'p3', ['brazil', 'peru', 'japan'])
    state.missions = { ...state.missions, p1: { kind: 'eliminate', target: 'p3' } }
    const details = await openedPanel(state)
    expect(details.text()).toContain('Éliminer Carol')
    expect(details.text()).toContain('Territoires de Carol 3')
  })

  it('shows the mission of the current human player only', async () => {
    const details = await openedPanel(game([HUMAN, HUMAN, HUMAN], 1))
    expect(details.text()).toContain("Conquérir l'Amérique du Nord et l'Afrique")
  })

  it('is hidden during the turn of an AI when several humans play', () => {
    const wrapper = mount(MissionPanel, { props: { state: game([HUMAN, HUMAN, AI], 2) } })
    expect(wrapper.find('[data-testid="mission-button"]').exists()).toBe(false)
  })

  it('shows the mission of the only human during the turn of an AI', async () => {
    const details = await openedPanel(game([HUMAN, AI, AI], 2))
    expect(details.text()).toContain('Conquérir 24 territoires')
  })

  it('is hidden in a game without missions', () => {
    const state = game()
    state.missions = null
    const wrapper = mount(MissionPanel, { props: { state } })
    expect(wrapper.find('[data-testid="mission-button"]').exists()).toBe(false)
  })

  it('closes when the mission shown changes hands', async () => {
    const state = game()
    const wrapper = mount(MissionPanel, { props: { state } })
    await wrapper.get('[data-testid="mission-button"]').trigger('click')
    await wrapper.setProps({ state: { ...state, currentPlayerIndex: 1 } })
    expect(wrapper.find('[data-testid="mission-details"]').exists()).toBe(false)
  })
})
