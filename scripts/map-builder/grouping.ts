/** How the departments are grouped into territories, and the territories into regions. */
export type Grouping = {
  regions: string[]
  territories: { id: string; region: string; departments: string[] }[]
}

/** Every problem of `grouping` against the department codes of the source, one French sentence each. */
export function groupingProblems(grouping: Grouping, departmentCodes: readonly string[]): string[] {
  const known = new Set(departmentCodes)
  const seen = new Map<string, string>()
  const problems: string[] = []
  for (const territory of grouping.territories) {
    if (!grouping.regions.includes(territory.region)) {
      problems.push(`Territoire ${territory.id} dans une région non déclarée : ${territory.region}`)
    }
    for (const code of territory.departments) {
      const previous = seen.get(code)
      if (previous !== undefined) {
        problems.push(`Département ${code} regroupé deux fois : ${previous} et ${territory.id}`)
      } else if (!known.has(code)) {
        problems.push(`Département ${code} absent de la source (territoire ${territory.id})`)
      }
      seen.set(code, territory.id)
    }
  }
  for (const code of departmentCodes) {
    if (!seen.has(code)) {
      problems.push(`Département ${code} rattaché à aucun territoire`)
    }
  }
  for (const region of grouping.regions) {
    if (!grouping.territories.some((territory) => territory.region === region)) {
      problems.push(`Région vide : ${region}`)
    }
  }
  return problems
}
