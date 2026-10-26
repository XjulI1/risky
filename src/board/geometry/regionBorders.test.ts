import { describe, expect, it } from 'vitest'
import type { MapPoint } from './polygon'
import { edgeRuns, sharedEdges } from './regionBorders'

const p = (x: number, z: number): MapPoint => ({ x, z })

// Two regions side by side: west from x 0 to 2, east from x 2 to 4, sharing the edge x = 2.
const west = [p(0, 0), p(2, 0), p(2, 1), p(2, 2), p(0, 2)]
const east = [p(2, 0), p(4, 0), p(4, 2), p(2, 2), p(2, 1)]

describe('sharedEdges', () => {
  it('keeps the edges of two regions, and no coast', () => {
    expect(sharedEdges({ west: [west], east: [east] }).size).toBe(2)
  })

  it('finds nothing for a region alone, such as an island', () => {
    expect(sharedEdges({ west: [west] }).size).toBe(0)
  })
})

describe('edgeRuns', () => {
  const edges = sharedEdges({ west: [west], east: [east] })

  it('follows the shared edges of an outline as one open line', () => {
    expect(edgeRuns([west], edges)).toEqual([[p(2, 0), p(2, 1), p(2, 2)]])
  })

  it('joins a stretch running across the start of an outline', () => {
    const rotated = [p(2, 1), p(2, 2), p(0, 2), p(0, 0), p(2, 0)]
    expect(edgeRuns([rotated], edges)).toEqual([[p(2, 0), p(2, 1), p(2, 2)]])
  })

  it('applies to the outline of a territory lying along the limit', () => {
    const territory = [p(1, 1), p(2, 1), p(2, 2), p(1, 2)]
    expect(edgeRuns([territory], edges)).toEqual([[p(2, 1), p(2, 2)]])
  })

  it('does not draw a coast edge between two points of different limits', () => {
    const coast = [p(0, 0), p(1, 0), p(1, 1), p(0, 1)]
    const north = [p(-1, -1), p(0, -1), p(0, 0), p(-1, 0)]
    const south = [p(1, 0), p(2, 0), p(2, 1), p(1, 1)]
    const limits = sharedEdges({ coast: [coast], north: [north], south: [south] })
    expect(edgeRuns([coast], limits)).toEqual([[p(1, 0), p(1, 1)]])
  })
})
