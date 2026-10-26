import type { MapPoint } from './polygon'

const pointKey = ({ x, z }: MapPoint) => `${x},${z}`
const edgeKey = (a: MapPoint, b: MapPoint) => [pointKey(a), pointKey(b)].sort().join('|')

function edgesOf(line: MapPoint[]): [MapPoint, MapPoint][] {
  return line.flatMap((point, index) => {
    const next = line[(index + 1) % line.length]
    return next === undefined ? [] : [[point, next] as [MapPoint, MapPoint]]
  })
}

/** The edges two region outlines share: the limits between regions, coasts left out. */
export function sharedEdges(outlines: Record<string, MapPoint[][]>): Set<string> {
  const owners = new Map<string, number>()
  for (const lines of Object.values(outlines)) {
    for (const edge of new Set(lines.flatMap(edgesOf).map(([a, b]) => edgeKey(a, b)))) {
      owners.set(edge, (owners.get(edge) ?? 0) + 1)
    }
  }
  return new Set([...owners].filter(([, count]) => count > 1).map(([edge]) => edge))
}

/** The stretches of the closed `lines` made of consecutive edges among `edges`, as open lines. */
export function edgeRuns(lines: MapPoint[][], edges: ReadonlySet<string>): MapPoint[][] {
  return lines.flatMap((line) => {
    const kept = edgesOf(line).map(([a, b]) => edges.has(edgeKey(a, b)))
    // Start just after an edge left out, so that no stretch is cut at the start of the outline.
    const firstGap = kept.indexOf(false)
    const start = firstGap === -1 ? 0 : firstGap + 1
    const runs: MapPoint[][] = []
    let current: MapPoint[] = []
    for (let step = 0; step < line.length; step++) {
      const index = (start + step) % line.length
      const from = line[index]
      const to = line[(index + 1) % line.length]
      if (kept[index] === true && from !== undefined && to !== undefined) {
        current = current.length === 0 ? [from, to] : [...current, to]
      } else if (current.length > 0) {
        runs.push(current)
        current = []
      }
    }
    return current.length > 0 ? [...runs, current] : runs
  })
}
