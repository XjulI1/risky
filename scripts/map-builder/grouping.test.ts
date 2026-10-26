import { describe, expect, it } from 'vitest'
import { groupingProblems, type Grouping } from './grouping.ts'

const grouping: Grouping = {
  regions: ['north', 'south'],
  territories: [
    { id: 'a', region: 'north', departments: ['01', '02'] },
    { id: 'b', region: 'south', departments: ['03'] },
  ],
}

const departments = ['01', '02', '03']

describe('groupingProblems', () => {
  it('accepts a complete grouping', () => {
    expect(groupingProblems(grouping, departments)).toEqual([])
  })

  it('names a department left out of every territory', () => {
    expect(groupingProblems(grouping, [...departments, '2A'])).toEqual([expect.stringContaining('2A')])
  })

  it('names a department grouped twice', () => {
    const twice: Grouping = {
      ...grouping,
      territories: [...grouping.territories, { id: 'c', region: 'south', departments: ['02'] }],
    }
    expect(groupingProblems(twice, departments)).toEqual([expect.stringContaining('02')])
  })

  it('names a department absent from the source', () => {
    expect(groupingProblems(grouping, ['01', '02'])).toEqual([expect.stringContaining('03')])
  })

  it('names an empty region', () => {
    expect(groupingProblems({ ...grouping, regions: [...grouping.regions, 'east'] }, departments)).toEqual([
      expect.stringContaining('east'),
    ])
  })

  it('names a territory in an undeclared region', () => {
    const stray: Grouping = {
      ...grouping,
      territories: [...grouping.territories, { id: 'c', region: 'west', departments: ['04'] }],
    }
    expect(groupingProblems(stray, [...departments, '04'])).toEqual([expect.stringContaining('west')])
  })
})
