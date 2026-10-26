import { describe, expect, it } from 'vitest'
import { closestPoints, labelPoint } from './points.ts'

const square = (x: number, y: number, side: number) => [
  [x, y],
  [x + side, y],
  [x + side, y + side],
  [x, y + side],
]

describe('labelPoint', () => {
  it('lies at the center of a square', () => {
    const [x = NaN, y = NaN] = labelPoint([square(0, 0, 10)])
    expect(x).toBeCloseTo(5, 0)
    expect(y).toBeCloseTo(5, 0)
  })

  it('lies on the largest piece of a territory', () => {
    const [x = NaN] = labelPoint([square(100, 0, 2), square(0, 0, 10)])
    expect(x).toBeLessThan(10)
  })
})

describe('closestPoints', () => {
  it('joins the nearest coasts of two outlines', () => {
    const corner = [
      [15, 10],
      [20, 10],
      [20, 15],
    ]
    expect(closestPoints([square(0, 0, 10)], [corner])).toEqual({ pa: [10, 10], pb: [15, 10], dist: 5 })
  })

  it('takes a point inside an edge when it is closer than any vertex', () => {
    const triangle = [
      [20, 5],
      [30, 0],
      [30, 10],
    ]
    expect(closestPoints([square(0, 0, 10)], [triangle])).toEqual({ pa: [10, 5], pb: [20, 5], dist: 10 })
  })

  it('looks at every piece of each territory', () => {
    const { dist } = closestPoints([square(0, 0, 10), square(100, 0, 10)], [square(115, 0, 10)])
    expect(dist).toBe(5)
  })
})
