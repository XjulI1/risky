import type { TerritoryId } from '../../engine'
import type { TerritoryGeometry } from './mapGeometry'
import { poleOfInaccessibility, polygonArea, type MapPoint } from './polygon'

/** Outline of the largest piece of a territory. */
export function largestOutline(geometry: TerritoryGeometry | undefined): MapPoint[] {
  const outlines = geometry?.outlines ?? []
  return outlines.reduce<MapPoint[]>(
    (largest, outline) => (polygonArea(outline) > polygonArea(largest) ? outline : largest),
    [],
  )
}

/** Where the army pawn of each territory stands: the point of its largest piece farthest from the edges. */
export function territoryAnchors(geometry: Record<TerritoryId, TerritoryGeometry>): Record<TerritoryId, MapPoint> {
  return Object.fromEntries(
    Object.entries(geometry).map(([id, territory]) => [id, poleOfInaccessibility(largestOutline(territory))]),
  )
}
