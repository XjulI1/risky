import { describe, expect, it } from 'vitest'
import seaData from '../../../data/maps/classic/sea-routes.json'
import { areAdjacent, classicMap } from '../../engine'
import { MAP_WORLD_WIDTH, svgToWorld } from './mapGeometry'
import { seaRouteSegments, wrapStubs } from './seaRoutes'

const pairs = seaRouteSegments.map((segment) => [segment.a, segment.b].sort().join('|'))

describe('seaRouteSegments', () => {
  it('has the 21 sea routes of the data', () => {
    expect(seaRouteSegments).toHaveLength(21)
  })

  it('only links territories that are adjacent in the engine', () => {
    for (const segment of seaRouteSegments) {
      expect(areAdjacent(classicMap, segment.a, segment.b), `${segment.a}-${segment.b}`).toBe(true)
    }
  })

  it.each([
    ['brazil', 'north_africa'],
    ['siam', 'indonesia'],
  ])('links %s and %s', (a, b) => {
    expect(pairs).toContain([a, b].sort().join('|'))
  })

  it('converts both ends to world coordinates', () => {
    const route = seaData.routes[0]
    const segment = seaRouteSegments[0]
    expect(segment?.from).toEqual(svgToWorld(route?.pa[0] ?? 0, route?.pa[1] ?? 0))
    expect(segment?.to).toEqual(svgToWorld(route?.pb[0] ?? 0, route?.pb[1] ?? 0))
  })
})

describe('wrapStubs', () => {
  it('draws Alaska–Kamchatka as two stubs running off opposite edges', () => {
    expect(areAdjacent(classicMap, 'alaska', 'kamchatka')).toBe(true)
    expect(pairs).not.toContain('alaska|kamchatka')
    const alaska = wrapStubs.find((stub) => stub.territory === 'alaska')
    const kamchatka = wrapStubs.find((stub) => stub.territory === 'kamchatka')
    expect(wrapStubs).toHaveLength(2)
    expect(alaska?.to.x).toBeLessThan(alaska?.from.x ?? 0)
    expect(kamchatka?.to.x).toBeGreaterThan(kamchatka?.from.x ?? 0)
    expect(alaska?.to.x).toBeLessThan(-MAP_WORLD_WIDTH / 2 + 5)
    expect(kamchatka?.to.x).toBeGreaterThan(MAP_WORLD_WIDTH / 2 - 5)
    expect(alaska?.to.z).toBeCloseTo(alaska?.from.z ?? NaN)
  })
})
