import type { TerritoryId } from '../engine'
import type { TerritoryGeometry } from './geometry/mapGeometry'
import { distanceToPolygon, pointInPolygon, type MapPoint } from './geometry/polygon'

/** Position of a pointer, in CSS pixels, at a given time in milliseconds. */
export type PointerSample = {
  x: number
  y: number
  time: number
}

/** Beyond this many pixels between press and release, the gesture moves the camera. */
export const TAP_MAX_DISTANCE_PX = 6

/** Beyond this press duration, the gesture is not a tap. */
export const TAP_MAX_DURATION_MS = 500

/** Radius, in world units, within which a touch on the ocean picks the closest territory. */
export const TOUCH_TOLERANCE = 1.5

/** Whether a press and its release form a tap rather than a drag or a long press. */
export function isTap(down: PointerSample, up: PointerSample): boolean {
  return (
    Math.hypot(up.x - down.x, up.y - down.y) <= TAP_MAX_DISTANCE_PX && up.time - down.time <= TAP_MAX_DURATION_MS
  )
}

/** Territory of `territories` under `point`, or the closest one within `tolerance` when the point is on the ocean. */
export function nearestTerritory(
  point: MapPoint,
  territories: Record<TerritoryId, TerritoryGeometry>,
  tolerance = TOUCH_TOLERANCE,
): TerritoryId | null {
  let closest: { id: TerritoryId; distance: number } | null = null
  for (const territory of Object.values(territories)) {
    for (const outline of territory.outlines) {
      if (pointInPolygon(point, outline)) {
        return territory.id
      }
      const distance = distanceToPolygon(point, outline)
      if (distance <= tolerance && (closest === null || distance < closest.distance)) {
        closest = { id: territory.id, distance }
      }
    }
  }
  return closest?.id ?? null
}
