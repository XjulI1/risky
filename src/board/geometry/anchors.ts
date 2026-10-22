import type { TerritoryId } from '../../engine'
import { mapGeometry } from './mapGeometry'
import { poleOfInaccessibility, polygonArea, type MapPoint } from './polygon'

/** Outline of the largest piece of a territory. */
export function largestOutline(id: TerritoryId): MapPoint[] {
  const outlines = mapGeometry[id]?.outlines ?? []
  return outlines.reduce<MapPoint[]>(
    (largest, outline) => (polygonArea(outline) > polygonArea(largest) ? outline : largest),
    [],
  )
}

const anchors: Record<TerritoryId, MapPoint> = Object.fromEntries(
  Object.keys(mapGeometry).map((id) => [id, poleOfInaccessibility(largestOutline(id))]),
)

/** Where the army pawn of a territory stands: the point of its largest piece farthest from the edges. */
export function territoryAnchor(id: TerritoryId): MapPoint {
  return anchors[id] ?? { x: 0, z: 0 }
}
