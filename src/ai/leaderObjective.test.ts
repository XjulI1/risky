import { describe, expect, it } from 'vitest'
import { classicMap, type GameState } from '../engine'
import { leaderAttack, runawayLeader } from './leaderObjective'
import { playerView } from './playerView'
import { decide, scenario } from './testScenarios'

const SOUTH_AMERICA = classicMap.continents.southAmerica?.territories ?? []

function viewOf(state: GameState) {
  return playerView(state, 'p1')
}

/** p2 holds South America with big stacks; p1 can take Venezuela at 6 against 2 or Ukraine (p3) at 8 against 1. */
function p2RunsAway(leaderArmies: number): GameState {
  const spread = Object.fromEntries(
    classicMap.territoryIds.map((id, index): [string, [string, number]] => [id, [`p${(index % 4) + 1}`, 1]]),
  )
  return scenario({
    layout: {
      ...spread,
      venezuela: ['p2', 2],
      brazil: ['p2', leaderArmies],
      peru: ['p2', leaderArmies],
      argentina: ['p2', leaderArmies],
      central_america: ['p1', 6],
      scandinavia: ['p1', 8],
      ukraine: ['p3', 1],
    },
    phase: { kind: 'attack' },
    playerCount: 4,
  })
}

describe('runawayLeader', () => {
  it('names the opponent at least 30 % stronger than every other player', () => {
    expect(runawayLeader(viewOf(p2RunsAway(20)), 'p1')).toBe('p2')
  })

  it('names nobody when no opponent stands out', () => {
    expect(runawayLeader(viewOf(p2RunsAway(1)), 'p1')).toBeNull()
  })

  it('never names the player itself', () => {
    expect(runawayLeader(playerView(p2RunsAway(20), 'p2'), 'p2')).toBeNull()
  })

  it('names nobody below 4 players', () => {
    const state = scenario({ layout: { brazil: ['p2', 60] }, phase: { kind: 'attack' }, filler: 'p3' })
    expect(runawayLeader(viewOf(state), 'p1')).toBeNull()
  })
})

describe('leaderAttack', () => {
  it('attacks the leader, a territory of its continent first', () => {
    expect(leaderAttack(viewOf(p2RunsAway(20)), 'p1')).toMatchObject({ from: 'central_america', to: 'venezuela' })
    expect(SOUTH_AMERICA).toContain('venezuela')
  })

  it('makes the hard level attack the leader rather than an easier target elsewhere', () => {
    expect(decide(p2RunsAway(20), 'hard')).toMatchObject({ type: 'attack', to: 'venezuela' })
  })
})
