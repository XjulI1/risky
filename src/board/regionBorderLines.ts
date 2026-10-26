import { Group } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { BORDER_ABOVE_TOP, TILE_HEIGHT } from './boardLayout'
import type { MapPoint } from './geometry/polygon'

/** Width of a region limit in pixels: about three times a territory border, which WebGL draws 1 pixel wide. */
const REGION_LINE_WIDTH = 3

/** Shared by every territory: the color of the territory borders, but opaque and thick. */
const regionLineMaterial = new LineMaterial({ color: '#10161f', linewidth: REGION_LINE_WIDTH, transparent: true, opacity: 0.85 })

/** Sizes the region limits for a canvas of `width` × `height` CSS pixels. */
export function setRegionLineResolution(width: number, height: number): void {
  regionLineMaterial.resolution.set(width, height)
}

/**
 * The stretches of region limit along one territory, drawn on top of its tile in the frame of its shapes
 * (x, -z), so that they rise with the tile when it is highlighted.
 */
export function createRegionBorderLines(lines: MapPoint[][]): Group {
  const group = new Group()
  for (const line of lines) {
    const positions = line.flatMap((point) => [point.x, -point.z, TILE_HEIGHT + 2 * BORDER_ABOVE_TOP])
    group.add(new Line2(new LineGeometry().setPositions(positions), regionLineMaterial))
  }
  return group
}

/** Frees the geometries of a region limit group; the shared material stays alive. */
export function disposeRegionBorderLines(lines: Group): void {
  lines.children.forEach((child) => {
    if (child instanceof Line2) {
      child.geometry.dispose()
    }
  })
}
