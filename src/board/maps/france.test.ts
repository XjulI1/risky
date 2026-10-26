import { describe, expect, it } from 'vitest'
import { mapById } from '../../engine'
import { PAWN_RADIUS } from '../boardLayout'
import { pointInPolygon, type MapPoint } from '../geometry/polygon'
import { boardMapFor } from './index'

const board = boardMapFor('france')
const map = mapById('france')

/**
 * Room taken at the minimum zoom of a 1024 × 768 window (about 6 pixels per world unit at the top of the map)
 * by a 12-pixel continent label, per character and above and below its center, in world units.
 */
const LABEL_CHAR_WIDTH = 1.6
const LABEL_HALF_HEIGHT = 1.4
/** The army counter stands 2.2 units above a pawn: the tilted camera shows it about 1.5 units north of it. */
const COUNTER_HALF_WIDTH = 1.5
const COUNTER_TOP = 3

function labelText(continent: string): string {
  const region = map.continents[continent]
  return `${region?.name} +${region?.bonus}`
}

/** Whether the label of `continent` covers the pawn or the counter standing at `anchor`. */
function coversPawn(continent: string, label: MapPoint, anchor: MapPoint): boolean {
  const halfWidth = (labelText(continent).length * LABEL_CHAR_WIDTH) / 2
  return (
    Math.abs(anchor.x - label.x) < halfWidth + COUNTER_HALF_WIDTH &&
    anchor.z - COUNTER_TOP < label.z + LABEL_HALF_HEIGHT &&
    label.z - LABEL_HALF_HEIGHT < anchor.z + PAWN_RADIUS
  )
}

function onLand(point: MapPoint): string[] {
  return map.territoryIds.filter((id) => board.geometry[id]?.outlines.some((outline) => pointInPolygon(point, outline)))
}

describe('France region labels', () => {
  it('places one label per region', () => {
    expect(Object.keys(board.continentLabels).sort()).toEqual([...map.continentIds].sort())
  })

  it.each(map.continentIds)('puts the label of the %s region at sea', (region) => {
    const label = board.continentLabels[region] ?? { x: 0, z: 0 }
    expect(onLand(label)).toEqual([])
    expect(Math.abs(label.x)).toBeLessThan(board.size.width / 2)
    expect(Math.abs(label.z)).toBeLessThan(board.size.depth / 2)
  })

  it.each(map.continentIds)('keeps the label of %s clear of every pawn and counter at the minimum zoom', (region) => {
    const label = board.continentLabels[region] ?? { x: 0, z: 0 }
    const covered = map.territoryIds.filter((id) => coversPawn(region, label, board.anchor(id)))
    expect(covered).toEqual([])
  })
})

describe('France region outlines', () => {
  it('has one outline per region and no other', () => {
    expect(Object.keys(board.regionOutlines).sort()).toEqual([...map.continentIds].sort())
  })

  it('draws every outline with at least one closed line', () => {
    for (const lines of Object.values(board.regionOutlines)) {
      expect(lines.length).toBeGreaterThan(0)
      expect(lines.every((line) => line.length >= 3)).toBe(true)
    }
  })

  it('has no outline nor limit on the classic map', () => {
    expect(boardMapFor('classic').regionOutlines).toEqual({})
    expect(boardMapFor('classic').regionBorders).toEqual({})
  })
})

describe('France region limits', () => {
  const key = ({ x, z }: MapPoint) => `${x.toFixed(4)}|${z.toFixed(4)}`
  const pointsOf = (outlines: MapPoint[][] | undefined) => new Set((outlines ?? []).flat().map(key))
  const sharedBorder = (a: string, b: string) => {
    const others = pointsOf(board.geometry[b]?.outlines)
    return [...pointsOf(board.geometry[a]?.outlines)].filter((point) => others.has(point))
  }
  const regionLimit = pointsOf(Object.values(board.regionBorders).flat())

  it('draws the border between Paris and Picardie as a region limit', () => {
    const border = sharedBorder('paris', 'picardie')
    expect(border.length).toBeGreaterThan(2)
    expect(border.filter((point) => regionLimit.has(point)).length).toBeGreaterThan(border.length / 2)
  })

  it('leaves the border between Paris and Brie et Hurepoix to the thin territory borders', () => {
    const border = sharedBorder('paris', 'brie_hurepoix')
    const inner = border.filter((point) => !pointsOf(board.geometry.picardie?.outlines).has(point))
    expect(inner.length).toBeGreaterThan(2)
    expect(inner.filter((point) => regionLimit.has(point)).length).toBeLessThan(3)
  })
})

describe('France region limits along the coast', () => {
  it('leave the coasts out, Corsica having no limit with the mainland', () => {
    const key = ({ x, z }: MapPoint) => `${x}|${z}`
    const limits = new Set(Object.values(board.regionBorders).flat(2).map(key))
    const corsica = [...(board.geometry.haute_corse?.outlines ?? []), ...(board.geometry.corse_du_sud?.outlines ?? [])]
    expect(corsica.flat().filter((point) => limits.has(key(point)))).toEqual([])
  })
})

describe('France region limits on the tiles', () => {
  it('are carried by the territories on both sides, so that a raised tile still shows them', () => {
    expect(board.regionBorders.paris?.length).toBeGreaterThan(0)
    expect(board.regionBorders.picardie?.length).toBeGreaterThan(0)
  })

  it('are not carried by a territory inside its region, away from any limit', () => {
    expect(board.regionBorders.savoie).toBeUndefined()
  })
})

