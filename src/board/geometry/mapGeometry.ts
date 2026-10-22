import { Shape } from 'three'
import geometry from '../../../data/maps/classic/territories.json'
import type { TerritoryId } from '../../engine'
import { parsePathData, type SubPath } from './pathData'
import type { MapPoint } from './polygon'

/** One territory of the board: its extrudable shapes and their flattened outlines, in world units. */
export type TerritoryGeometry = {
  id: TerritoryId
  shapes: Shape[]
  outlines: MapPoint[][]
}

const [VIEW_MIN_X, VIEW_MIN_Y, VIEW_WIDTH, VIEW_HEIGHT] = geometry.viewBox as [number, number, number, number]
const CURVE_SEGMENTS = 8

/** Width of the board in world units. */
export const MAP_WORLD_WIDTH = 100

/** Depth (north to south) of the board in world units. */
export const MAP_WORLD_DEPTH = (VIEW_HEIGHT * MAP_WORLD_WIDTH) / VIEW_WIDTH

const SCALE = MAP_WORLD_WIDTH / VIEW_WIDTH

/** Converts SVG map coordinates to the world plane, centered on the origin, SVG y becoming world z. */
export function svgToWorld(x: number, y: number): MapPoint {
  return {
    x: (x - VIEW_MIN_X) * SCALE - MAP_WORLD_WIDTH / 2,
    z: (y - VIEW_MIN_Y) * SCALE - MAP_WORLD_DEPTH / 2,
  }
}

function cubicPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

function toShape(subPath: SubPath): Shape {
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

function toOutline(subPath: SubPath): MapPoint[] {
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

function buildMapGeometry(): Record<TerritoryId, TerritoryGeometry> {
  return Object.fromEntries(
    geometry.territories.map(({ id, d }) => {
      const subPaths = parsePathData(d)
      return [id, { id, shapes: subPaths.map(toShape), outlines: subPaths.map(toOutline) }]
    }),
  )
}

/** Shapes and outlines of the 42 territories of the classic board, keyed by engine territory id. */
export const mapGeometry: Record<TerritoryId, TerritoryGeometry> = buildMapGeometry()
