import type { TerritoryId } from '../../engine'
import type { SvgToWorld } from './mapGeometry'
import type { MapPoint } from './polygon'

/** A dotted sea link between two adjacent territories that share no border. */
export type SeaRouteSegment = {
  a: TerritoryId
  b: TerritoryId
  from: MapPoint
  to: MapPoint
}

/** Half of a link across the edge of the map (Alaska–Kamchatka), running from a territory to the nearest edge. */
export type WrapStub = {
  territory: TerritoryId
  from: MapPoint
  to: MapPoint
}

/** The sea links of a map, in its SVG coordinates. */
export type RawSeaRoutes = {
  routes: { a: TerritoryId; b: TerritoryId; pa: number[]; pb: number[] }[]
  wrap: { territory: TerritoryId; from: number[]; toX: number }[]
}

/** Sea links of a map, in world units. */
export function seaRouteSegments(data: RawSeaRoutes, svgToWorld: SvgToWorld): SeaRouteSegment[] {
  return data.routes.map((route) => ({
    a: route.a,
    b: route.b,
    from: svgToWorld(route.pa[0] ?? 0, route.pa[1] ?? 0),
    to: svgToWorld(route.pb[0] ?? 0, route.pb[1] ?? 0),
  }))
}

/** The edge stubs drawing the links that cross the edge of a map, in world units. */
export function wrapStubs(data: RawSeaRoutes, svgToWorld: SvgToWorld): WrapStub[] {
  return data.wrap.map((stub) => {
    const [x, y] = [stub.from[0] ?? 0, stub.from[1] ?? 0]
    return { territory: stub.territory, from: svgToWorld(x, y), to: svgToWorld(stub.toX, y) }
  })
}
