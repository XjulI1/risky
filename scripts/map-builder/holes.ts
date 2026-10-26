import { pointInPolygon, polygonArea } from '../../src/board/geometry/polygon.ts'
import { labelPoint } from './points.ts'
import type { AreaGeometry } from './svgPath.ts'

type Position = number[]
type Polygon = Position[][]

/** A territory or a region and its outline. */
export type Area = {
  id: string
  geometry: AreaGeometry
}

const polygonsOf = (geometry: AreaGeometry): Polygon[] =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

const toPoints = (ring: Position[]) => ring.map(([x = 0, y = 0]) => ({ x, z: y }))

/**
 * The areas drawn without holes, since the board cannot extrude them: every hole is filled, and a piece
 * of an area lying in the hole of another (an enclave) is dropped, the area around it covering it instead.
 */
export function withoutHoles(areas: readonly Area[]): { id: string; geometry: { type: 'MultiPolygon'; coordinates: Polygon[] } }[] {
  const holes = areas.flatMap((area) => polygonsOf(area.geometry).flatMap((polygon) => polygon.slice(1).map(toPoints)))
  /** Rounding of the shared border aside, an enclave covers at most the area of the hole it fills. */
  const isEnclave = (polygon: Polygon) => {
    const outer = polygon[0] ?? []
    const [x, y] = labelPoint([outer])
    const area = polygonArea(toPoints(outer))
    return holes.some((hole) => pointInPolygon({ x, z: y }, hole) && area <= polygonArea(hole) * 1.01)
  }
  return areas.map((area) => ({
    id: area.id,
    geometry: {
      type: 'MultiPolygon',
      coordinates: polygonsOf(area.geometry)
        .filter((polygon) => !isEnclave(polygon))
        .map((polygon) => polygon.slice(0, 1)),
    },
  }))
}
