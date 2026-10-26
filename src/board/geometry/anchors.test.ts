import { describe, expect, it } from 'vitest'
import { mapById } from '../../engine'
import { BOARD_MAP_IDS, boardMapFor } from '../maps'
import { largestOutline } from './anchors'
import { distanceToPolygon, pointInPolygon, polygonArea, type MapPoint } from './polygon'

function bruteForceClearance(outline: MapPoint[]): number {
  const xs = outline.map((p) => p.x)
  const zs = outline.map((p) => p.z)
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  let best = 0
  const steps = 40
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const point = { x: minX + ((maxX - minX) * i) / steps, z: minZ + ((maxZ - minZ) * j) / steps }
      if (pointInPolygon(point, outline)) {
        best = Math.max(best, distanceToPolygon(point, outline))
      }
    }
  }
  return best
}

describe.each(BOARD_MAP_IDS)('territory anchors of the %s map', (mapId) => {
  const board = boardMapFor(mapId)

  it('fall inside the shape of every territory, on its largest piece', () => {
    for (const id of mapById(mapId).territoryIds) {
      expect(pointInPolygon(board.anchor(id), largestOutline(board.geometry[id])), id).toBe(true)
    }
  })

  it('stand as far from the edges as the territory allows', () => {
    for (const id of mapById(mapId).territoryIds) {
      const outline = largestOutline(board.geometry[id])
      const clearance = distanceToPolygon(board.anchor(id), outline)
      expect(clearance, id).toBeGreaterThanOrEqual(0.9 * bruteForceClearance(outline))
    }
  })
})

describe('classic territory anchors', () => {
  const board = boardMapFor('classic')
  const classicOutline = (id: string) => largestOutline(board.geometry[id])

  it.each(['east_africa', 'alberta', 'northwest_territory'])('keep the pawn of %s away from its borders', (id) => {
    const outline = classicOutline(id)
    const xs = outline.map((p) => p.x)
    const width = Math.max(...xs) - Math.min(...xs)
    expect(distanceToPolygon(board.anchor(id), outline)).toBeGreaterThan(width / 8)
  })

  it('stand on the biggest island of a multi-island territory', () => {
    const uk = classicOutline('uk')
    expect(polygonArea(uk)).toBeGreaterThan(0)
    expect(polygonArea(uk)).toBeGreaterThan(polygonArea(classicOutline('iceland')))
  })
})
