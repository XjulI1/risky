/** A point on the map plane, in world units. */
export type MapPoint = {
  x: number
  z: number
}

/** Even-odd test of whether `point` lies inside the closed `polygon`. */
export function pointInPolygon(point: MapPoint, polygon: MapPoint[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i] as MapPoint
    const b = polygon[j] as MapPoint
    const crosses = a.z > point.z !== b.z > point.z
    if (crosses && point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/** Unsigned area of a closed polygon. */
export function polygonArea(polygon: MapPoint[]): number {
  let doubled = 0
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i] as MapPoint
    const b = polygon[j] as MapPoint
    doubled += b.x * a.z - a.x * b.z
  }
  return Math.abs(doubled) / 2
}

function distanceToSegment(point: MapPoint, a: MapPoint, b: MapPoint): number {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const lengthSquared = dx * dx + dz * dz
  const t =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lengthSquared))
  return Math.hypot(point.x - (a.x + t * dx), point.z - (a.z + t * dz))
}

/** Shortest distance from `point` to the outline of `polygon`, from inside or outside. */
export function distanceToPolygon(point: MapPoint, polygon: MapPoint[]): number {
  let shortest = Infinity
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    shortest = Math.min(shortest, distanceToSegment(point, polygon[j] as MapPoint, polygon[i] as MapPoint))
  }
  return shortest
}

const POLE_PRECISION = 0.01

type Cell = {
  center: MapPoint
  half: number
  clearance: number
  potential: number
}

function signedClearance(point: MapPoint, polygon: MapPoint[]): number {
  const distance = distanceToPolygon(point, polygon)
  return pointInPolygon(point, polygon) ? distance : -distance
}

function cell(center: MapPoint, half: number, polygon: MapPoint[]): Cell {
  const clearance = signedClearance(center, polygon)
  return { center, half, clearance, potential: clearance + half * Math.SQRT2 }
}

function pushCell(heap: Cell[], item: Cell): void {
  heap.push(item)
  let index = heap.length - 1
  while (index > 0) {
    const parent = (index - 1) >> 1
    if ((heap[parent] as Cell).potential >= item.potential) {
      break
    }
    heap[index] = heap[parent] as Cell
    index = parent
  }
  heap[index] = item
}

function popCell(heap: Cell[]): Cell | undefined {
  const top = heap[0]
  const last = heap.pop()
  if (top === undefined || last === undefined || heap.length === 0) {
    return top
  }
  let index = 0
  for (;;) {
    const left = 2 * index + 1
    const right = left + 1
    let largest = index
    const largestPotential = () => (largest === index ? last.potential : (heap[largest] as Cell).potential)
    if (left < heap.length && (heap[left] as Cell).potential > largestPotential()) {
      largest = left
    }
    if (right < heap.length && (heap[right] as Cell).potential > largestPotential()) {
      largest = right
    }
    if (largest === index) {
      break
    }
    heap[index] = heap[largest] as Cell
    index = largest
  }
  heap[index] = last
  return top
}

/** Point inside `polygon` farthest from its outline (pole of inaccessibility, polylabel algorithm). */
export function poleOfInaccessibility(polygon: MapPoint[], precision = POLE_PRECISION): MapPoint {
  const xs = polygon.map((point) => point.x)
  const zs = polygon.map((point) => point.z)
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  const size = Math.min(maxX - minX, maxZ - minZ)
  if (size === 0) {
    return { x: minX, z: minZ }
  }

  const heap: Cell[] = []
  for (let x = minX; x < maxX; x += size) {
    for (let z = minZ; z < maxZ; z += size) {
      pushCell(heap, cell({ x: x + size / 2, z: z + size / 2 }, size / 2, polygon))
    }
  }
  let best = cell({ x: (minX + maxX) / 2, z: (minZ + maxZ) / 2 }, 0, polygon)

  for (let current = popCell(heap); current !== undefined; current = popCell(heap)) {
    if (current.clearance > best.clearance) {
      best = current
    }
    if (current.potential - best.clearance <= precision) {
      continue
    }
    const half = current.half / 2
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      pushCell(heap, cell({ x: current.center.x + dx * half, z: current.center.z + dz * half }, half, polygon))
    }
  }
  return best.center
}
