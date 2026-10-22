import { describe, expect, it } from 'vitest'
import { classicMap } from '../../engine'
import { largestOutline, territoryAnchor } from './anchors'
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

describe('territoryAnchor', () => {
  it('falls inside the shape of every territory, on its largest piece', () => {
    for (const id of classicMap.territoryIds) {
      expect(pointInPolygon(territoryAnchor(id), largestOutline(id)), id).toBe(true)
    }
  })

  it('stands as far from the edges as the territory allows', () => {
    for (const id of classicMap.territoryIds) {
      const outline = largestOutline(id)
      const clearance = distanceToPolygon(territoryAnchor(id), outline)
      expect(clearance, id).toBeGreaterThanOrEqual(0.9 * bruteForceClearance(outline))
    }
  })

  it.each(['east_africa', 'alberta', 'northwest_territory'])('keeps the pawn of %s away from its borders', (id) => {
    const outline = largestOutline(id)
    const xs = outline.map((p) => p.x)
    const width = Math.max(...xs) - Math.min(...xs)
    expect(distanceToPolygon(territoryAnchor(id), outline)).toBeGreaterThan(width / 8)
  })
})

describe('largestOutline', () => {
  it('picks the biggest island of a multi-island territory', () => {
    const uk = largestOutline('uk')
    expect(polygonArea(uk)).toBeGreaterThan(0)
    expect(polygonArea(uk)).toBeGreaterThan(polygonArea(largestOutline('iceland')))
  })
})
