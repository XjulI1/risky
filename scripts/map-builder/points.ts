import { poleOfInaccessibility, polygonArea, type MapPoint } from '../../src/board/geometry/polygon.ts'

type Position = number[]

const toPoint = ([x = 0, y = 0]: Position): MapPoint => ({ x, z: y })

/** The label point of a territory: the pole of inaccessibility of its largest ring, as the board places pawns. */
export function labelPoint(rings: readonly Position[][]): [number, number] {
  const outlines = rings.map((ring) => ring.map(toPoint))
  const largest = outlines.reduce<MapPoint[]>((best, outline) => (polygonArea(outline) > polygonArea(best) ? outline : best), [])
  const { x, z } = poleOfInaccessibility(largest)
  return [x, z]
}

/** The nearest points between the outlines of two territories, and their distance. */
export type ClosestPoints = {
  pa: [number, number]
  pb: [number, number]
  dist: number
}

function projection(point: Position, from: Position, to: Position): [number, number] {
  const [px = 0, py = 0] = point
  const [ax = 0, ay = 0] = from
  const [bx = 0, by = 0] = to
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
  return [ax + t * dx, ay + t * dy]
}

function segments(ring: Position[]): [Position, Position][] {
  return ring.map((point, index) => [point, ring[(index + 1) % ring.length] ?? point])
}

/** For every vertex of `from`, the nearest point of `to`; the overall nearest pair, `from` side first. */
function nearestFrom(from: readonly Position[][], to: readonly Position[][]): ClosestPoints {
  let best: ClosestPoints = { pa: [0, 0], pb: [0, 0], dist: Infinity }
  const edges = to.flatMap(segments)
  for (const vertex of from.flat()) {
    for (const [start, end] of edges) {
      const target = projection(vertex, start, end)
      const dist = Math.hypot(target[0] - (vertex[0] ?? 0), target[1] - (vertex[1] ?? 0))
      if (dist < best.dist) {
        best = { pa: [vertex[0] ?? 0, vertex[1] ?? 0], pb: target, dist }
      }
    }
  }
  return best
}

/** The closest pair of points between the rings of `a` and those of `b`: vertex to edge, in both directions. */
export function closestPoints(a: readonly Position[][], b: readonly Position[][]): ClosestPoints {
  const fromA = nearestFrom(a, b)
  const fromB = nearestFrom(b, a)
  return fromB.dist < fromA.dist ? { pa: fromB.pb, pb: fromB.pa, dist: fromB.dist } : fromA
}
