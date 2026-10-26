import { describe, expect, it } from 'vitest'
import { withoutHoles, type Area } from './holes.ts'

const square = (x: number, y: number, side: number) => [
  [x, y],
  [x + side, y],
  [x + side, y + side],
  [x, y + side],
  [x, y],
]

// A big territory with a hole in its middle; an enclave of another territory fills that hole.
const surrounding: Area = { id: 'drome', geometry: { type: 'Polygon', coordinates: [square(0, 0, 30), square(10, 10, 10)] } }
const enclaveOwner: Area = {
  id: 'vaucluse',
  geometry: { type: 'MultiPolygon', coordinates: [[square(40, 0, 20)], [square(10, 10, 10)]] },
}

describe('withoutHoles', () => {
  it('fills a hole that nothing fills, such as a lake', () => {
    expect(withoutHoles([surrounding])).toEqual([
      { id: 'drome', geometry: { type: 'MultiPolygon', coordinates: [[square(0, 0, 30)]] } },
    ])
  })

  it('gives an enclave to the territory around it', () => {
    const [drome, vaucluse] = withoutHoles([surrounding, enclaveOwner])
    expect(drome?.geometry.coordinates).toEqual([[square(0, 0, 30)]])
    expect(vaucluse?.geometry.coordinates).toEqual([[square(40, 0, 20)]])
  })

  it('keeps an island of a territory in the sea', () => {
    const island: Area = {
      id: 'corse',
      geometry: { type: 'MultiPolygon', coordinates: [[square(100, 0, 5)], [square(110, 0, 5)]] },
    }
    expect(withoutHoles([surrounding, island])[1]?.geometry.coordinates).toHaveLength(2)
  })
})
