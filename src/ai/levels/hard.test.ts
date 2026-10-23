import { describe, expect, it } from 'vitest'
import { classicMap, type AiLevel, type GameState } from '../../engine'
import { decide, mustEliminateCarol, playWhile, scenario, territoryCard } from '../testScenarios'

const SOUTH_AMERICA = classicMap.continents.southAmerica?.territories ?? []

function attackedDuringTurn(start: GameState, level: AiLevel): string[] {
  const { steps } = playWhile(start, level, (state) => state.phase.kind === 'attack' || state.phase.kind === 'conquestMove')
  return steps.flatMap(({ action }) => (action.type === 'attack' ? [action.to] : []))
}

function southAmericaHeldByP2(): GameState {
  return scenario({
    layout: {
      venezuela: ['p2', 5],
      brazil: ['p2', 2],
      peru: ['p2', 2],
      argentina: ['p2', 2],
      central_america: ['p1', 6],
      western_us: ['p1', 1],
      eastern_us: ['p1', 1],
      indonesia: ['p1', 1],
      new_guinea: ['p1', 6],
      western_australia: ['p1', 1],
    },
    phase: { kind: 'attack' },
    filler: 'p3',
  })
}

function lastTerritoryOfP3(p3Cards: number): GameState {
  return scenario({
    layout: {
      eastern_australia: ['p3', 5],
      new_guinea: ['p1', 6],
      indonesia: ['p1', 1],
      western_australia: ['p1', 1],
      central_america: ['p1', 10],
    },
    phase: { kind: 'attack' },
    hands: { p3: [1, 2, 3].slice(0, p3Cards).map((id) => territoryCard(id, 'infantry', 'alaska')) },
  })
}

function holdingASetOfFour(cardTradeScale: 'progressive' | 'fixed'): GameState {
  return scenario({
    layout: {
      indonesia: ['p1', 3],
      new_guinea: ['p1', 1],
      western_australia: ['p1', 1],
      eastern_australia: ['p1', 1],
      china: ['p3', 1],
    },
    phase: { kind: 'reinforce', reserve: 3 },
    hands: {
      p1: [
        territoryCard(10, 'infantry', 'alaska'),
        territoryCard(11, 'infantry', 'peru'),
        territoryCard(12, 'infantry', 'japan'),
        territoryCard(13, 'cavalry', 'egypt'),
      ],
    },
    settings: { cardTradeScale },
  })
}

describe('hard AI', () => {
  it('attacks a continent entirely held by an opponent when it has even odds', () => {
    const start = southAmericaHeldByP2()
    expect(attackedDuringTurn(start, 'hard').some((target) => SOUTH_AMERICA.includes(target))).toBe(true)
    expect(attackedDuringTurn(start, 'normal').some((target) => SOUTH_AMERICA.includes(target))).toBe(false)
  })

  it('first attacks an opponent it can eliminate when that opponent holds cards', () => {
    expect(decide(lastTerritoryOfP3(3), 'hard')).toEqual({
      type: 'attack',
      playerId: 'p1',
      from: 'new_guinea',
      to: 'eastern_australia',
    })
    expect(decide(lastTerritoryOfP3(3), 'normal')).not.toMatchObject({ to: 'eastern_australia' })
    expect(decide(lastTerritoryOfP3(0), 'hard')).not.toMatchObject({ to: 'eastern_australia' })
  })

  it('keeps its cards on the progressive scale without a priority attack', () => {
    expect(decide(holdingASetOfFour('progressive'), 'hard').type).toBe('deploy')
    expect(decide(holdingASetOfFour('progressive'), 'normal').type).toBe('tradeCards')
    expect(decide(holdingASetOfFour('fixed'), 'hard').type).toBe('tradeCards')
  })

  it('spreads its reinforcements according to the threat on each border', () => {
    const start = scenario({
      layout: {
        venezuela: ['p1', 3],
        brazil: ['p1', 3],
        peru: ['p1', 3],
        argentina: ['p1', 3],
        central_america: ['p2', 9],
        north_africa: ['p2', 6],
        greenland: ['p3', 1],
        egypt: ['p3', 1],
      },
      phase: { kind: 'reinforce', reserve: 8 },
    })
    const { state } = playWhile(start, 'hard', (current) => current.phase.kind === 'reinforce')
    const added = (territory: string) => (state.territories[territory]?.armies ?? 0) - 3
    expect(added('venezuela')).toBeGreaterThan(added('brazil'))
    expect(added('brazil')).toBeGreaterThan(0)
    expect(added('peru') + added('argentina')).toBe(0)
  })

  it('attacks a territory of the player it must eliminate at 0.7 rather than another one at 0.9', () => {
    expect(decide(mustEliminateCarol(false), 'hard')).toMatchObject({ type: 'attack', to: 'eastern_australia' })
    expect(decide(mustEliminateCarol(true), 'hard')).toEqual({ type: 'attack', playerId: 'p1', from: 'indonesia', to: 'siam' })
  })
})
