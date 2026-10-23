import { describe, expect, it } from 'vitest'
import { resolveRoll } from './combat'
import { applyAction } from './index'
import { assignTerritories, createTestGame, giveAllTerritoriesTo } from './testUtils'
import type { GameEvent, GameSettings, GameState } from './types'

type DiceRolled = Extract<GameEvent, { type: 'diceRolled' }>

function battle(fromArmies: number, toArmies: number, seed = 1, settings: Partial<GameSettings> = {}): GameState {
  const state = giveAllTerritoriesTo(createTestGame(3, { seed, settings }), 'p2')
  assignTerritories(state, 'p1', ['north_africa', 'egypt'], 1)
  assignTerritories(state, 'p1', ['north_africa'], fromArmies)
  assignTerritories(state, 'p2', ['brazil'], toArmies)
  state.currentPlayerIndex = 0
  state.phase = { kind: 'attack' }
  return state
}

function attackBrazil(state: GameState) {
  return applyAction(state, { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' })
}

function rolls(events: GameEvent[]): DiceRolled[] {
  return events.filter((event): event is DiceRolled => event.type === 'diceRolled')
}

describe('resolveRoll', () => {
  it('lets the attacker win both pairs with 6-5-1 against 4-4', () => {
    expect(resolveRoll([1, 6, 5], [4, 4])).toEqual({
      attackerDice: [6, 5, 1],
      defenderDice: [4, 4],
      attackerLosses: 0,
      defenderLosses: 2,
    })
  })

  it('gives ties to the defender', () => {
    expect(resolveRoll([5, 3], [2, 5])).toMatchObject({ attackerLosses: 1, defenderLosses: 1 })
  })

  it('compares as many pairs as the smaller side has dice', () => {
    const outcome = resolveRoll([6, 6, 6], [1])
    expect(outcome.attackerLosses + outcome.defenderLosses).toBe(1)
  })
})

describe('resolveRoll with a defender bonus', () => {
  it('turns 6-2 against 5-1 on a capital into one loss on each side', () => {
    expect(resolveRoll([6, 2], [5, 1], 1)).toEqual({
      attackerDice: [6, 2],
      defenderDice: [5, 1],
      attackerLosses: 1,
      defenderLosses: 1,
    })
  })

  it('adds the bonus to the highest defending die only', () => {
    expect(resolveRoll([2, 2], [1, 1], 1)).toMatchObject({ attackerLosses: 1, defenderLosses: 1 })
  })

  it('changes nothing without a bonus', () => {
    expect(resolveRoll([6, 2], [5, 1], 0)).toEqual(resolveRoll([6, 2], [5, 1]))
    expect(resolveRoll([6, 2], [5, 1])).toMatchObject({ attackerLosses: 0, defenderLosses: 2 })
  })
})

describe('defense bonus of a capital', () => {
  function capitalBattle(capitals: Record<string, string>, seed = 1): GameState {
    const state = battle(30, 20, seed, { capitals: true })
    assignTerritories(state, 'p3', ['argentina'], 1)
    state.capitals = capitals
    return state
  }

  function rollsOf(state: GameState): DiceRolled[] {
    const result = attackBrazil(state)
    if (!result.ok) throw new Error(result.error.code)
    return rolls(result.events)
  }

  it('applies to every roll against a capital and records the dice as rolled', () => {
    for (const seed of [1, 2, 3]) {
      const events = rollsOf(capitalBattle({ p1: 'egypt', p2: 'brazil', p3: 'argentina' }, seed))
      expect(events.length).toBeGreaterThan(0)
      for (const roll of events) {
        expect(roll.defenderBonus).toBe(1)
        expect(resolveRoll(roll.attackerDice, roll.defenderDice, 1)).toMatchObject({
          attackerLosses: roll.attackerLosses,
          defenderLosses: roll.defenderLosses,
        })
        expect(roll.defenderDice.every((die) => die >= 1 && die <= 6)).toBe(true)
      }
    }
  })

  it('protects the current holder of a captured capital', () => {
    const state = capitalBattle({ p1: 'egypt', p2: 'argentina', p3: 'brazil' })
    expect(state.territories.brazil?.owner).toBe('p2')
    expect(rollsOf(state).every((roll) => roll.defenderBonus === 1)).toBe(true)
  })

  it('does not apply to an ordinary territory', () => {
    const events = rollsOf(capitalBattle({ p1: 'egypt', p2: 'peru', p3: 'argentina' }))
    expect(events.every((roll) => roll.defenderBonus === 0)).toBe(true)
  })

  it('never applies in a classic game', () => {
    const result = attackBrazil(battle(30, 20))
    expect(result.ok && rolls(result.events).every((roll) => roll.defenderBonus === 0)).toBe(true)
  })
})

describe('attack conditions', () => {
  it('rejects an origin with a single army', () => {
    expect(attackBrazil(battle(1, 3))).toMatchObject({ ok: false, error: { code: 'NOT_ENOUGH_ARMIES' } })
  })

  it('rejects a target that is not adjacent', () => {
    const result = applyAction(battle(5, 3), { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'india' })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_ADJACENT' } })
  })

  it('rejects an attack on an own territory', () => {
    const result = applyAction(battle(5, 3), { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'egypt' })
    expect(result).toMatchObject({ ok: false, error: { code: 'OWN_TERRITORY' } })
  })

  it('rejects an origin owned by someone else', () => {
    const result = applyAction(battle(5, 3), { type: 'attack', playerId: 'p1', from: 'brazil', to: 'north_africa' })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_OWNER' } })
  })
})

describe('conquest', () => {
  const conquered = attackBrazil(battle(100, 1))

  it('gives the territory to the attacker', () => {
    expect(conquered.ok).toBe(true)
    if (!conquered.ok) return
    expect(conquered.state.territories.brazil).toEqual({ owner: 'p1', armies: 0 })
    expect(conquered.state.conqueredThisTurn).toBe(true)
  })

  it('waits for a move between the dice of the last roll and the origin armies minus one', () => {
    if (!conquered.ok) return
    const last = rolls(conquered.events).at(-1)
    const origin = conquered.state.territories.north_africa?.armies ?? 0
    expect(conquered.state.phase).toEqual({
      kind: 'conquestMove',
      from: 'north_africa',
      to: 'brazil',
      minArmies: last?.attackerDice.length,
      maxArmies: origin - 1,
    })
  })

  it('emits the rolls then the conquest, in that order', () => {
    if (!conquered.ok) return
    expect(conquered.events.at(-1)).toEqual({
      type: 'territoryConquered',
      playerId: 'p1',
      previousOwner: 'p2',
      from: 'north_africa',
      to: 'brazil',
    })
    expect(conquered.events.slice(0, -1).every((event) => event.type === 'diceRolled')).toBe(true)
  })

  it('moves the chosen armies and resumes the attack phase', () => {
    if (!conquered.ok || conquered.state.phase.kind !== 'conquestMove') return
    const { maxArmies } = conquered.state.phase
    const origin = conquered.state.territories.north_africa?.armies ?? 0
    const result = applyAction(conquered.state, { type: 'moveAfterConquest', playerId: 'p1', armies: maxArmies })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories.brazil).toEqual({ owner: 'p1', armies: maxArmies })
    expect(result.state.territories.north_africa?.armies).toBe(origin - maxArmies)
    expect(result.state.phase).toEqual({ kind: 'attack' })
    expect(result.events).toEqual([
      { type: 'conquestMoved', playerId: 'p1', from: 'north_africa', to: 'brazil', armies: maxArmies },
    ])
  })

  it('rejects a move below the dice of the last roll', () => {
    if (!conquered.ok) return
    const result = applyAction(conquered.state, { type: 'moveAfterConquest', playerId: 'p1', armies: 2 })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARMY_COUNT' } })
  })

  it('rejects a move that would empty the origin', () => {
    if (!conquered.ok) return
    const origin = conquered.state.territories.north_africa?.armies ?? 0
    const result = applyAction(conquered.state, { type: 'moveAfterConquest', playerId: 'p1', armies: origin })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARMY_COUNT' } })
  })

  it('rejects any other action before the move', () => {
    if (!conquered.ok) return
    const result = applyAction(conquered.state, { type: 'attack', playerId: 'p1', from: 'egypt', to: 'east_africa' })
    expect(result).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } })
  })
})

