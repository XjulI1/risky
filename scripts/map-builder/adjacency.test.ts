import { describe, expect, it } from 'vitest'
import { sharedBorders, territoryAdjacency, withSeaLinks, type Topology } from './adjacency.ts'

/**
 * Three territories in a row, in metres: a | b | c. a and b share a 3 km border made of two arcs,
 * b and c share one arc of 200 m, a and c do not touch.
 */
const topology: Topology = {
  type: 'Topology',
  arcs: [
    [
      [0, 0],
      [0, 2000],
    ],
    [
      [0, 2000],
      [0, 3000],
    ],
    [
      [5000, 0],
      [5000, 200],
    ],
    [
      [0, 3000],
      [-4000, 3000],
      [-4000, 0],
      [0, 0],
    ],
    [
      [0, 0],
      [5000, 0],
      [5000, 200],
    ],
  ],
  objects: {
    territories: {
      type: 'GeometryCollection',
      geometries: [
        { type: 'Polygon', properties: { id: 'a' }, arcs: [[0, 1, 3]] },
        { type: 'Polygon', properties: { id: 'b' }, arcs: [[~1, ~0, 4, ~2]] },
        { type: 'Polygon', properties: { id: 'c' }, arcs: [[2]] },
      ],
    },
  },
}

describe('sharedBorders', () => {
  it('sums the arcs two territories share, longest first', () => {
    expect(sharedBorders(topology, 'territories')).toEqual([
      { a: 'a', b: 'b', length: 3000 },
      { a: 'b', b: 'c', length: 200 },
    ])
  })

  it('decodes quantized, delta-encoded arcs', () => {
    const quantized: Topology = {
      ...topology,
      transform: { scale: [10, 10], translate: [0, 0] },
      arcs: [
        [
          [0, 0],
          [0, 200],
        ],
        [
          [0, 200],
          [0, 100],
        ],
      ],
      objects: {
        territories: {
          type: 'GeometryCollection',
          geometries: [
            { type: 'Polygon', properties: { id: 'a' }, arcs: [[0, 1]] },
            { type: 'Polygon', properties: { id: 'b' }, arcs: [[~1, ~0]] },
          ],
        },
      },
    }
    expect(sharedBorders(quantized, 'territories')).toEqual([{ a: 'a', b: 'b', length: 3000 }])
  })
})

describe('territoryAdjacency', () => {
  it('makes neighbors of territories sharing at least the threshold, and not of a mere contact', () => {
    expect(territoryAdjacency(['a', 'b', 'c'], sharedBorders(topology, 'territories'), 1000)).toEqual({
      a: ['b'],
      b: ['a'],
      c: [],
    })
  })

  it('counts several short arcs together', () => {
    expect(territoryAdjacency(['a', 'b', 'c'], sharedBorders(topology, 'territories'), 2500).a).toEqual(['b'])
  })
})

describe('withSeaLinks', () => {
  it('adds each sea link in both directions, once', () => {
    const adjacency = withSeaLinks({ a: ['b'], b: ['a'], c: [] }, [
      ['a', 'c'],
      ['c', 'a'],
    ])
    expect(adjacency).toEqual({ a: ['b', 'c'], b: ['a'], c: ['a'] })
  })

  it('rejects a link to an unknown territory', () => {
    expect(() => withSeaLinks({ a: [] }, [['a', 'z']])).toThrow(/z/)
  })
})
