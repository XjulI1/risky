import { PerspectiveCamera, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  averageTerritorySize,
  CAMERA_FOV,
  CAMERA_TILT_DEG,
  cameraPosition,
  clampTarget,
  fitDistance,
  maxZoomDistance,
} from './cameraFraming'
import { MAP_WORLD_DEPTH, MAP_WORLD_WIDTH } from './geometry/mapGeometry'

const corners = [
  new Vector3(-MAP_WORLD_WIDTH / 2, 0, -MAP_WORLD_DEPTH / 2),
  new Vector3(MAP_WORLD_WIDTH / 2, 0, -MAP_WORLD_DEPTH / 2),
  new Vector3(-MAP_WORLD_WIDTH / 2, 0, MAP_WORLD_DEPTH / 2),
  new Vector3(MAP_WORLD_WIDTH / 2, 0, MAP_WORLD_DEPTH / 2),
]

function projectedCorners(aspect: number, distance: number): Vector3[] {
  const camera = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 1000)
  const position = cameraPosition({ x: 0, z: 0 }, distance)
  camera.position.set(position.x, position.y, position.z)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld()
  return corners.map((corner) => corner.clone().project(camera))
}

const fits = (points: Vector3[]) => points.every((p) => Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1)

describe('camera tilt', () => {
  it('looks at the map from above with a tilt between 45° and 60°', () => {
    expect(CAMERA_TILT_DEG).toBeGreaterThanOrEqual(45)
    expect(CAMERA_TILT_DEG).toBeLessThanOrEqual(60)
    const position = cameraPosition({ x: 0, z: 0 }, 10)
    expect((Math.atan2(position.y, position.z) * 180) / Math.PI).toBeCloseTo(CAMERA_TILT_DEG)
  })
})

describe('fitDistance', () => {
  it.each([
    ['1920 × 1080', 1920 / 1080],
    ['1024 × 768', 1024 / 768],
  ])('frames the whole map in a %s window, tightly', (_, aspect) => {
    const distance = fitDistance(aspect)
    expect(fits(projectedCorners(aspect, distance))).toBe(true)
    expect(fits(projectedCorners(aspect, distance * 0.85))).toBe(false)
  })
})

describe('clampTarget', () => {
  it('keeps a target inside the map unchanged', () => {
    expect(clampTarget({ x: 10, z: -5 })).toEqual({ x: 10, z: -5 })
  })

  it('brings a target back to the map edge', () => {
    expect(clampTarget({ x: 500, z: -500 })).toEqual({ x: MAP_WORLD_WIDTH / 2, z: -MAP_WORLD_DEPTH / 2 })
  })
})

describe('maxZoomDistance', () => {
  it('lets an average territory fill about a third of the view height', () => {
    const distance = maxZoomDistance()
    const visibleHeight = 2 * distance * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180)
    expect(averageTerritorySize() / visibleHeight).toBeCloseTo(1 / 3, 1)
  })

  it('is closer than the framing distance', () => {
    expect(maxZoomDistance()).toBeLessThan(fitDistance(1024 / 768))
  })
})
