import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import type { Player } from '../../engine'
import type { JournalEntry } from '../../game/history/journal'
import JournalPanel from './JournalPanel.vue'

const players: Player[] = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human', isNeutral: false, eliminated: false },
  { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'ai', level: 'normal', isNeutral: false, eliminated: false },
]

const header = (turn: number, playerId = 'p1'): JournalEntry => ({
  turn,
  playerId,
  text: `Tour ${turn} — ${playerId === 'p1' ? 'Alice' : 'Bob'}`,
  header: true,
  details: [],
})
const action = (turn: number, text: string, playerId = 'p1', details: string[] = []): JournalEntry => ({
  turn,
  playerId,
  text,
  header: false,
  details,
})

function mountPanel(entries: JournalEntry[]) {
  return mount(JournalPanel, { props: { entries, players }, attachTo: document.body })
}

function fakeScroll(element: Element, { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number }) {
  Object.defineProperty(element, 'scrollHeight', { configurable: true, get: () => scrollHeight })
  Object.defineProperty(element, 'clientHeight', { configurable: true, get: () => clientHeight })
}

describe('JournalPanel', () => {
  it('groups the entries by turn, each one in the color of its author', () => {
    const wrapper = mountPanel([header(1), action(1, 'Alice place 3 armées en Pérou'), header(2, 'p2'), action(2, 'Bob pioche une carte', 'p2')])
    expect(wrapper.findAll('[data-testid="journal-header"]').map((title) => title.text())).toEqual(['Tour 1 — Alice', 'Tour 2 — Bob'])
    const entries = wrapper.findAll('[data-testid="journal-entry"]')
    expect(entries.map((entry) => entry.text())).toEqual(['Alice place 3 armées en Pérou', 'Bob pioche une carte'])
    expect(entries[1]?.attributes('style')).toContain('#3a7bd5')
  })

  it('unfolds an attack into its rolls', async () => {
    const attack = action(1, 'Alice attaque Brésil depuis Afrique du Nord : 2 lancers — Bob perd 3 armées', 'p1', [
      '6-5-1 contre 4-4 — Bob perd 2 armées',
      '6-2 contre 3 — Bob perd 1 armée',
    ])
    const wrapper = mountPanel([header(1), attack])
    expect(wrapper.findAll('[data-testid="journal-roll"]')).toHaveLength(0)
    await wrapper.get('[data-testid="journal-entry"] button').trigger('click')
    expect(wrapper.findAll('[data-testid="journal-roll"]').map((roll) => roll.text())).toEqual(attack.details)
  })

  it('can be folded', async () => {
    const wrapper = mountPanel([header(1)])
    await wrapper.get('button[aria-expanded]').trigger('click')
    expect(wrapper.find('[data-testid="journal-list"]').exists()).toBe(false)
  })

  it('follows the new entries while the end of the journal is shown', async () => {
    const wrapper = mountPanel([header(1)])
    const list = wrapper.get('[data-testid="journal-list"]').element as HTMLElement
    fakeScroll(list, { scrollHeight: 1000, clientHeight: 200 })
    list.scrollTop = 800
    await wrapper.get('[data-testid="journal-list"]').trigger('scroll')
    await wrapper.setProps({ entries: [header(1), action(1, 'Alice place 3 armées en Pérou')] })
    await nextTick()
    expect(list.scrollTop).toBe(1000)
    expect(wrapper.text()).not.toContain('Nouvelles actions')
  })

  it('keeps the reading position and tells about new entries while the history is read', async () => {
    const wrapper = mountPanel([header(1)])
    const list = wrapper.get('[data-testid="journal-list"]').element as HTMLElement
    fakeScroll(list, { scrollHeight: 1000, clientHeight: 200 })
    list.scrollTop = 300
    await wrapper.get('[data-testid="journal-list"]').trigger('scroll')
    await wrapper.setProps({ entries: [header(1), action(1, 'Alice place 3 armées en Pérou')] })
    await nextTick()
    expect(list.scrollTop).toBe(300)
    const indicator = wrapper.findAll('button').find((button) => button.text() === 'Nouvelles actions')
    expect(indicator).toBeDefined()
    await indicator?.trigger('click')
    expect(list.scrollTop).toBe(1000)
    expect(wrapper.text()).not.toContain('Nouvelles actions')
  })

  it('shows the last 200 entries and loads the earlier ones when scrolled to the top', async () => {
    const entries = [header(1), ...Array.from({ length: 249 }, (_, i) => action(1, `Action ${i}`))]
    const wrapper = mountPanel(entries)
    expect(wrapper.findAll('[data-testid="journal-entry"]')).toHaveLength(200)
    const list = wrapper.get('[data-testid="journal-list"]').element as HTMLElement
    fakeScroll(list, { scrollHeight: 4000, clientHeight: 200 })
    list.scrollTop = 0
    await wrapper.get('[data-testid="journal-list"]').trigger('scroll')
    await nextTick()
    expect(wrapper.findAll('[data-testid="journal-entry"]')).toHaveLength(249)
    expect(wrapper.findAll('[data-testid="journal-header"]').map((title) => title.text())).toEqual(['Tour 1 — Alice'])
  })
})
