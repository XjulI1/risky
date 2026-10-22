import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { classicMap, createGame, type Card, type GameState } from '../../engine'
import CardHand from './CardHand.vue'

const infantry = (id: number, territory = 'japan'): Card => ({ id, symbol: 'infantry', territory })
const cavalry = (id: number, territory = 'japan'): Card => ({ id, symbol: 'cavalry', territory })
const artillery = (id: number, territory = 'japan'): Card => ({ id, symbol: 'artillery', territory })
const joker = (id: number): Card => ({ id, symbol: 'joker', territory: null })

function game(hand: Card[]): GameState {
  const created = createGame({
    seed: 2,
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  for (const id of classicMap.territoryIds) {
    state.territories[id] = { owner: 'p2', armies: 1 }
  }
  state.territories.peru = { owner: 'p1', armies: 3 }
  state.hands.p1 = hand
  state.currentPlayerIndex = 0
  state.phase = { kind: 'reinforce', reserve: 3 }
  return state
}

function mountHand(hand: Card[], props: { canTrade?: boolean; forced?: boolean } = {}) {
  return mount(CardHand, { props: { state: game(hand), playerId: 'p1', canTrade: true, forced: false, ...props } })
}

const cardButtons = (wrapper: ReturnType<typeof mountHand>) => wrapper.findAll('[data-testid="card"]')
const tradeButton = (wrapper: ReturnType<typeof mountHand>) => wrapper.get('[data-testid="trade"]')

describe('CardHand', () => {
  it('shows the symbol and territory of each card, and Joker for jokers', () => {
    const wrapper = mountHand([infantry(1, 'egypt'), joker(2)])
    expect(cardButtons(wrapper)[0]?.text()).toContain('Fantassin')
    expect(cardButtons(wrapper)[0]?.text()).toContain('Égypte')
    expect(cardButtons(wrapper)[1]?.text()).toContain('Joker')
  })

  it('marks the cards of owned territories', () => {
    const wrapper = mountHand([infantry(1, 'peru'), cavalry(2)])
    expect(cardButtons(wrapper)[0]?.find('[data-testid="bonus"]').exists()).toBe(true)
    expect(cardButtons(wrapper)[1]?.find('[data-testid="bonus"]').exists()).toBe(false)
  })

  it('preselects the most valuable set', () => {
    const wrapper = mountHand([infantry(1), cavalry(2), artillery(3), infantry(4)])
    const selected = cardButtons(wrapper).map((card) => card.attributes('aria-pressed'))
    expect(selected).toEqual(['true', 'true', 'true', 'false'])
    expect(tradeButton(wrapper).text()).toBe('Échanger (+4)')
    expect(tradeButton(wrapper).attributes('disabled')).toBeUndefined()
  })

  it('disables the trade for an invalid selection', async () => {
    const wrapper = mountHand([infantry(1), infantry(2), cavalry(3), artillery(4)])
    await cardButtons(wrapper)[3]?.trigger('click')
    await cardButtons(wrapper)[1]?.trigger('click')
    expect(cardButtons(wrapper).map((card) => card.attributes('aria-pressed'))).toEqual(['true', 'true', 'true', 'false'])
    expect(tradeButton(wrapper).text()).toBe('Échanger')
    expect(tradeButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('emits the selected set', async () => {
    const wrapper = mountHand([infantry(1), cavalry(2), artillery(3)])
    await tradeButton(wrapper).trigger('click')
    expect(wrapper.emitted('trade')?.[0]).toEqual([[1, 2, 3]])
  })

  it('disables the trade outside the reinforcement phase', () => {
    const wrapper = mountHand([infantry(1), cavalry(2), artillery(3)], { canTrade: false })
    expect(tradeButton(wrapper).attributes('disabled')).toBeDefined()
  })

  it('explains a forced trade', () => {
    const wrapper = mountHand([infantry(1), cavalry(2), artillery(3), infantry(4), infantry(5)], { forced: true })
    expect(wrapper.text()).toContain('Vous devez échanger une série')
  })
})
