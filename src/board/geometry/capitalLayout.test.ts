import { describe, expect, it } from 'vitest'
import { classicMap } from '../../engine'
import { CAPITAL_MARKER_RADIUS, PAWN_RADIUS } from '../boardLayout'
import { largestOutline, territoryAnchor } from './anchors'
import { capitalLayout } from './capitalLayout'
import { distanceToPolygon, pointInPolygon, type MapPoint } from './polygon'

function fitsInside(center: MapPoint, radius: number, outline: MapPoint[]): boolean {
  return pointInPolygon(center, outline) && distanceToPolygon(center, outline) >= radius
}

describe('capitalLayout', () => {
  it.each(classicMap.territoryIds)('keeps the pawn and the capital marker of %s inside the shape', (id) => {
    const outline = largestOutline(id)
    const { pawn, marker } = capitalLayout(id)
    expect(fitsInside(pawn, PAWN_RADIUS, outline)).toBe(true)
    expect(fitsInside(marker, CAPITAL_MARKER_RADIUS, outline)).toBe(true)
  })

  it.each(classicMap.territoryIds)('keeps the pawn and the capital marker of %s apart', (id) => {
    const { pawn, marker } = capitalLayout(id)
    expect(Math.hypot(pawn.x - marker.x, pawn.z - marker.z)).toBeGreaterThanOrEqual(PAWN_RADIUS + CAPITAL_MARKER_RADIUS)
  })

  it('only shifts the pawn slightly from its usual anchor', () => {
    for (const id of classicMap.territoryIds) {
      const { pawn } = capitalLayout(id)
      const anchor = territoryAnchor(id)
      expect(Math.hypot(pawn.x - anchor.x, pawn.z - anchor.z), id).toBeLessThanOrEqual(PAWN_RADIUS + CAPITAL_MARKER_RADIUS)
    }
  })

  it('puts the marker east of the pawn when the territory leaves room for it', () => {
    const { pawn, marker } = capitalLayout('brazil')
    expect(marker.x).toBeGreaterThan(pawn.x)
    expect(marker.z).toBeCloseTo(pawn.z, 6)
  })
})
