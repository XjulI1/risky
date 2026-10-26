import { describe, expect, it } from 'vitest'
import classicTerritories from '../../../data/maps/classic/territories.json'
import { mapById, MAPS } from '../../engine'
import { BOARD_MAP_IDS, boardMapFor } from './index'

const VIEW_BOXES: Record<string, number[]> = { classic: classicTerritories.viewBox }

describe('board map catalog', () => {
  it('draws every map of the engine catalog', () => {
    expect([...BOARD_MAP_IDS].sort()).toEqual(Object.keys(MAPS).sort())
  })
})

describe.each(BOARD_MAP_IDS)('board of the %s map', (mapId) => {
  const board = boardMapFor(mapId)
  const map = mapById(mapId)

  it('has exactly one shape per engine territory and no other', () => {
    expect(Object.keys(board.geometry).sort()).toEqual([...map.territoryIds].sort())
  })

  it('places one label per continent', () => {
    expect(Object.keys(board.continentLabels).sort()).toEqual([...map.continentIds].sort())
  })

  it('is 100 units wide and as deep as its view box ratio', () => {
    const [, , width = 1, height = 1] = VIEW_BOXES[mapId] ?? []
    expect(board.size.width).toBe(100)
    expect(board.size.depth).toBeCloseTo((height * 100) / width)
  })

  it('is computed once', () => {
    expect(boardMapFor(mapId)).toBe(board)
  })
})
