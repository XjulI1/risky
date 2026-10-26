import classicLabels from '../../../data/maps/classic/continent-labels.json'
import classicSeaRoutes from '../../../data/maps/classic/sea-routes.json'
import classicTerritories from '../../../data/maps/classic/territories.json'
import franceLabels from '../../../data/maps/france/continent-labels.json'
import franceRegionOutlines from '../../../data/maps/france/region-outlines.json'
import franceSeaRoutes from '../../../data/maps/france/sea-routes.json'
import franceTerritories from '../../../data/maps/france/territories.json'
import type { ContinentId, MapId, TerritoryId } from '../../engine'
import { averageTerritorySize } from '../cameraFraming'
import { largestOutline, territoryAnchors } from '../geometry/anchors'
import { capitalLayout, type CapitalLayout } from '../geometry/capitalLayout'
import {
  buildMapGeometry,
  svgProjection,
  worldSize,
  type RawTerritories,
  type RawTerritory,
  type SvgToWorld,
  type TerritoryGeometry,
  type WorldSize,
} from '../geometry/mapGeometry'
import type { MapPoint } from '../geometry/polygon'
import { edgeRuns, sharedEdges } from '../geometry/regionBorders'
import { seaRouteSegments, wrapStubs, type RawSeaRoutes, type SeaRouteSegment, type WrapStub } from '../geometry/seaRoutes'

/** The rendering data of a map, as stored in `data/maps/<map>/`. */
type BoardMapData = {
  territories: RawTerritories
  seaRoutes: RawSeaRoutes
  continentLabels: Record<ContinentId, number[]>
  /** The outline of each continent, drawn as a thick line; none on the classic map. */
  regionOutlines?: { regions: RawTerritory[] }
}

const BOARD_DATA: Record<MapId, BoardMapData> = {
  classic: { territories: classicTerritories, seaRoutes: classicSeaRoutes, continentLabels: classicLabels },
  france: {
    territories: franceTerritories,
    seaRoutes: franceSeaRoutes,
    continentLabels: franceLabels,
    regionOutlines: franceRegionOutlines,
  },
}

/** Every map the board can draw. */
export const BOARD_MAP_IDS = Object.keys(BOARD_DATA) as MapId[]

/** Everything the board draws for a map, in world units. */
export type BoardMap = {
  id: MapId
  size: WorldSize
  svgToWorld: SvgToWorld
  geometry: Record<TerritoryId, TerritoryGeometry>
  /** Side of a square with the average territory area. */
  averageTerritorySize: number
  /** Where the army pawn of a territory usually stands. */
  anchor: (id: TerritoryId) => MapPoint
  /** Where the pawn and the marker of a capital stand. */
  capitalLayout: (id: TerritoryId) => CapitalLayout
  seaRoutes: SeaRouteSegment[]
  wrapStubs: WrapStub[]
  continentLabels: Record<ContinentId, MapPoint>
  /** Closed outline of each region, by continent; empty when the map draws none. */
  regionOutlines: Record<ContinentId, MapPoint[][]>
  /** The stretches of region limit along each territory, coasts left out, drawn as thick lines on its tile. */
  regionBorders: Record<TerritoryId, MapPoint[][]>
}

function buildBoardMap(id: MapId, data: BoardMapData): BoardMap {
  const svgToWorld = svgProjection(data.territories.viewBox)
  const geometry = buildMapGeometry(data.territories.territories, svgToWorld)
  const anchors = territoryAnchors(geometry)
  const anchor = (territory: TerritoryId) => anchors[territory] ?? { x: 0, z: 0 }
  const layouts = new Map<TerritoryId, CapitalLayout>()
  const regionOutlines = Object.fromEntries(
    Object.values(buildMapGeometry(data.regionOutlines?.regions ?? [], svgToWorld)).map((region) => [region.id, region.outlines]),
  )
  const limits = sharedEdges(regionOutlines)
  return {
    id,
    size: worldSize(data.territories.viewBox),
    svgToWorld,
    geometry,
    averageTerritorySize: averageTerritorySize(geometry),
    anchor,
    capitalLayout: (territory) => {
      let layout = layouts.get(territory)
      if (layout === undefined) {
        layout = capitalLayout(largestOutline(geometry[territory]), anchor(territory))
        layouts.set(territory, layout)
      }
      return layout
    },
    seaRoutes: seaRouteSegments(data.seaRoutes, svgToWorld),
    wrapStubs: wrapStubs(data.seaRoutes, svgToWorld),
    continentLabels: Object.fromEntries(
      Object.entries(data.continentLabels).map(([continent, [x = 0, y = 0]]) => [continent, svgToWorld(x, y)]),
    ),
    regionOutlines,
    regionBorders: Object.fromEntries(
      Object.values(geometry).flatMap((territory) => {
        const lines = edgeRuns(territory.outlines, limits)
        return lines.length === 0 ? [] : [[territory.id, lines]]
      }),
    ),
  }
}

const boardMaps = new Map<MapId, BoardMap>()

/** The board of map `mapId`, computed once per map. */
export function boardMapFor(mapId: MapId): BoardMap {
  let board = boardMaps.get(mapId)
  if (board === undefined) {
    board = buildBoardMap(mapId, BOARD_DATA[mapId])
    boardMaps.set(mapId, board)
  }
  return board
}
