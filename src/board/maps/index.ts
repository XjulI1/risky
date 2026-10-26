import classicLabels from '../../../data/maps/classic/continent-labels.json'
import classicSeaRoutes from '../../../data/maps/classic/sea-routes.json'
import classicTerritories from '../../../data/maps/classic/territories.json'
import type { ContinentId, MapId, TerritoryId } from '../../engine'
import { averageTerritorySize } from '../cameraFraming'
import { largestOutline, territoryAnchors } from '../geometry/anchors'
import { capitalLayout, type CapitalLayout } from '../geometry/capitalLayout'
import {
  buildMapGeometry,
  svgProjection,
  worldSize,
  type RawTerritories,
  type SvgToWorld,
  type TerritoryGeometry,
  type WorldSize,
} from '../geometry/mapGeometry'
import type { MapPoint } from '../geometry/polygon'
import { seaRouteSegments, wrapStubs, type RawSeaRoutes, type SeaRouteSegment, type WrapStub } from '../geometry/seaRoutes'

/** The rendering data of a map, as stored in `data/maps/<map>/`. */
type BoardMapData = {
  territories: RawTerritories
  seaRoutes: RawSeaRoutes
  continentLabels: Record<ContinentId, number[]>
}

const BOARD_DATA: Record<MapId, BoardMapData> = {
  classic: { territories: classicTerritories, seaRoutes: classicSeaRoutes, continentLabels: classicLabels },
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
}

function buildBoardMap(id: MapId, data: BoardMapData): BoardMap {
  const svgToWorld = svgProjection(data.territories.viewBox)
  const geometry = buildMapGeometry(data.territories.territories, svgToWorld)
  const anchors = territoryAnchors(geometry)
  const anchor = (territory: TerritoryId) => anchors[territory] ?? { x: 0, z: 0 }
  const layouts = new Map<TerritoryId, CapitalLayout>()
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
