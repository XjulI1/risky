import { describe, expect, it } from 'vitest'
import geometry from '../../../data/maps/classic/territories.json'
import { classicMap } from '../../engine'
import { MAP_WORLD_DEPTH, MAP_WORLD_WIDTH, mapGeometry, svgToWorld } from './mapGeometry'
import { pointInPolygon } from './polygon'

const [minX, minY, width, height] = geometry.viewBox as [number, number, number, number]

describe('svgToWorld', () => {
  it('maps the view box to a 100-unit wide map centered on the origin', () => {
    expect(MAP_WORLD_WIDTH).toBe(100)
    expect(MAP_WORLD_DEPTH).toBeCloseTo((height * 100) / width)
    expect(svgToWorld(minX, minY)).toEqual({ x: -50, z: -MAP_WORLD_DEPTH / 2 })
    const corner = svgToWorld(minX + width, minY + height)
    expect(corner.x).toBeCloseTo(50)
    expect(corner.z).toBeCloseTo(MAP_WORLD_DEPTH / 2)
  })

  it('turns the downward SVG y axis into the z axis', () => {
    expect(svgToWorld(300, 100).z).toBeLessThan(svgToWorld(300, 200).z)
    expect(svgToWorld(100, 300).x).toBeLessThan(svgToWorld(200, 300).x)
  })
})

describe('mapGeometry', () => {
  it('has one entry per engine territory and no other', () => {
    expect(Object.keys(mapGeometry).sort()).toEqual([...classicMap.territoryIds].sort())
  })

  it('splits island territories into several shapes', () => {
    expect(mapGeometry.indonesia?.shapes).toHaveLength(4)
    expect(mapGeometry.uk?.shapes).toHaveLength(2)
    for (const territory of Object.values(mapGeometry)) {
      expect(territory.shapes.length).toBeGreaterThan(0)
      expect(territory.outlines).toHaveLength(territory.shapes.length)
    }
  })

  it('has no outline nested inside another outline of the same territory', () => {
    for (const territory of Object.values(mapGeometry)) {
      territory.outlines.forEach((outline, i) => {
        territory.outlines.forEach((other, j) => {
          if (i !== j) {
            expect(pointInPolygon(outline[0] ?? { x: 0, z: 0 }, other)).toBe(false)
          }
        })
      })
    }
  })

  it('keeps every outline within the map bounds, give or take the data overshooting its view box', () => {
    const margin = 0.5
    for (const territory of Object.values(mapGeometry)) {
      for (const point of territory.outlines.flat()) {
        expect(Math.abs(point.x)).toBeLessThanOrEqual(MAP_WORLD_WIDTH / 2 + margin)
        expect(Math.abs(point.z)).toBeLessThanOrEqual(MAP_WORLD_DEPTH / 2 + margin)
      }
    }
  })

  it('draws shapes in the (x, -z) plane so that a -90° rotation around X lays them on the map', () => {
    const egypt = mapGeometry.egypt
    const firstShapePoint = egypt?.shapes[0]?.getPoints()[0]
    const firstOutlinePoint = egypt?.outlines[0]?.[0]
    expect(firstShapePoint?.x).toBeCloseTo(firstOutlinePoint?.x ?? NaN)
    expect(firstShapePoint?.y).toBeCloseTo(-(firstOutlinePoint?.z ?? NaN))
  })
})
