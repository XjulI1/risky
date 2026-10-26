import { describe, expect, it } from 'vitest'
import { mapById } from '../../engine'
import { CAPITAL_MARKER_RADIUS, PAWN_RADIUS } from '../boardLayout'
import { BOARD_MAP_IDS, boardMapFor } from '../maps'
import { largestOutline } from './anchors'
import { distanceToPolygon, pointInPolygon, type MapPoint } from './polygon'

function fitsInside(center: MapPoint, radius: number, outline: MapPoint[]): boolean {
  return pointInPolygon(center, outline) && distanceToPolygon(center, outline) >= radius
}

describe.each(BOARD_MAP_IDS)('capital layout on the %s map', (mapId) => {
  const board = boardMapFor(mapId)
  const territoryIds = mapById(mapId).territoryIds

  it.each(territoryIds)('keeps the pawn and the capital marker of %s inside the shape', (id) => {
    const outline = largestOutline(board.geometry[id])
    const { pawn, marker } = board.capitalLayout(id)
    expect(fitsInside(pawn, PAWN_RADIUS, outline)).toBe(true)
    expect(fitsInside(marker, CAPITAL_MARKER_RADIUS, outline)).toBe(true)
  })

  it.each(territoryIds)('keeps the pawn and the capital marker of %s apart', (id) => {
    const { pawn, marker } = board.capitalLayout(id)
    expect(Math.hypot(pawn.x - marker.x, pawn.z - marker.z)).toBeGreaterThanOrEqual(PAWN_RADIUS + CAPITAL_MARKER_RADIUS)
  })

  it('only shifts the pawn slightly from its usual anchor', () => {
    for (const id of territoryIds) {
      const { pawn } = board.capitalLayout(id)
      const anchor = board.anchor(id)
      expect(Math.hypot(pawn.x - anchor.x, pawn.z - anchor.z), id).toBeLessThanOrEqual(PAWN_RADIUS + CAPITAL_MARKER_RADIUS)
    }
  })

})

describe('classic capital layout', () => {
  it('puts the marker east of the pawn when the territory leaves room for it', () => {
    const { pawn, marker } = boardMapFor('classic').capitalLayout('brazil')
    expect(marker.x).toBeGreaterThan(pawn.x)
    expect(marker.z).toBeCloseTo(pawn.z, 6)
  })
})
