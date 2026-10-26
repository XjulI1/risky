import { describe, expect, it } from 'vitest'
import { classicMap } from './maps/classic'
import { CONQUER_24_TERRITORIES, generalMissions, missionDeck, missionProgress, missionText } from './missions'
import { assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { ContinentId, GameMap, GameState, Mission } from './types'

const GENERAL_MISSIONS = generalMissions(classicMap)

const players = [
  { id: 'p1', name: 'Alice' },
  { id: 'p2', name: 'Bob' },
  { id: 'p3', name: 'Carol' },
]

/** A test map whose continents are « régions », a feminine word. */
const regionMap: GameMap = {
  ...classicMap,
  continents: {
    ...classicMap.continents,
    europe: { ...(classicMap.continents.europe as GameMap['continents'][string]), nameWithArticle: 'la Bretagne' },
    asia: { ...(classicMap.continents.asia as GameMap['continents'][string]), nameWithArticle: 'la Corse' },
  },
  continentTerm: { singular: 'région', feminine: true },
  continentMissions: [
    { kind: 'continents', required: ['europe'], extraContinents: 1 },
    { kind: 'continents', required: ['europe', 'asia'], extraContinents: 0 },
  ],
}

function territoriesOf(continent: ContinentId): string[] {
  return classicMap.continents[continent]?.territories ?? []
}

function board(): GameState {
  return giveAllTerritoriesTo(createTestGame(3), 'p2')
}

describe('mission deck', () => {
  it('holds the 8 general missions, in the order of the rules', () => {
    expect(generalMissions(classicMap).map((mission) => missionText(mission, players, classicMap))).toEqual([
      "Conquérir l'Amérique du Nord et l'Afrique",
      "Conquérir l'Amérique du Nord et l'Océanie",
      "Conquérir l'Asie et l'Amérique du Sud",
      "Conquérir l'Asie et l'Afrique",
      "Conquérir l'Europe, l'Amérique du Sud et un troisième continent au choix",
      "Conquérir l'Europe, l'Océanie et un troisième continent au choix",
      'Conquérir 24 territoires',
      'Occuper 18 territoires avec au moins 2 armées sur chacun',
    ])
  })

  it('adds one elimination mission per player of the game', () => {
    const deck = missionDeck(classicMap, ['p1', 'p2', 'p3', 'p4'])
    expect(deck).toHaveLength(12)
    expect(deck.slice(8)).toEqual([
      { kind: 'eliminate', target: 'p1' },
      { kind: 'eliminate', target: 'p2' },
      { kind: 'eliminate', target: 'p3' },
      { kind: 'eliminate', target: 'p4' },
    ])
  })

  it('starts with the general missions of the given map', () => {
    expect(missionDeck(regionMap, ['p1']).slice(0, 3)).toEqual([...regionMap.continentMissions, CONQUER_24_TERRITORIES])
  })

  it('words the missions of a map with feminine continents', () => {
    expect(generalMissions(regionMap).map((mission) => missionText(mission, players, regionMap)).slice(0, 2)).toEqual([
      'Conquérir la Bretagne et une troisième région au choix',
      'Conquérir la Bretagne et la Corse',
    ])
  })

  it('names the target of an elimination mission', () => {
    expect(missionText({ kind: 'eliminate', target: 'p3' }, players, classicMap)).toBe('Éliminer Carol')
  })
})

describe('missionProgress of a continent mission', () => {
  const northAmericaAndAfrica = GENERAL_MISSIONS[0] as Mission
  const europeSouthAmericaAndOne = GENERAL_MISSIONS[4] as Mission

  it('counts the territories held in each required continent', () => {
    const state = board()
    assignTerritories(state, 'p1', territoriesOf('northAmerica').slice(0, 7))
    assignTerritories(state, 'p1', territoriesOf('africa').slice(0, 4))
    expect(missionProgress(northAmericaAndAfrica, state, 'p1')).toEqual({
      kind: 'continents',
      required: [
        { continent: 'northAmerica', held: 7, total: 9 },
        { continent: 'africa', held: 4, total: 6 },
      ],
      extraContinents: 0,
      extraHeld: 0,
      accomplished: false,
    })
  })

  it('is accomplished once every required continent is held', () => {
    const state = board()
    assignTerritories(state, 'p1', [...territoriesOf('northAmerica'), ...territoriesOf('africa')])
    expect(missionProgress(northAmericaAndAfrica, state, 'p1').accomplished).toBe(true)
  })

  it('is not accomplished without the continent of choice', () => {
    const state = board()
    assignTerritories(state, 'p1', [...territoriesOf('europe'), ...territoriesOf('southAmerica')])
    expect(missionProgress(europeSouthAmericaAndOne, state, 'p1')).toMatchObject({
      extraContinents: 1,
      extraHeld: 0,
      accomplished: false,
    })
  })

  it('is accomplished with any third continent held', () => {
    const state = board()
    assignTerritories(state, 'p1', [...territoriesOf('europe'), ...territoriesOf('southAmerica'), ...territoriesOf('australia')])
    expect(missionProgress(europeSouthAmericaAndOne, state, 'p1')).toMatchObject({ extraHeld: 1, accomplished: true })
  })
})

describe('missionProgress of a territory mission', () => {
  const eighteenWithTwo = GENERAL_MISSIONS[7] as Mission

  it('is accomplished from 24 territories', () => {
    const state = board()
    const territories = classicMap.territoryIds
    assignTerritories(state, 'p1', territories.slice(0, 23))
    expect(missionProgress(CONQUER_24_TERRITORIES, state, 'p1')).toEqual({
      kind: 'territories',
      count: 24,
      minArmies: 1,
      owned: 23,
      qualifying: 23,
      accomplished: false,
    })
    assignTerritories(state, 'p1', territories.slice(0, 24))
    expect(missionProgress(CONQUER_24_TERRITORIES, state, 'p1').accomplished).toBe(true)
  })

  it('counts only the territories holding at least 2 armies for the 18-territory mission', () => {
    const state = board()
    const territories = classicMap.territoryIds
    assignTerritories(state, 'p1', territories.slice(0, 20), 1)
    assignTerritories(state, 'p1', territories.slice(0, 17), 2)
    expect(missionProgress(eighteenWithTwo, state, 'p1')).toMatchObject({ owned: 20, qualifying: 17, accomplished: false })
    assignTerritories(state, 'p1', territories.slice(17, 18), 3)
    expect(missionProgress(eighteenWithTwo, state, 'p1')).toMatchObject({ owned: 20, qualifying: 18, accomplished: true })
  })
})

describe('missionProgress of an elimination mission', () => {
  const eliminateCarol: Mission = { kind: 'eliminate', target: 'p3' }

  it('counts the territories the target still holds', () => {
    const state = board()
    assignTerritories(state, 'p3', ['brazil', 'peru'])
    expect(missionProgress(eliminateCarol, state, 'p1')).toEqual({
      kind: 'eliminate',
      target: 'p3',
      remaining: 2,
      accomplished: false,
    })
  })

  it('is accomplished once the target is eliminated', () => {
    const state = board()
    state.players = state.players.map((player) => (player.id === 'p3' ? { ...player, eliminated: true } : player))
    expect(missionProgress(eliminateCarol, state, 'p1')).toMatchObject({ remaining: 0, accomplished: true })
  })
})
