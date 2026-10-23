import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { Player } from '../../engine'
import type { GameStatistics, PlayerCounters } from '../../game/history/statistics'
import StatisticsTab from './StatisticsTab.vue'

const players: Player[] = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human', isNeutral: false, eliminated: true },
  { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'ai', level: 'normal', isNeutral: false, eliminated: true },
  { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'ai', level: 'hard', isNeutral: false, eliminated: false },
]

const counters = (eliminatedAtTurn: number | null): PlayerCounters => ({
  conquests: 4,
  armiesLost: 10,
  armiesDestroyed: 12,
  attacks: 6,
  bestDieRolls: 9,
  trades: 1,
  armiesFromTrades: 6,
  eliminatedAtTurn,
})

const statistics: GameStatistics = {
  snapshots: Array.from({ length: 40 }, (_, i) => ({
    turn: i + 1,
    players: {
      p1: { territories: 14 - Math.min(14, i), armies: 30 },
      p2: { territories: 14, armies: 30 + i },
      p3: { territories: 14 + Math.min(14, i), armies: 40 + i },
    },
  })),
  counters: { p1: counters(18), p2: counters(30), p3: counters(null) },
}

describe('StatisticsTab', () => {
  const wrapper = mount(StatisticsTab, { props: { statistics, players, winner: 'p3' } })

  it('lists the winner, then the others from the last eliminated to the first', () => {
    const rows = wrapper.findAll('[data-testid="statistics-row"]').map((row) => row.text())
    expect(rows.map((row) => row.split(/\d/)[0]?.trim())).toEqual(['Carol', 'Bob', 'Alice'])
    expect(rows[0]).toContain('Vainqueur')
    expect(rows[1]).toContain('Éliminé au tour 30')
    expect(rows[2]).toContain('Éliminé au tour 18')
  })

  it('draws territories and armies per turn, a line per player in its color, with a legend', () => {
    const charts = wrapper.findAll('figure')
    expect(charts.map((chart) => chart.get('figcaption').text())).toEqual(['Territoires par tour', 'Armées par tour'])
    for (const chart of charts) {
      const paths = chart.findAll('path')
      expect(paths.map((path) => path.attributes('stroke'))).toEqual(['#3fa34d', '#3a7bd5', '#d64541'])
      expect(paths[0]?.attributes('d')?.split(' ')).toHaveLength(40)
      expect(chart.findAll('li').map((item) => item.text())).toEqual(['Carol', 'Bob', 'Alice'])
    }
  })
})
