import { describe, expect, it } from 'vitest'
import { distanceToPolygon, pointInPolygon, poleOfInaccessibility, polygonArea } from './polygon'

const square = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 10 },
  { x: 0, z: 10 },
]

const concave = [
  { x: 0, z: 0 },
  { x: 10, z: 0 },
  { x: 10, z: 10 },
  { x: 5, z: 2 },
  { x: 0, z: 10 },
]

describe('pointInPolygon', () => {
  it('detects points inside and outside a square', () => {
    expect(pointInPolygon({ x: 5, z: 5 }, square)).toBe(true)
    expect(pointInPolygon({ x: 15, z: 5 }, square)).toBe(false)
  })

  it('handles concave polygons', () => {
    expect(pointInPolygon({ x: 5, z: 1 }, concave)).toBe(true)
    expect(pointInPolygon({ x: 5, z: 8 }, concave)).toBe(false)
  })
})

describe('polygonArea', () => {
  it('returns the area regardless of the winding', () => {
    expect(polygonArea(square)).toBe(100)
    expect(polygonArea([...square].reverse())).toBe(100)
  })
})

describe('distanceToPolygon', () => {
  it('is the distance to the closest edge from outside', () => {
    expect(distanceToPolygon({ x: 13, z: 5 }, square)).toBeCloseTo(3)
    expect(distanceToPolygon({ x: 13, z: 14 }, square)).toBeCloseTo(5)
  })

  it('is the distance to the closest edge from inside', () => {
    expect(distanceToPolygon({ x: 2, z: 5 }, square)).toBeCloseTo(2)
  })
})

describe('poleOfInaccessibility', () => {
  it('finds the center of a square', () => {
    const pole = poleOfInaccessibility(square)
    expect(pole.x).toBeCloseTo(5, 0)
    expect(pole.z).toBeCloseTo(5, 0)
  })

  it('stays in the middle of a long thin rectangle', () => {
    const strip = [
      { x: 0, z: 0 },
      { x: 20, z: 0 },
      { x: 20, z: 2 },
      { x: 0, z: 2 },
    ]
    const pole = poleOfInaccessibility(strip)
    expect(pole.z).toBeCloseTo(1, 1)
    expect(distanceToPolygon(pole, strip)).toBeCloseTo(1, 1)
  })

  it('picks a point inside a concave polygon, away from the notch', () => {
    const pole = poleOfInaccessibility(concave)
    expect(pointInPolygon(pole, concave)).toBe(true)
    expect(distanceToPolygon(pole, concave)).toBeGreaterThan(1)
  })
})
