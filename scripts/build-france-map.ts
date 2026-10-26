/**
 * Builds the rendering and topology data of the France map from the IGN department outlines:
 * `pnpm build:map:france`. Run once; its output is committed in `data/maps/france/`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import mapshaper from 'mapshaper'
import { sharedBorders, territoryAdjacency, withSeaLinks, type Topology } from './map-builder/adjacency.ts'
import { groupingProblems, type Grouping } from './map-builder/grouping.ts'
import { withoutHoles } from './map-builder/holes.ts'
import { closestPoints, labelPoint } from './map-builder/points.ts'
import { geometryToPath, svgFrame, type AreaGeometry } from './map-builder/svgPath.ts'

const DATA_DIR = 'data/maps/france'
const SOURCE = join(DATA_DIR, 'source/departements-version-simplifiee.geojson')

/** Lambert-93 (EPSG:2154): metres, the usual shapes of French maps. */
const LAMBERT_93 =
  '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'

/** Two territories are neighbors when their departments share at least this much land border, in metres. */
const MIN_BORDER_LENGTH = 1000
/** The links of Corsica to the mainland. */
const SEA_LINKS = [
  ['haute_corse', 'cote_d_azur'],
  ['corse_du_sud', 'provence'],
] as const
/**
 * Share of removable points kept by the extra simplification, to keep territories.json under 250 KB. The source
 * is simplified enough already: kept whole, it gives about 140 KB.
 */
const SIMPLIFY_PERCENTAGE = '100%'
const MIN_ISLAND_AREA = '40km2'
const VIEW_WIDTH = 1000
/** Sea around the land, in view box units, where the labels of the coastal regions stand. */
const VIEW_MARGIN = 70
const SHORTEST_BORDERS_SHOWN = 10

type Feature = { type: 'Feature'; properties: Record<string, string>; geometry: AreaGeometry }
type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] }

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(name: string, value: unknown): void {
  const path = join(DATA_DIR, name)
  writeFileSync(path, `${JSON.stringify(value, null, 1)}\n`)
  console.log(`${path} : ${(readFileSync(path).length / 1024).toFixed(0)} Ko`)
}

/** Step 1: every department tagged with its territory and region, after checking the grouping. */
function taggedDepartments(source: FeatureCollection, grouping: Grouping): FeatureCollection {
  const problems = groupingProblems(
    grouping,
    source.features.map((feature) => feature.properties.code ?? ''),
  )
  if (problems.length > 0) {
    throw new Error(`Regroupement invalide :\n${problems.join('\n')}`)
  }
  const territoryOf = new Map(
    grouping.territories.flatMap((territory) => territory.departments.map((code) => [code, territory] as const)),
  )
  return {
    type: 'FeatureCollection',
    features: source.features.map((feature) => {
      const territory = territoryOf.get(feature.properties.code ?? '')
      return { ...feature, properties: { territory: territory?.id ?? '', region: territory?.region ?? '' } }
    }),
  }
}

async function run(commands: string, input: FeatureCollection): Promise<Record<string, string>> {
  const output = await mapshaper.applyCommands(commands, { 'departments.json': input })
  return Object.fromEntries(Object.entries(output).map(([name, content]) => [name, String(content)]))
}

const PROJECT_AND_MERGE = `-i departments.json -proj init=wgs84 crs="${LAMBERT_93}" -dissolve territory copy-fields=region name=territories`

/** Steps 2 to 4: projection, merge by territory and adjacency measured on the unsimplified shared arcs. */
async function adjacency(departments: FeatureCollection, territoryIds: string[]): Promise<Record<string, string[]>> {
  const output = await run(`${PROJECT_AND_MERGE} -o format=topojson no-quantization topology.json`, departments)
  const topology = JSON.parse(output['topology.json'] ?? '{}') as Topology
  for (const geometry of topology.objects.territories?.geometries ?? []) {
    const properties: Record<string, string> = geometry.properties
    geometry.properties = { id: properties.territory ?? '' }
  }
  const borders = sharedBorders(topology, 'territories')
  console.log(`Les ${SHORTEST_BORDERS_SHOWN} frontières partagées les plus courtes (seuil ${MIN_BORDER_LENGTH} m) :`)
  for (const border of borders.slice(-SHORTEST_BORDERS_SHOWN).reverse()) {
    const kept = border.length >= MIN_BORDER_LENGTH ? 'voisins' : 'écartés'
    console.log(`  ${border.a} – ${border.b} : ${Math.round(border.length)} m (${kept})`)
  }
  return withSeaLinks(territoryAdjacency(territoryIds, borders, MIN_BORDER_LENGTH), SEA_LINKS)
}

