import { describe, expect, it } from 'vitest'
import { createGame, type GameEvent } from '../../engine'
import { initialTurnNumber, nextTurnNumber } from './turnCounter'

const players = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' as const },
  { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' as const },
  { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' as const },
]

function created(settings = {}) {
  const result = createGame({ players, seed: 3, settings })
  if (!result.ok) throw new Error(result.error.message)
  return result.state
}

describe('turn counter', () => {
  it('starts at turn 1 when the game opens on the first turn', () => {
    expect(initialTurnNumber(created())).toBe(1)
  })

  it('starts at 0 while the territories or the armies are set up', () => {
    expect(initialTurnNumber(created({ territoryDistribution: 'choice' }))).toBe(0)
    expect(initialTurnNumber(created({ armyPlacement: 'manual' }))).toBe(0)
  })

  it('counts one more turn at each turn start', () => {
    const events: GameEvent[] = [
      { type: 'fortified', playerId: 'p1', from: 'peru', to: 'brazil', armies: 2 },
      { type: 'turnStarted', playerId: 'p2', reserve: 3 },
    ]
    expect(nextTurnNumber(4, events)).toBe(5)
  })

  it('does not count the actions of the set-up', () => {
    const events: GameEvent[] = [
      { type: 'territoryClaimed', playerId: 'p1', territory: 'peru' },
      { type: 'initialArmyPlaced', playerId: 'p2', territory: 'brazil' },
    ]
    expect(nextTurnNumber(0, events)).toBe(0)
  })
})
