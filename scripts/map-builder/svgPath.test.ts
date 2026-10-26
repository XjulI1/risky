import { describe, expect, it } from 'vitest'
import { parsePathData } from '../../src/board/geometry/pathData.ts'
import { geometryToPath, svgFrame } from './svgPath.ts'

// A 2000 × 1000 m bounding box: scale 0.5 on a 1000-unit wide view box.
const frame = svgFrame([0, 0, 2000, 1000], 1000)

const square = [
  [0, 0],
  [1000, 0],
  [1000, 1000],
  [0, 1000],
  [0, 0],
]

describe('svgFrame', () => {
  it('scales the bounding box to 1000 units wide, keeping the ratio', () => {
    expect(frame.viewBox).toEqual([0, 0, 1000, 500])
  })

  it('turns the upward y axis of the projection into the downward SVG one', () => {
    expect(frame.toSvg([0, 1000])).toEqual([0, 0])
    expect(frame.toSvg([2000, 0])).toEqual([1000, 500])
  })

  it('rounds to a tenth', () => {
    expect(frame.toSvg([1.234, 999.87])).toEqual([0.6, 0.1])
  })

  it('leaves a margin around the land when asked', () => {
    const framed = svgFrame([0, 0, 2000, 1000], 1000, 100)
    expect(framed.viewBox).toEqual([0, 0, 1000, 600])
    expect(framed.toSvg([0, 1000])).toEqual([100, 100])
    expect(framed.toSvg([2000, 0])).toEqual([900, 500])
  })
})

describe('geometryToPath', () => {
  it('draws one closed sub-path per polygon, without repeating the first point', () => {
    expect(geometryToPath('a', { type: 'Polygon', coordinates: [square] }, frame)).toBe(
      'M 0,500 L 500,500 L 500,0 L 0,0 Z',
    )
  })

  it('draws every polygon of a multi-polygon', () => {
    const island = square.map(([x = 0, y = 0]) => [x + 1000, y])
    const d = geometryToPath('a', { type: 'MultiPolygon', coordinates: [[square], [island]] }, frame)
    expect(d.match(/M/g)).toHaveLength(2)
    expect(d.match(/Z/g)).toHaveLength(2)
  })

  it('is read back by the board path parser', () => {
    const d = geometryToPath('a', { type: 'Polygon', coordinates: [square] }, frame)
    expect(parsePathData(d)).toEqual([
      [
        { type: 'M', x: 0, y: 500 },
        { type: 'L', x: 500, y: 500 },
        { type: 'L', x: 500, y: 0 },
        { type: 'L', x: 0, y: 0 },
      ],
    ])
  })

  it('refuses a polygon with a hole, naming the territory', () => {
    const hole = [
      [200, 200],
      [400, 200],
      [400, 400],
      [200, 200],
    ]
    expect(() => geometryToPath('paris', { type: 'Polygon', coordinates: [square, hole] }, frame)).toThrow(/paris/)
  })
})
