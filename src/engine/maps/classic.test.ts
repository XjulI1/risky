import { describe, expect, it } from 'vitest'
import board from '../../../data/maps/classic/board.json'
import geometry from '../../../data/maps/classic/territories.json'
import { areAdjacent, classicMap } from './classic'

const expectedContinents = {
  northAmerica: { name: 'Amérique du Nord', size: 9, bonus: 5 },
  southAmerica: { name: 'Amérique du Sud', size: 4, bonus: 2 },
  europe: { name: 'Europe', size: 7, bonus: 5 },
  africa: { name: 'Afrique', size: 6, bonus: 3 },
  asia: { name: 'Asie', size: 12, bonus: 7 },
  australia: { name: 'Océanie', size: 4, bonus: 2 },
}

describe('classic map composition', () => {
  it('has 42 territories and 6 continents', () => {
    expect(classicMap.territoryIds).toHaveLength(42)
    expect(classicMap.continentIds).toHaveLength(6)
  })

  it('matches the expected continent sizes, bonuses and French names', () => {
    for (const [id, expected] of Object.entries(expectedContinents)) {
      const continent = classicMap.continents[id]
      expect(continent?.territories).toHaveLength(expected.size)
      expect(continent?.bonus).toBe(expected.bonus)
      expect(continent?.name).toBe(expected.name)
    }
  })

  it('uses the same territory identifiers in board.json and territories.json', () => {
    const boardIds = Object.keys(board.adjacency).sort()
    const geometryIds = geometry.territories.map((t) => t.id).sort()
    expect(geometryIds).toEqual(boardIds)
    expect(Object.keys(board.names).sort()).toEqual(boardIds)
  })

  it('gives every territory a French name', () => {
    for (const id of classicMap.territoryIds) {
      expect(classicMap.territories[id]?.name).toMatch(/\S/)
    }
    expect(classicMap.territories.egypt?.name).toBe('Égypte')
    expect(classicMap.territories.uk?.name).toBe('Grande-Bretagne')
  })
})

describe('classic map adjacency', () => {
  it('has the 83 links of the classic board', () => {
    const degreeSum = classicMap.territoryIds.reduce(
      (sum, id) => sum + (classicMap.territories[id]?.neighbors.length ?? 0),
      0,
    )
    expect(degreeSum / 2).toBe(83)
  })

  it.each([
    ['alaska', 'kamchatka'],
    ['brazil', 'north_africa'],
    ['siam', 'indonesia'],
  ])('links %s and %s across the sea', (a, b) => {
    expect(areAdjacent(classicMap, a, b)).toBe(true)
    expect(areAdjacent(classicMap, b, a)).toBe(true)
  })

  it('does not link distant territories', () => {
    expect(areAdjacent(classicMap, 'alaska', 'brazil')).toBe(false)
  })
})
