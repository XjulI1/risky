import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameEvent } from '../../engine'
import DiceTray from './DiceTray.vue'

type DiceRolled = Extract<GameEvent, { type: 'diceRolled' }>

function rollEvent(defenderBonus: number): DiceRolled {
  return {
    type: 'diceRolled',
    attacker: 'p1',
    defender: 'p2',
    from: 'middle_east',
    to: 'egypt',
    attackerDice: [6, 2],
    defenderDice: [5, 1],
    defenderBonus,
    attackerLosses: defenderBonus === 0 ? 0 : 1,
    defenderLosses: defenderBonus === 0 ? 2 : 1,
  }
}

async function settledTray(defenderBonus: number) {
  const wrapper = mount(DiceTray, {
    props: { event: rollEvent(defenderBonus), attackerColor: '#d64541', defenderColor: '#3a7bd5', durationMs: 100 },
  })
  await vi.runAllTimersAsync()
  return wrapper
}

const lostSides = (wrapper: Awaited<ReturnType<typeof settledTray>>, side: 'attacker' | 'defender') =>
  wrapper.findAll(`[data-testid="die-${side}"]`).map((die) => die.element.parentElement?.classList.contains('lost'))

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DiceTray', () => {
  it('marks the bonified die of the defender of a capital with +1, showing the rolled value', async () => {
    const wrapper = await settledTray(1)
    const bonuses = wrapper.findAll('[data-testid="die-bonus"]')
    expect(bonuses).toHaveLength(1)
    expect(bonuses[0]?.text()).toBe('+1')
    expect(wrapper.findAll('[data-testid="die-defender"]').map((die) => die.attributes('data-value'))).toEqual(['5', '1'])
  })

  it('compares the pairs with the bonified value', async () => {
    const wrapper = await settledTray(1)
    expect(lostSides(wrapper, 'attacker')).toEqual([true, false])
    expect(lostSides(wrapper, 'defender')).toEqual([false, true])
  })

  it('shows no bonus on an ordinary territory', async () => {
    const wrapper = await settledTray(0)
    expect(wrapper.find('[data-testid="die-bonus"]').exists()).toBe(false)
    expect(lostSides(wrapper, 'attacker')).toEqual([false, false])
  })
})
