import { describe, expect, it } from 'vitest'
import { integerTicks, lineChartLayout, type ChartSeries } from './lineChart'

const SIZE = { width: 400, height: 200, padding: { top: 10, right: 10, bottom: 30, left: 40 } }

const series: ChartSeries[] = [
  { id: 'p3', label: 'Carol', color: '#3fa34d', values: [10, 20, 37] },
  { id: 'p1', label: 'Alice', color: '#d64541', values: [12, 8, 0] },
]

describe('integerTicks', () => {
  it('gives whole, evenly spaced ticks from 0 up to the maximum or just above', () => {
    expect(integerTicks(37)).toEqual([0, 10, 20, 30, 40])
    expect(integerTicks(4)).toEqual([0, 1, 2, 3, 4])
    expect(integerTicks(42)).toEqual([0, 10, 20, 30, 40, 50])
    expect(integerTicks(130)).toEqual([0, 50, 100, 150])
  })

  it('keeps an axis for an empty or flat chart', () => {
    expect(integerTicks(0)).toEqual([0, 1])
  })

  it('never gives a fractional tick', () => {
    for (const max of [1, 3, 7, 11, 19, 63, 999]) {
      expect(integerTicks(max).every(Number.isInteger)).toBe(true)
    }
  })
})

describe('lineChartLayout', () => {
  const layout = lineChartLayout(series, [1, 2, 3], SIZE)

  it('spans the turns over the width and the values from 0 to the top tick over the height', () => {
    expect(layout.plot).toEqual({ left: 40, top: 10, right: 390, bottom: 170 })
    expect(layout.yTicks.map((tick) => tick.value)).toEqual([0, 10, 20, 30, 40])
    expect(layout.yTicks[0]?.position).toBe(170)
    expect(layout.yTicks.at(-1)?.position).toBe(10)
    expect(layout.xTicks.map((tick) => tick.value)).toEqual([1, 2, 3])
    expect(layout.xTicks.map((tick) => tick.position)).toEqual([40, 215, 390])
  })

  it('places each point at its turn and value', () => {
    expect(layout.lines[0]?.points).toEqual([
      [40, 130],
      [215, 90],
      [390, 22],
    ])
    expect(layout.lines[0]?.path).toBe('M40,130 L215,90 L390,22')
  })

  it('lists the legend in the order of the series', () => {
    expect(layout.legend).toEqual([
      { id: 'p3', label: 'Carol', color: '#3fa34d' },
      { id: 'p1', label: 'Alice', color: '#d64541' },
    ])
  })

  it('keeps a few whole turn ticks on a long game', () => {
    const turns = Array.from({ length: 40 }, (_, i) => i + 1)
    const long = lineChartLayout([{ ...series[0]!, values: turns }], turns, SIZE)
    expect(long.xTicks.map((tick) => tick.value)).toEqual([1, 10, 20, 30, 40])
    expect(long.lines[0]?.points).toHaveLength(40)
  })

  it('centers a single turn', () => {
    const single = lineChartLayout([{ ...series[0]!, values: [5] }], [1], SIZE)
    expect(single.lines[0]?.points[0]?.[0]).toBe(215)
  })
})
