import seaData from '../../../data/maps/classic/sea-routes.json'
import type { TerritoryId } from '../../engine'
import { svgToWorld } from './mapGeometry'
import type { MapPoint } from './polygon'

/** A dotted sea link between two adjacent territories that share no border. */
export type SeaRouteSegment = {
  a: TerritoryId
  b: TerritoryId
  from: MapPoint
  to: MapPoint
}

/** Half of the Alaska–Kamchatka link, running from a territory to the nearest edge of the map. */
export type WrapStub = {
  territory: TerritoryId
  from: MapPoint
  to: MapPoint
}

/** Sea links of the classic board, in world units. */
export const seaRouteSegments: SeaRouteSegment[] = seaData.routes.map((route) => ({
  a: route.a,
  b: route.b,
  from: svgToWorld(route.pa[0] ?? 0, route.pa[1] ?? 0),
  to: svgToWorld(route.pb[0] ?? 0, route.pb[1] ?? 0),
}))

/** The two edge stubs drawing the Alaska–Kamchatka link, in world units. */
export const wrapStubs: WrapStub[] = seaData.wrap.map((stub) => {
  const [x, y] = [stub.from[0] ?? 0, stub.from[1] ?? 0]
  return { territory: stub.territory, from: svgToWorld(x, y), to: svgToWorld(stub.toX, y) }
})
