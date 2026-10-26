import { Shape } from 'three'
import type { TerritoryId } from '../../engine'
import { parsePathData, type SubPath } from './pathData'
import type { MapPoint } from './polygon'

/** One territory of the board: its extrudable shapes and their flattened outlines, in world units. */
export type TerritoryGeometry = {
  id: TerritoryId
  shapes: Shape[]
  outlines: MapPoint[][]
}

/** The outline of one territory in the SVG data of a map. */
export type RawTerritory = {
  id: TerritoryId
  d: string
}

/** The territory outlines of a map, as drawn in its SVG view box. */
export type RawTerritories = {
  viewBox: number[]
  territories: RawTerritory[]
}

/** Width and depth (north to south) of a board, in world units. */
export type WorldSize = {
  width: number
  depth: number
}

/** Converts SVG map coordinates to the world plane. */
export type SvgToWorld = (x: number, y: number) => MapPoint

const CURVE_SEGMENTS = 8

/** Width of every board in world units. */
export const MAP_WORLD_WIDTH = 100

function viewBoxOf(viewBox: readonly number[]): [number, number, number, number] {
  const [minX = 0, minY = 0, width = 1, height = 1] = viewBox
  return [minX, minY, width, height]
}

/** Size of the board drawn in `viewBox`: 100 units wide, as deep as the view box ratio makes it. */
export function worldSize(viewBox: readonly number[]): WorldSize {
  const [, , width, height] = viewBoxOf(viewBox)
  return { width: MAP_WORLD_WIDTH, depth: (height * MAP_WORLD_WIDTH) / width }
}

/** The conversion of SVG coordinates of `viewBox` to the world plane, centered on the origin, SVG y becoming world z. */
export function svgProjection(viewBox: readonly number[]): SvgToWorld {
  const [minX, minY, width] = viewBoxOf(viewBox)
  const { depth } = worldSize(viewBox)
  const scale = MAP_WORLD_WIDTH / width
  return (x, y) => ({
    x: (x - minX) * scale - MAP_WORLD_WIDTH / 2,
    z: (y - minY) * scale - depth / 2,
  })
}

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function toShape(subPath: SubPath, svgToWorld: SvgToWorld): Shape {
  const shape = new Shape()
  for (const command of subPath) {
    const end = svgToWorld(command.x, command.y)
    if (command.type === 'M') {
      shape.moveTo(end.x, -end.z)
    } else if (command.type === 'L') {
      shape.lineTo(end.x, -end.z)
    } else {
      const c1 = svgToWorld(command.x1, command.y1)
      const c2 = svgToWorld(command.x2, command.y2)
      shape.bezierCurveTo(c1.x, -c1.z, c2.x, -c2.z, end.x, -end.z)
    }
  }
  shape.closePath()
  return shape
}

function toOutline(subPath: SubPath, svgToWorld: SvgToWorld): MapPoint[] {
  const outline: MapPoint[] = []
  let previous = { x: 0, y: 0 }
  for (const command of subPath) {
    if (command.type === 'C') {
      for (let step = 1; step <= CURVE_SEGMENTS; step++) {
        const t = step / CURVE_SEGMENTS
        outline.push(
          svgToWorld(
            cubicPoint(previous.x, command.x1, command.x2, command.x, t),
            cubicPoint(previous.y, command.y1, command.y2, command.y, t),
          ),
        )
      }
    } else {
      outline.push(svgToWorld(command.x, command.y))
    }
    previous = { x: command.x, y: command.y }
  }
  return outline
}

/** Shapes and outlines of the territories of a map, keyed by engine territory id. */
export function buildMapGeometry(
  territories: readonly RawTerritory[],
  svgToWorld: SvgToWorld,
): Record<TerritoryId, TerritoryGeometry> {
  return Object.fromEntries(
    territories.map(({ id, d }) => {
      const subPaths = parsePathData(d)
      return [
        id,
        {
          id,
          shapes: subPaths.map((subPath) => toShape(subPath, svgToWorld)),
          outlines: subPaths.map((subPath) => toOutline(subPath, svgToWorld)),
        },
      ]
    }),
  )
}
