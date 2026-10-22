import { describe, expect, it } from 'vitest'
import { mapGeometry } from './geometry/mapGeometry'
import { distanceToPolygon, pointInPolygon, type MapPoint } from './geometry/polygon'
import { isTap, nearestTerritory, TOUCH_TOLERANCE } from './tapDetector'

describe('isTap', () => {
  const down = { x: 100, y: 100, time: 0 }

  it('accepts a short press that barely moves', () => {
    expect(isTap(down, { x: 103, y: 102, time: 150 })).toBe(true)
  })

  it('rejects a press that moves more than 6 pixels', () => {
    expect(isTap(down, { x: 107, y: 100, time: 150 })).toBe(false)
  })

  it('rejects a press longer than 500 ms', () => {
    expect(isTap(down, { x: 100, y: 100, time: 501 })).toBe(false)
  })
})

describe('nearestTerritory', () => {
  const allOutlines = Object.values(mapGeometry).flatMap((territory) => territory.outlines)
  const isOcean = (point: MapPoint) => allOutlines.every((outline) => !pointInPolygon(point, outline))

  it('returns the territory under the point', () => {
    const egyptOutline = mapGeometry.egypt?.outlines[0] ?? []
    const inside = egyptOutline.reduce(
      (sum, p) => ({ x: sum.x + p.x / egyptOutline.length, z: sum.z + p.z / egyptOutline.length }),
      { x: 0, z: 0 },
    )
    expect(nearestTerritory(inside)).toBe('egypt')
  })

  it('snaps an ocean tap within the tolerance to the closest territory', () => {
    const iceland = mapGeometry.iceland?.outlines.flat() ?? []
    const northernmost = iceland.reduce((best, p) => (p.z < best.z ? p : best))
    const offshore = { x: northernmost.x, z: northernmost.z - 0.5 }
    expect(isOcean(offshore)).toBe(true)
    expect(nearestTerritory(offshore)).toBe('iceland')
  })

  it('returns nothing beyond the tolerance', () => {
    const farOffshore = { x: -45, z: 30 }
    expect(allOutlines.every((outline) => distanceToPolygon(farOffshore, outline) > TOUCH_TOLERANCE)).toBe(true)
    expect(nearestTerritory(farOffshore)).toBeNull()
  })
})
