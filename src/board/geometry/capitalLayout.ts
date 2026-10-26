import { CAPITAL_MARKER_RADIUS, PAWN_RADIUS } from '../boardLayout'
import { distanceToPolygon, pointInPolygon, type MapPoint } from './polygon'

/** Where the army pawn and the capital marker of a capital stand, side by side. */
export type CapitalLayout = {
  pawn: MapPoint
  marker: MapPoint
}

const GAP = 0.08
const SEPARATION = PAWN_RADIUS + CAPITAL_MARKER_RADIUS + GAP
const COMFORTABLE_MARGIN = 0.15
const DIRECTION_COUNT = 16
const MARKER_SHARES = [0.5, 0.65, 0.8, 1]

const directions: MapPoint[] = Array.from({ length: DIRECTION_COUNT }, (_, i) => (2 * Math.PI * i) / DIRECTION_COUNT)
  .sort((a, b) => Math.abs(Math.sin(a)) - Math.abs(Math.sin(b)) || Math.cos(b) - Math.cos(a))
  .map((angle) => ({ x: Math.cos(angle), z: Math.sin(angle) }))

function shifted(point: MapPoint, direction: MapPoint, distance: number): MapPoint {
  return { x: point.x + direction.x * distance, z: point.z + direction.z * distance }
}

function room(center: MapPoint, radius: number, outline: MapPoint[]): number {
  return pointInPolygon(center, outline) ? distanceToPolygon(center, outline) - radius : -Infinity
}

function arrangements(anchor: MapPoint): CapitalLayout[] {
  return directions.flatMap((direction) =>
    MARKER_SHARES.map((share) => ({
      pawn: shifted(anchor, direction, -SEPARATION * (1 - share)),
      marker: shifted(anchor, direction, SEPARATION * share),
    })),
  )
}

/**
 * Pawn and marker positions of a capital whose largest piece is `outline` and usual pawn position `anchor`:
 * the marker beside the pawn, east of it when the territory leaves room, the pawn moving away from its
 * anchor by less than their combined width.
 */
export function capitalLayout(outline: MapPoint[], anchor: MapPoint): CapitalLayout {
  const margin = ({ pawn, marker }: CapitalLayout) =>
    Math.min(room(pawn, PAWN_RADIUS, outline), room(marker, CAPITAL_MARKER_RADIUS, outline))
  const candidates = arrangements(anchor)
  const comfortable = candidates.find((candidate) => margin(candidate) >= COMFORTABLE_MARGIN)
  return (
    comfortable ??
    candidates.reduce((best, candidate) => (margin(candidate) > margin(best) ? candidate : best))
  )
}
