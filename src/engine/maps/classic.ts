import board from '../../../data/maps/classic/board.json'
import geometry from '../../../data/maps/classic/territories.json'
import type { Continent, ContinentId, GameMap, Mission, Territory, TerritoryId } from '../types'

const TERRITORY_NAMES: Record<TerritoryId, string> = {
  alaska: 'Alaska',
  northwest_territory: 'Territoires du Nord-Ouest',
  greenland: 'Groenland',
  alberta: 'Alberta',
  ontario: 'Ontario',
  quebec: 'Québec',
  western_us: "États-Unis de l'Ouest",
  eastern_us: "États-Unis de l'Est",
  central_america: 'Amérique centrale',
  venezuela: 'Venezuela',
  brazil: 'Brésil',
  peru: 'Pérou',
  argentina: 'Argentine',
  iceland: 'Islande',
  scandinavia: 'Scandinavie',
  uk: 'Grande-Bretagne',
  northern_europe: 'Europe du Nord',
  western_europe: "Europe de l'Ouest",
  southern_europe: 'Europe du Sud',
  ukraine: 'Ukraine',
  north_africa: 'Afrique du Nord',
  egypt: 'Égypte',
  east_africa: "Afrique de l'Est",
  congo: 'Congo',
  south_africa: 'Afrique du Sud',
  madagascar: 'Madagascar',
  ural: 'Oural',
  siberia: 'Sibérie',
  yakutsk: 'Iakoutie',
  kamchatka: 'Kamtchatka',
  irkutsk: 'Irkoutsk',
  mongolia: 'Mongolie',
  japan: 'Japon',
  afghanistan: 'Afghanistan',
  china: 'Chine',
  middle_east: 'Moyen-Orient',
  india: 'Inde',
  siam: 'Siam',
  indonesia: 'Indonésie',
  new_guinea: 'Nouvelle-Guinée',
  western_australia: 'Australie occidentale',
  eastern_australia: 'Australie orientale',
}

const CONTINENT_NAMES: Record<ContinentId, string> = {
  northAmerica: 'Amérique du Nord',
  southAmerica: 'Amérique du Sud',
  europe: 'Europe',
  africa: 'Afrique',
  asia: 'Asie',
  australia: 'Océanie',
}

const CONTINENT_NAMES_WITH_ARTICLE: Record<ContinentId, string> = {
  northAmerica: "l'Amérique du Nord",
  southAmerica: "l'Amérique du Sud",
  europe: "l'Europe",
  africa: "l'Afrique",
  asia: "l'Asie",
  australia: "l'Océanie",
}

/** The 6 continent missions of the classic rules, in their order. */
const CONTINENT_MISSIONS: Mission[] = [
  { kind: 'continents', required: ['northAmerica', 'africa'], extraContinents: 0 },
  { kind: 'continents', required: ['northAmerica', 'australia'], extraContinents: 0 },
  { kind: 'continents', required: ['asia', 'southAmerica'], extraContinents: 0 },
  { kind: 'continents', required: ['asia', 'africa'], extraContinents: 0 },
  { kind: 'continents', required: ['europe', 'southAmerica'], extraContinents: 1 },
  { kind: 'continents', required: ['europe', 'australia'], extraContinents: 1 },
]

function requireName(names: Record<string, string>, id: string): string {
  const name = names[id]
  if (name === undefined) {
    throw new Error(`Missing French name for "${id}"`)
  }
  return name
}

function buildClassicMap(): GameMap {
  const adjacency: Record<TerritoryId, TerritoryId[]> = board.adjacency
  const territoryIds = geometry.territories.map((t) => t.id)
  const continentIds = Object.keys(board.continents)

  const territories: Record<TerritoryId, Territory> = {}
  for (const { id, continent } of geometry.territories) {
    territories[id] = {
      id,
      name: requireName(TERRITORY_NAMES, id),
      continent,
      neighbors: [...(adjacency[id] ?? [])],
    }
  }

  const continentBonuses: Record<ContinentId, { bonus: number }> = board.continents
  const continents: Record<ContinentId, Continent> = {}
  for (const id of continentIds) {
    continents[id] = {
      id,
      name: requireName(CONTINENT_NAMES, id),
      nameWithArticle: requireName(CONTINENT_NAMES_WITH_ARTICLE, id),
      bonus: continentBonuses[id]?.bonus ?? 0,
      territories: territoryIds.filter((t) => territories[t]?.continent === id),
    }
  }

  return {
    id: 'classic',
    territoryIds,
    continentIds,
    territories,
    continents,
    continentTerm: { singular: 'continent', feminine: false },
    continentMissions: CONTINENT_MISSIONS,
  }
}

/** The classic 42-territory Risk board, with French display names. */
export const classicMap: GameMap = buildClassicMap()

/** Whether two territories share a border or a sea link. */
export function areAdjacent(map: GameMap, a: TerritoryId, b: TerritoryId): boolean {
  return map.territories[a]?.neighbors.includes(b) ?? false
}