describe('attack running to the end', () => {
  it('stops when the origin is down to one army, leaving the target to its owner', () => {
    const result = attackBrazil(battle(2, 100))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories.north_africa?.armies).toBe(1)
    expect(result.state.territories.brazil?.owner).toBe('p2')
    expect(result.state.phase).toEqual({ kind: 'attack' })
  })

  it('always ends with a conquest or an origin down to one army', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const result = attackBrazil(battle(6, 4, seed))
      if (!result.ok) throw new Error(result.error.code)
      const conquest = result.state.territories.brazil?.owner === 'p1'
      expect(conquest || result.state.territories.north_africa?.armies === 1).toBe(true)
    }
  })

  it('emits one event per roll whose losses add up to the armies lost', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const result = attackBrazil(battle(8, 6, seed))
      if (!result.ok) throw new Error(result.error.code)
      const events = rolls(result.events)
      const attackerLost = events.reduce((sum, roll) => sum + roll.attackerLosses, 0)
      const defenderLost = events.reduce((sum, roll) => sum + roll.defenderLosses, 0)
      expect(result.state.territories.north_africa?.armies).toBe(8 - attackerLost)
      expect(result.state.territories.brazil?.armies).toBe(6 - defenderLost)
      expect(events.every((roll) => roll.from === 'north_africa' && roll.to === 'brazil')).toBe(true)
    }
  })

  it.each([
    [{}, 3, 2],
    [{ defenderMaxDice: 3 }, 3, 3],
    [{ attackerMaxDice: 2, defenderMaxDice: 1 }, 2, 1],
  ])('recomputes the dice of each side before every roll with settings %o', (settings, maxA, maxD) => {
    for (let seed = 1; seed <= 100; seed++) {
      const result = attackBrazil(battle(4, 5, seed, settings))
      if (!result.ok) throw new Error(result.error.code)
      let attackers = 4
      let defenders = 5
      for (const roll of rolls(result.events)) {
        expect(roll.attackerDice).toHaveLength(Math.min(maxA, attackers - 1))
        expect(roll.defenderDice).toHaveLength(Math.min(maxD, defenders))
        attackers -= roll.attackerLosses
        defenders -= roll.defenderLosses
      }
    }
  })

  it('rolls 3 dice from 4 armies, then 2 dice once down to 3 armies', () => {
    const sequences = new Set<string>()
    for (let seed = 1; seed <= 100; seed++) {
      const result = attackBrazil(battle(4, 20, seed))
      if (!result.ok) throw new Error(result.error.code)
      sequences.add(rolls(result.events).map((roll) => roll.attackerDice.length).join(''))
    }
    expect([...sequences].some((sequence) => sequence.startsWith('32'))).toBe(true)
    expect([...sequences].every((sequence) => sequence.startsWith('3'))).toBe(true)
  })

  it('rolls a single defending die when the target has one army', () => {
    const result = attackBrazil(battle(10, 1))
    if (!result.ok) throw new Error(result.error.code)
    expect(rolls(result.events)[0]?.defenderDice).toHaveLength(1)
  })
})

describe('endAttack', () => {
  it('moves on to the fortification phase', () => {
    const result = applyAction(battle(5, 3), { type: 'endAttack', playerId: 'p1' })
    expect(result).toMatchObject({ ok: true, state: { phase: { kind: 'fortify' } } })
  })
})
