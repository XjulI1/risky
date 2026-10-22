import { BufferGeometry, Group, LineBasicMaterial, LineLoop, Vector3, type Shape } from 'three'
import { BORDER_ABOVE_TOP, TILE_HEIGHT } from './boardLayout'

const BORDER_CURVE_SEGMENTS = 6

const borderMaterial = new LineBasicMaterial({ color: '#10161f', transparent: true, opacity: 0.45 })

/** Outline of each piece of a territory, drawn on top of its tile in a color shared by every territory. */
export function createTerritoryBorders(shapes: Shape[]): Group {
  const group = new Group()
  for (const shape of shapes) {
    const points = shape
      .getPoints(BORDER_CURVE_SEGMENTS)
      .map((point) => new Vector3(point.x, point.y, TILE_HEIGHT + BORDER_ABOVE_TOP))
    group.add(new LineLoop(new BufferGeometry().setFromPoints(points), borderMaterial))
  }
  return group
}

/** Frees the geometries of a border group; the shared material stays alive. */
export function disposeTerritoryBorders(borders: Group): void {
  borders.children.forEach((child) => {
    if (child instanceof LineLoop) {
      child.geometry.dispose()
    }
  })
}
