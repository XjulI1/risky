import { describe, expect, it } from 'vitest'
import { missionText } from '../missions'
import { classicMap } from './classic'
import { isMapId, mapById, MAPS } from './index'

describe('map catalog', () => {
  it('gives the classic map for its identifier', () => {
    expect(mapById('classic')).toBe(classicMap)
    expect(MAPS.classic).toBe(classicMap)
    expect(classicMap.id).toBe('classic')
    expect(classicMap.territoryIds).toHaveLength(42)
    expect(classicMap.continentIds).toHaveLength(6)
  })

  it('knows its identifiers only', () => {
    expect(isMapId('classic')).toBe(true)
    expect(isMapId('atlantide')).toBe(false)
    expect(isMapId(undefined)).toBe(false)
    expect(isMapId('toString')).toBe(false)
  })

  it('names North America with its article', () => {
    expect(classicMap.continents.northAmerica?.nameWithArticle).toBe("l'Amérique du Nord")
  })

  it('calls its continents « continent », a masculine word', () => {
    expect(classicMap.continentTerm).toEqual({ singular: 'continent', feminine: false })
  })

  it('has the six continent missions of the rules', () => {
    expect(classicMap.continentMissions.map((mission) => missionText(mission, [], classicMap))).toEqual([
      "Conquérir l'Amérique du Nord et l'Afrique",
      "Conquérir l'Amérique du Nord et l'Océanie",
      "Conquérir l'Asie et l'Amérique du Sud",
      "Conquérir l'Asie et l'Afrique",
      "Conquérir l'Europe, l'Amérique du Sud et un troisième continent au choix",
      "Conquérir l'Europe, l'Océanie et un troisième continent au choix",
    ])
  })
})
