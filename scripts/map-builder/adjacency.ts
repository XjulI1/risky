type Position = number[]

type TopologyGeometry =
  | { type: 'Polygon'; properties: { id: string }; arcs: number[][] }
  | { type: 'MultiPolygon'; properties: { id: string }; arcs: number[][][] }

/** The part of a TopoJSON topology the adjacency needs, in projected metres. */
export type Topology = {
  type: 'Topology'
  transform?: { scale: number[]; translate: number[] }
  arcs: Position[][]
  objects: Record<string, { type: 'GeometryCollection'; geometries: TopologyGeometry[] }>
}

/** The total length of the border two territories share. */
export type SharedBorder = {
  a: string
  b: string
  length: number
}

function decodedArc(topology: Topology, arc: Position[]): Position[] {
  const { transform } = topology
  if (transform === undefined) {
    return arc
  }
  const [scaleX = 1, scaleY = 1] = transform.scale
  const [translateX = 0, translateY = 0] = transform.translate
  let x = 0
  let y = 0
  return arc.map(([dx = 0, dy = 0]) => {
    x += dx
    y += dy
    return [x * scaleX + translateX, y * scaleY + translateY]
  })
}

function arcLength(points: Position[]): number {
  let length = 0
  for (let i = 1; i < points.length; i++) {
    const [x0 = 0, y0 = 0] = points[i - 1] ?? []
    const [x1 = 0, y1 = 0] = points[i] ?? []
    length += Math.hypot(x1 - x0, y1 - y0)
  }
  return length
}

function arcIndexes(geometry: TopologyGeometry): number[] {
  const rings = geometry.type === 'Polygon' ? geometry.arcs : geometry.arcs.flat()
  return rings.flat().map((index) => (index < 0 ? ~index : index))
}

/**
 * The borders shared by the territories of `objectName`, longest first: an arc used by two territories
 * belongs to their common border, and the lengths of all such arcs add up.
 */
export function sharedBorders(topology: Topology, objectName: string): SharedBorder[] {
  const users = new Map<number, Set<string>>()
  for (const geometry of topology.objects[objectName]?.geometries ?? []) {
    for (const index of arcIndexes(geometry)) {
      users.set(index, (users.get(index) ?? new Set()).add(geometry.properties.id))
    }
  }
  const lengths = new Map<string, number>()
  for (const [index, territories] of users) {
    if (territories.size !== 2) {
      continue
    }
    const key = [...territories].sort().join('|')
    lengths.set(key, (lengths.get(key) ?? 0) + arcLength(decodedArc(topology, topology.arcs[index] ?? [])))
  }
  return [...lengths]
    .map(([key, length]) => {
      const [a = '', b = ''] = key.split('|')
      return { a, b, length }
    })
    .sort((x, y) => y.length - x.length || x.a.localeCompare(y.a) || x.b.localeCompare(y.b))
}

/** Neighbors of each territory, in the order of `territoryIds`: those sharing at least `minLength` of border. */
export function territoryAdjacency(
  territoryIds: readonly string[],
  borders: readonly SharedBorder[],
  minLength: number,
): Record<string, string[]> {
  const linked = new Set(borders.filter((border) => border.length >= minLength).flatMap(({ a, b }) => [`${a}|${b}`, `${b}|${a}`]))
  return Object.fromEntries(
    territoryIds.map((id) => [id, territoryIds.filter((other) => other !== id && linked.has(`${id}|${other}`))]),
  )
}

/** `adjacency` with every sea link added in both directions. */
export function withSeaLinks(
  adjacency: Record<string, string[]>,
  links: readonly (readonly [string, string])[],
): Record<string, string[]> {
  const result = Object.fromEntries(Object.entries(adjacency).map(([id, neighbors]) => [id, [...neighbors]]))
  for (const [a, b] of links) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const neighbors = result[from]
      if (neighbors === undefined || result[to] === undefined) {
        throw new Error(`Liaison maritime vers un territoire inconnu : ${from === a ? b : a}`)
      }
      if (!neighbors.includes(to)) {
        neighbors.push(to)
      }
    }
  }
  return result
}
