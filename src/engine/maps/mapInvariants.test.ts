import { describe, expect, it } from 'vitest'
import type { Continent, GameMap, Mission, Territory } from '../types'
import { MAPS } from './index'
import { mapInvariants } from './mapInvariants'

type TerritorySpec = [id: string, continent: string, neighbors: string[]]

/** A small hand-made map: two continents of two territories, linked in a line a–b–c–d. */
function testMap(
  territorySpecs: TerritorySpec[] = [
    ['a', 'north', ['b']],
    ['b', 'north', ['a', 'c']],
    ['c', 'south', ['b', 'd']],
    ['d', 'south', ['c']],
  ],
  continentSpecs: [id: string, bonus: number][] = [
    ['north', 2],
    ['south', 3],
  ],
  continentMissions: Mission[] = [{ kind: 'continents', required: ['north', 'south'], extraContinents: 0 }],
): GameMap {
  const territories: Record<string, Territory> = {}
  for (const [id, continent, neighbors] of territorySpecs) {
    territories[id] = { id, name: id.toUpperCase(), continent, neighbors }
  }
  const continents: Record<string, Continent> = {}
  for (const [id, bonus] of continentSpecs) {
    continents[id] = {
      id,
      name: id,
      nameWithArticle: `le ${id}`,
      bonus,
      territories: territorySpecs.filter(([, continent]) => continent === id).map(([territory]) => territory),
    }
  }
  return {
    id: 'classic',
    territoryIds: territorySpecs.map(([id]) => id),
    continentIds: continentSpecs.map(([id]) => id),
    territories,
    continents,
    continentTerm: { singular: 'région', feminine: true },
    continentMissions,
  }
}

describe('map invariants', () => {
  it.each(Object.values(MAPS).map((map) => [map.id, map] as const))('holds on the %s map', (_, map) => {
    expect(mapInvariants(map)).toEqual([])
  })

  it('holds on the hand-made test map', () => {
    expect(mapInvariants(testMap())).toEqual([])
  })

  it('reports a duplicate identifier', () => {
    const map = testMap()
    map.territoryIds.push('a')
    expect(mapInvariants(map).join('\n')).toMatch(/a/)
    expect(mapInvariants(map).some((violation) => violation.includes('double'))).toBe(true)
  })

  it('reports a territory identifier shared with a continent', () => {
    const map = testMap()
    map.continentIds.push('a')
    map.continents.a = { id: 'a', name: 'a', nameWithArticle: 'le a', bonus: 1, territories: [] }
    expect(mapInvariants(map).some((violation) => violation.includes('double'))).toBe(true)
  })

  it('reports a territory without continent', () => {
    const map = testMap([
      ['a', 'north', ['b']],
      ['b', 'north', ['a', 'c']],
      ['c', 'south', ['b', 'd']],
      ['d', 'nowhere', ['c']],
    ])
    expect(mapInvariants(map)).toContainEqual(expect.stringContaining('d'))
    expect(mapInvariants(map).some((violation) => violation.includes('continent'))).toBe(true)
  })

  it('reports a territory listed in two continents', () => {
    const map = testMap()
    map.continents.south?.territories.push('a')
    expect(mapInvariants(map)).toContainEqual(expect.stringContaining('a'))
  })

  it('reports an empty continent', () => {
    const map = testMap(undefined, [
      ['north', 2],
      ['south', 3],
      ['east', 1],
    ])
    expect(mapInvariants(map)).toContainEqual(expect.stringContaining('east'))
  })

  it('reports a continent without positive bonus', () => {
    const map = testMap(undefined, [
      ['north', 0],
      ['south', 3],
    ])
    expect(mapInvariants(map)).toContainEqual(expect.stringContaining('north'))
  })

  it('reports an asymmetric adjacency', () => {
    const map = testMap([
      ['a', 'north', ['b', 'c']],
      ['b', 'north', ['a', 'c']],
      ['c', 'south', ['b', 'd']],
      ['d', 'south', ['c']],
    ])
    expect(mapInvariants(map)).toContainEqual(expect.stringMatching(/a.*c|c.*a/))
  })

  it('reports a self loop', () => {
    const map = testMap([
      ['a', 'north', ['a', 'b']],
      ['b', 'north', ['a', 'c']],
      ['c', 'south', ['b', 'd']],
      ['d', 'south', ['c']],
    ])
    expect(mapInvariants(map)).toContainEqual(expect.stringContaining('a'))
  })

  it('reports a disconnected graph', () => {
    const map = testMap([
      ['a', 'north', ['b']],
      ['b', 'north', ['a']],
      ['c', 'south', ['d']],
      ['d', 'south', ['c']],
    ])
    expect(mapInvariants(map).some((violation) => violation.includes('connexe'))).toBe(true)
  })

  it('names the missing continent of a mission', () => {
    const map = testMap(undefined, undefined, [{ kind: 'continents', required: ['north', 'atlantis'], extraContinents: 0 }])
    expect(mapInvariants(map)).toEqual([expect.stringContaining('atlantis')])
  })
})
