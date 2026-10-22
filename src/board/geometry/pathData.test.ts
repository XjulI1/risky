import { describe, expect, it } from 'vitest'
import geometry from '../../../data/maps/classic/territories.json'
import { parsePathData } from './pathData'

describe('parsePathData', () => {
  it('reads a closed polygon made of M, L and z', () => {
    expect(parsePathData('M 0,0 L 10,0 L 10,10 z')).toEqual([
      [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 10, y: 0 },
        { type: 'L', x: 10, y: 10 },
      ],
    ])
  })

  it('reads cubic curves and their implicit repetitions', () => {
    expect(parsePathData('M 1,2 C 3,4 5,6 7,8 9,10 11,12 13,14 Z')).toEqual([
      [
        { type: 'M', x: 1, y: 2 },
        { type: 'C', x1: 3, y1: 4, x2: 5, y2: 6, x: 7, y: 8 },
        { type: 'C', x1: 9, y1: 10, x2: 11, y2: 12, x: 13, y: 14 },
      ],
    ])
  })

  it('treats extra coordinate pairs after M as line segments', () => {
    expect(parsePathData('M 0,0 5,5 z')).toEqual([
      [
        { type: 'M', x: 0, y: 0 },
        { type: 'L', x: 5, y: 5 },
      ],
    ])
  })

  it('splits several sub-paths', () => {
    const subPaths = parsePathData('M 0,0 L 1,0 L 1,1 z M 5,5 L 6,5 L 6,6 z')
    expect(subPaths).toHaveLength(2)
    expect(subPaths[1]?.[0]).toEqual({ type: 'M', x: 5, y: 5 })
  })

  it('reads negative and decimal numbers', () => {
    expect(parsePathData('M -1.5,.25 L 2e1,-3 z')[0]).toEqual([
      { type: 'M', x: -1.5, y: 0.25 },
      { type: 'L', x: 20, y: -3 },
    ])
  })

  it.each(['M 0,0 Q 1,1 2,2 z', 'M 0,0 l 1,1 z', 'M 0,0 H 5 z'])('rejects the unsupported path %s', (d) => {
    expect(() => parsePathData(d)).toThrow(/Unsupported path command/)
  })

  it('reads the 42 territory outlines of the classic map', () => {
    for (const territory of geometry.territories) {
      expect(parsePathData(territory.d).length).toBeGreaterThan(0)
    }
  })
})
