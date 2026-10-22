import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { MAP_WORLD_DEPTH, MAP_WORLD_WIDTH, mapGeometry } from './geometry/mapGeometry'
import { polygonArea, type MapPoint } from './geometry/polygon'

/** Vertical field of view of the board camera, in degrees. */
export const CAMERA_FOV = 50

/** Fixed tilt of the board camera above the horizon, in degrees. */
export const CAMERA_TILT_DEG = 55

const FIT_SEARCH_STEPS = 40
const MAP_CORNERS = [
  new Vector3(-MAP_WORLD_WIDTH / 2, 0, -MAP_WORLD_DEPTH / 2),
  new Vector3(MAP_WORLD_WIDTH / 2, 0, -MAP_WORLD_DEPTH / 2),
  new Vector3(-MAP_WORLD_WIDTH / 2, 0, MAP_WORLD_DEPTH / 2),
  new Vector3(MAP_WORLD_WIDTH / 2, 0, MAP_WORLD_DEPTH / 2),
]
const AVERAGE_TERRITORY_SHARE_OF_VIEW = 1 / 3

/** Camera position looking at `target` from `distance`, with the fixed tilt and orientation. */
export function cameraPosition(target: MapPoint, distance: number): { x: number; y: number; z: number } {
  const tilt = MathUtils.degToRad(CAMERA_TILT_DEG)
  return { x: target.x, y: distance * Math.sin(tilt), z: target.z + distance * Math.cos(tilt) }
}

function mapFits(aspect: number, distance: number): boolean {
  const camera = new PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 10_000)
  const position = cameraPosition({ x: 0, z: 0 }, distance)
  camera.position.set(position.x, position.y, position.z)
  camera.lookAt(0, 0, 0)
  camera.updateMatrixWorld()
  return MAP_CORNERS.every((corner) => {
    const projected = corner.clone().project(camera)
    return Math.abs(projected.x) <= 1 && Math.abs(projected.y) <= 1
  })
}

/** Smallest camera distance that keeps the whole map in view for a viewport aspect ratio. */
export function fitDistance(aspect: number): number {
  let near = 1
  let far = 1_000
  for (let step = 0; step < FIT_SEARCH_STEPS; step++) {
    const middle = (near + far) / 2
    if (mapFits(aspect, middle)) {
      far = middle
    } else {
      near = middle
    }
  }
  return far
}

/** Keeps the camera target inside the map. */
export function clampTarget(target: MapPoint): MapPoint {
  return {
    x: MathUtils.clamp(target.x, -MAP_WORLD_WIDTH / 2, MAP_WORLD_WIDTH / 2),
    z: MathUtils.clamp(target.z, -MAP_WORLD_DEPTH / 2, MAP_WORLD_DEPTH / 2),
  }
}

/** Side of a square with the average territory area, in world units. */
export function averageTerritorySize(): number {
  const territories = Object.values(mapGeometry)
  const totalArea = territories.reduce(
    (sum, territory) => sum + territory.outlines.reduce((area, outline) => area + polygonArea(outline), 0),
    0,
  )
  return Math.sqrt(totalArea / territories.length)
}

/** Closest camera distance allowed: an average territory then fills about a third of the view height. */
export function maxZoomDistance(): number {
  const visibleHeight = averageTerritorySize() / AVERAGE_TERRITORY_SHARE_OF_VIEW
  return visibleHeight / (2 * Math.tan(MathUtils.degToRad(CAMERA_FOV / 2)))
}
