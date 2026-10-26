import board from '../../../data/maps/france/board.json'
import type { Continent, ContinentId, GameMap, Mission, Territory, TerritoryId } from '../types'

const TERRITORY_NAMES: Record<TerritoryId, string> = {
  paris: 'Paris',
  brie_hurepoix: 'Brie et Hurepoix',
  flandre: 'Flandre',
  artois: 'Artois',
  picardie: 'Picardie',
  haute_normandie: 'Haute-Normandie',
  basse_normandie: 'Basse-Normandie',
  bretagne_occidentale: 'Bretagne occidentale',
  bretagne_orientale: 'Bretagne orientale',
  pays_nantais: 'Pays nantais',
  maine: 'Maine',
  anjou: 'Anjou',
  beauce: 'Beauce',
  touraine: 'Touraine',
  berry: 'Berry',
  limousin: 'Limousin',
  bourbonnais: 'Bourbonnais',
  haute_auvergne: 'Haute-Auvergne',
  poitou: 'Poitou',
  charentes: 'Charentes',
  guyenne: 'Guyenne',
  landes_bearn: 'Landes et Béarn',
  gascogne: 'Gascogne',
  toulousain: 'Toulousain',
  quercy_rouergue: 'Quercy et Rouergue',
  champagne: 'Champagne',
  aube_haute_marne: 'Aube et Haute-Marne',
  lorraine: 'Lorraine',
  alsace: 'Alsace',
  bourgogne_nord: 'Bourgogne du Nord',
  bourgogne_sud: 'Bourgogne du Sud',
  franche_comte: 'Franche-Comté',
  lyonnais: 'Lyonnais',
  savoie: 'Savoie',
  dauphine: 'Dauphiné',
  alpes_du_sud: 'Alpes du Sud',
  provence: 'Provence',
  cote_d_azur: "Côte d'Azur",
  languedoc: 'Languedoc',
  roussillon: 'Roussillon',
  haute_corse: 'Haute-Corse',
  corse_du_sud: 'Corse-du-Sud',
}

/** Display name, name with its article and bonus of each region; the bonuses were checked by `pnpm test:balance:france`. */
const REGIONS: Record<ContinentId, { name: string; nameWithArticle: string; bonus: number }> = {
  ile_de_france: { name: 'Île-de-France', nameWithArticle: "l'Île-de-France", bonus: 3 },
  nord: { name: 'Nord', nameWithArticle: 'le Nord', bonus: 3 },
  ouest: { name: 'Ouest', nameWithArticle: "l'Ouest", bonus: 3 },
  centre: { name: 'Centre', nameWithArticle: 'le Centre', bonus: 4 },
  sud_ouest: { name: 'Sud-Ouest', nameWithArticle: 'le Sud-Ouest', bonus: 4 },
  est: { name: 'Est', nameWithArticle: "l'Est", bonus: 4 },
  sud_est: { name: 'Sud-Est', nameWithArticle: 'le Sud-Est', bonus: 5 },
}

/** The 6 region missions of the France map, in their order. */
const REGION_MISSIONS: Mission[] = [
  { kind: 'continents', required: ['sud_est', 'ouest'], extraContinents: 0 },
  { kind: 'continents', required: ['sud_est', 'nord'], extraContinents: 0 },
  { kind: 'continents', required: ['sud_ouest', 'est'], extraContinents: 0 },
  { kind: 'continents', required: ['sud_ouest', 'nord'], extraContinents: 0 },
  { kind: 'continents', required: ['centre', 'ouest'], extraContinents: 1 },
  { kind: 'continents', required: ['est', 'ile_de_france'], extraContinents: 1 },
]

function required<T>(values: Record<string, T>, id: string): T {
  const value = values[id]
  if (value === undefined) {
    throw new Error(`Missing France map data for "${id}"`)
  }
  return value
}

function buildFranceMap(): GameMap {
  const adjacency: Record<TerritoryId, TerritoryId[]> = board.adjacency
  const territoryIds = board.territories.map((territory) => territory.id)
  const territories: Record<TerritoryId, Territory> = Object.fromEntries(
    board.territories.map(({ id, region }) => [
      id,
      { id, name: required(TERRITORY_NAMES, id), continent: region, neighbors: [...(adjacency[id] ?? [])] },
    ]),
  )
  const continents: Record<ContinentId, Continent> = Object.fromEntries(
    board.regions.map((id) => [
      id,
      { id, ...required(REGIONS, id), territories: territoryIds.filter((territory) => territories[territory]?.continent === id) },
    ]),
  )
  return {
    id: 'france',
    territoryIds,
    continentIds: [...board.regions],
    territories,
    continents,
    continentTerm: { singular: 'région', feminine: true },
    continentMissions: REGION_MISSIONS,
  }
}

/** Mainland France in 42 territories and 7 regions, built from the departments of the IGN. */
export const franceMap: GameMap = buildFranceMap()