/**
 * Steps 5 and 8: simplified territories without small islands, and the outline of each region, all drawn
 * without holes: lakes (étang de Berre) and foreign enclaves (Llívia) are filled, and an enclave of another
 * territory (Enclave des Papes) is drawn as part of the territory around it. Adjacency is not affected.
 */
async function simplifiedLayers(departments: FeatureCollection) {
  const output = await run(
    `${PROJECT_AND_MERGE} -simplify percentage=${SIMPLIFY_PERCENTAGE} keep-shapes -filter-islands min-area=${MIN_ISLAND_AREA} ` +
      `-dissolve region + name=regions -o format=geojson target=territories,regions`,
    departments,
  )
  const filled = (name: string, key: string) =>
    new Map(
      withoutHoles(
        (JSON.parse(output[name] ?? '{}') as FeatureCollection).features.map((feature) => ({
          id: feature.properties[key] ?? '',
          geometry: feature.geometry,
        })),
      ).map(({ id, geometry }) => [id, geometry as AreaGeometry]),
    )
  return { territories: filled('territories.json', 'territory'), regions: filled('regions.json', 'region') }
}

function rings(geometry: AreaGeometry): number[][][] {
  return geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat()
}

function boundingBox(geometries: Iterable<AreaGeometry>): number[] {
  const positions = [...geometries].flatMap((geometry) => rings(geometry).flat())
  const xs = positions.map(([x = 0]) => x)
  const ys = positions.map(([, y = 0]) => y)
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]
}

const round = (value: number) => Math.round(value * 10) / 10

async function main(): Promise<void> {
  const grouping = readJson<Grouping>(join(DATA_DIR, 'grouping.json'))
  const departments = taggedDepartments(readJson<FeatureCollection>(SOURCE), grouping)
  const territoryIds = grouping.territories.map((territory) => territory.id)

  const neighbors = await adjacency(departments, territoryIds)
  const { territories, regions } = await simplifiedLayers(departments)

  // Steps 6 and 7: SVG paths in a 1000-unit wide view box, label point of every territory.
  const frame = svgFrame(boundingBox(territories.values()), VIEW_WIDTH, VIEW_MARGIN)
  const svgRings = (geometry: AreaGeometry) => rings(geometry).map((ring) => ring.map(frame.toSvg))
  const geometryOf = territories
  const territoryData = grouping.territories.map(({ id, region }) => {
    const geometry = geometryOf.get(id)
    if (geometry === undefined) {
      throw new Error(`Territoire sans géométrie : ${id}`)
    }
    const [cx, cy] = labelPoint(svgRings(geometry))
    return { id, continent: region, cx: round(cx), cy: round(cy), d: geometryToPath(id, geometry, frame) }
  })

  // Step 9: the nearest coasts of the two sides of each sea link.
  const routes = SEA_LINKS.map(([a, b]) => {
    const { pa, pb, dist } = closestPoints(svgRings(geometryOf.get(a) as AreaGeometry), svgRings(geometryOf.get(b) as AreaGeometry))
    return { a, b, pa: pa.map(round), pb: pb.map(round), dist: Math.round(dist * 100) / 100 }
  })

  writeJson('territories.json', { viewBox: frame.viewBox, territories: territoryData })
  writeJson('board.json', {
    regions: grouping.regions,
    territories: grouping.territories.map(({ id, region }) => ({ id, region })),
    adjacency: neighbors,
  })
  writeJson('sea-routes.json', { routes, wrap: [] })
  writeJson('region-outlines.json', {
    regions: grouping.regions.map((region) => {
      const geometry = regions.get(region)
      if (geometry === undefined) {
        throw new Error(`Région sans contour : ${region}`)
      }
      return { id: region, d: geometryToPath(region, geometry, frame) }
    }),
  })
}

await main()
