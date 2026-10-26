import type { GameMap, TerritoryId } from '../types'

function duplicates(ids: readonly string[]): string[] {
  const seen = new Set<string>()
  const repeated = new Set<string>()
  for (const id of ids) {
    if (seen.has(id)) {
      repeated.add(id)
    }
    seen.add(id)
  }
  return [...repeated]
}

function identifierViolations(map: GameMap): string[] {
  return duplicates([...map.territoryIds, ...map.continentIds]).map((id) => `Identifiant en double : ${id}`)
}

function continentViolations(map: GameMap): string[] {
  const violations: string[] = []
  for (const id of map.territoryIds) {
    const declared = map.territories[id]?.continent
    const owning = map.continentIds.filter((continent) => map.continents[continent]?.territories.includes(id))
    if (declared === undefined || map.continents[declared] === undefined) {
      violations.push(`Territoire sans continent existant : ${id}`)
    } else if (owning.length !== 1 || owning[0] !== declared) {
      violations.push(`Territoire listé dans ${owning.length} continents au lieu de son seul continent : ${id}`)
    }
  }
  for (const id of map.continentIds) {
    const continent = map.continents[id]
    if (continent === undefined || continent.territories.length === 0) {
      violations.push(`Continent vide : ${id}`)
    }
    if (continent !== undefined && !(continent.bonus > 0)) {
      violations.push(`Continent sans bonus positif : ${id}`)
    }
  }
  return violations
}

function adjacencyViolations(map: GameMap): string[] {
  const violations: string[] = []
  for (const id of map.territoryIds) {
    for (const neighbor of map.territories[id]?.neighbors ?? []) {
      if (neighbor === id) {
        violations.push(`Territoire voisin de lui-même : ${id}`)
      } else if (!(map.territories[neighbor]?.neighbors.includes(id) ?? false)) {
        violations.push(`Adjacence non symétrique : ${id} → ${neighbor}`)
      }
    }
  }
  return violations
}

function connectivityViolations(map: GameMap): string[] {
  const [start] = map.territoryIds
  if (start === undefined) {
    return ['Carte sans territoire']
  }
  const reached = new Set<TerritoryId>([start])
  const queue = [start]
  for (let current = queue.shift(); current !== undefined; current = queue.shift()) {
    for (const neighbor of map.territories[current]?.neighbors ?? []) {
      if (!reached.has(neighbor)) {
        reached.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  const unreached = map.territoryIds.filter((id) => !reached.has(id))
  return unreached.length === 0 ? [] : [`Graphe non connexe, territoires injoignables : ${unreached.join(', ')}`]
}

function missionViolations(map: GameMap): string[] {
  return map.continentMissions.flatMap((mission) =>
    mission.kind !== 'continents'
      ? [`Mission de continents d'un autre type : ${mission.kind}`]
      : mission.required
          .filter((continent) => map.continents[continent] === undefined)
          .map((continent) => `Mission citant un continent absent de la carte : ${continent}`),
  )
}

/** Every broken invariant of `map`, one French sentence each; an empty list when the map is sound. */
export function mapInvariants(map: GameMap): string[] {
  return [
    ...identifierViolations(map),
    ...continentViolations(map),
    ...adjacencyViolations(map),
    ...connectivityViolations(map),
    ...missionViolations(map),
  ]
}
