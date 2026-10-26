type Position = number[]

/** A GeoJSON polygon or multi-polygon, in projected coordinates (y pointing north). */
export type AreaGeometry =
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] }

/** The SVG view box of a map and the conversion of projected coordinates into it. */
export type SvgFrame = {
  viewBox: number[]
  toSvg: (position: Position) => [number, number]
}

const round = (value: number) => Math.round(value * 10) / 10

/**
 * Fits the bounding box `[minX, minY, maxX, maxY]` into a view box `width` units wide, `margin` units of sea
 * on every side; the y axis is flipped and the coordinates rounded to a tenth.
 */
export function svgFrame(bbox: readonly number[], width: number, margin = 0): SvgFrame {
  const [minX = 0, minY = 0, maxX = 1, maxY = 1] = bbox
  const scale = (width - 2 * margin) / (maxX - minX)
  return {
    viewBox: [0, 0, width, round((maxY - minY) * scale + 2 * margin)],
    toSvg: ([x = 0, y = 0]) => [round(margin + (x - minX) * scale), round(margin + (maxY - y) * scale)],
  }
}

function ringPath(ring: Position[], frame: SvgFrame): string {
  const points = ring.map(frame.toSvg)
  const [first, ...rest] = points
  const last = points.at(-1)
  const open = last !== undefined && first !== undefined && last[0] === first[0] && last[1] === first[1] ? rest.slice(0, -1) : rest
  return [`M ${first?.join(',')}`, ...open.map((point) => `L ${point.join(',')}`), 'Z'].join(' ')
}

/** SVG path data of the territory `id`: one closed sub-path per polygon; a polygon with a hole is refused. */
export function geometryToPath(id: string, geometry: AreaGeometry, frame: SvgFrame): string {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons
    .map((rings) => {
      const [outer] = rings
      if (rings.length > 1 || outer === undefined) {
        throw new Error(`Le territoire ${id} a un trou ou un polygone vide : le plateau ne peut pas l'extruder`)
      }
      return ringPath(outer, frame)
    })
    .join(' ')
}
