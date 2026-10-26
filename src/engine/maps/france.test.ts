import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import grouping from '../../../data/maps/france/grouping.json'
import { areAdjacent } from './classic'
import { franceMap } from './france'
import { mapById } from './index'
import { mapInvariants } from './mapInvariants'

const source: { features: { properties: { code: string } }[] } = JSON.parse(
  readFileSync('data/maps/france/source/departements-version-simplifiee.geojson', 'utf8'),
)

const expectedRegions = {
  ile_de_france: { name: 'Île-de-France', nameWithArticle: "l'Île-de-France", size: 2, bonus: 3 },
  nord: { name: 'Nord', nameWithArticle: 'le Nord', size: 5, bonus: 3 },
  ouest: { name: 'Ouest', nameWithArticle: "l'Ouest", size: 5, bonus: 3 },
  centre: { name: 'Centre', nameWithArticle: 'le Centre', size: 6, bonus: 4 },
  sud_ouest: { name: 'Sud-Ouest', nameWithArticle: 'le Sud-Ouest', size: 7, bonus: 4 },
  est: { name: 'Est', nameWithArticle: "l'Est", size: 7, bonus: 4 },
  sud_est: { name: 'Sud-Est', nameWithArticle: 'le Sud-Est', size: 10, bonus: 5 },
}

describe('France map composition', () => {
  it('is in the catalog under « france »', () => {
    expect(mapById('france')).toBe(franceMap)
    expect(franceMap.id).toBe('france')
  })

  it('has 42 territories and 7 regions, and keeps the invariants of every map', () => {
    expect(franceMap.territoryIds).toHaveLength(42)
    expect(franceMap.continentIds).toHaveLength(7)
    expect(mapInvariants(franceMap)).toEqual([])
  })

  it('matches the expected region sizes, names and bonuses', () => {
    for (const [id, expected] of Object.entries(expectedRegions)) {
      const region = franceMap.continents[id]
      expect(region?.territories, id).toHaveLength(expected.size)
      expect(region?.name).toBe(expected.name)
      expect(region?.nameWithArticle).toBe(expected.nameWithArticle)
      expect(region?.bonus).toBe(expected.bonus)
    }
  })

  it('calls its continents « région », a feminine word', () => {
    expect(franceMap.continentTerm).toEqual({ singular: 'région', feminine: true })
  })

  it('gives every territory a French name', () => {
    for (const id of franceMap.territoryIds) {
      expect(franceMap.territories[id]?.name, id).toMatch(/\S/)
    }
    expect(franceMap.territories.brie_hurepoix?.name).toBe('Brie et Hurepoix')
    expect(franceMap.territories.cote_d_azur?.name).toBe("Côte d'Azur")
  })

  it('covers the 96 departments of mainland France, each once', () => {
    const grouped = grouping.territories.flatMap((territory) => territory.departments)
    const departments = source.features.map((feature) => feature.properties.code)
    expect(departments).toHaveLength(96)
    expect([...grouped].sort()).toEqual([...departments].sort())
    expect(grouping.territories.map((territory) => territory.id)).toEqual(franceMap.territoryIds)
  })
})

describe('France map adjacency', () => {
  it.each([
    ['paris', 'brie_hurepoix'],
    ['paris', 'picardie'],
    ['alsace', 'franche_comte'],
    ['haute_corse', 'corse_du_sud'],
    ['haute_corse', 'cote_d_azur'],
    ['corse_du_sud', 'provence'],
  ])('links %s and %s', (a, b) => {
    expect(areAdjacent(franceMap, a, b)).toBe(true)
    expect(areAdjacent(franceMap, b, a)).toBe(true)
  })

  it.each([
    ['flandre', 'paris'],
    ['bretagne_occidentale', 'pays_nantais'],
    ['bretagne_occidentale', 'basse_normandie'],
  ])('does not link %s and %s', (a, b) => {
    expect(areAdjacent(franceMap, a, b)).toBe(false)
  })

  it('links Corsica to Côte d’Azur and Provence only', () => {
    expect([...(franceMap.territories.haute_corse?.neighbors ?? [])].sort()).toEqual(['corse_du_sud', 'cote_d_azur'])
    expect([...(franceMap.territories.corse_du_sud?.neighbors ?? [])].sort()).toEqual(['haute_corse', 'provence'])
  })
})
