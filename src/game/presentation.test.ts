import { describe, expect, it } from 'vitest'
import { applyAction, createGame, type GameEvent, type GameState } from '../engine'
import { ANIMATION_DURATIONS } from './animationSpeed'
import { presentationSteps, projectStep, stepDuration } from './presentation'

function attackingGame(fromArmies: number, toArmies: number, seed = 1): GameState {
  const created = createGame({
    seed,
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  for (const id of Object.keys(state.territories)) {
    state.territories[id] = { owner: 'p2', armies: 1 }
  }
  state.territories.north_africa = { owner: 'p1', armies: fromArmies }
  state.territories.brazil = { owner: 'p2', armies: toArmies }
  state.currentPlayerIndex = 0
  state.phase = { kind: 'attack' }
  return state
}

const roll: Extract<GameEvent, { type: 'diceRolled' }> = {
  type: 'diceRolled',
  attacker: 'p1',
  defender: 'p2',
  from: 'north_africa',
  to: 'brazil',
  attackerDice: [6, 5, 1],
  defenderDice: [4, 4],
  defenderBonus: 0,
  attackerLosses: 0,
  defenderLosses: 2,
}

describe('presentationSteps', () => {
  it('turns a roll into a dice step that removes the losses of both territories', () => {
    const state = attackingGame(5, 4)
    const [step] = presentationSteps([roll])
    expect(step).toEqual({ kind: 'roll', event: roll, rollIndex: 0 })
    const projected = projectStep(state, step!)
    expect(projected.territories.north_africa?.armies).toBe(5)
    expect(projected.territories.brazil?.armies).toBe(2)
    expect(state.territories.brazil?.armies).toBe(4)
  })

  it('turns a conquest into a color change step', () => {
    const state = attackingGame(5, 0)
    const conquest: GameEvent = {
      type: 'territoryConquered',
      playerId: 'p1',
      previousOwner: 'p2',
      from: 'north_africa',
      to: 'brazil',
    }
    const steps = presentationSteps([conquest])
    expect(steps).toEqual([{ kind: 'conquest', event: conquest }])
    expect(projectStep(state, steps[0]!).territories.brazil?.owner).toBe('p1')
  })

  it('turns a conquest move into an army move step', () => {
    const state = attackingGame(5, 0)
    const move: GameEvent = { type: 'conquestMoved', playerId: 'p1', from: 'north_africa', to: 'brazil', armies: 3 }
    const projected = projectStep(state, presentationSteps([move])[0]!)
    expect(projected.territories.north_africa?.armies).toBe(2)
    expect(projected.territories.brazil?.armies).toBe(3)
  })

  it('keeps the rolls of an attack in order and numbers them', () => {
    const steps = presentationSteps([roll, roll, roll, roll])
    expect(steps.map((step) => (step.kind === 'roll' ? step.rollIndex : -1))).toEqual([0, 1, 2, 3])
  })

  it('ignores events that need no animation', () => {
    expect(presentationSteps([{ type: 'armiesDeployed', playerId: 'p1', territory: 'peru', armies: 3 }])).toEqual([])
  })

  it('projects the steps of real attacks onto the very territories of the engine', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const state = attackingGame(9, 4, seed)
      const result = applyAction(state, { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' })
      if (!result.ok) throw new Error(result.error.message)
      const projected = presentationSteps(result.events).reduce(projectStep, state)
      expect(projected.territories).toEqual(result.state.territories)
    }
  })
})

describe('stepDuration', () => {
  it('plays the first roll of an attack slower than the following ones', () => {
    const durations = ANIMATION_DURATIONS.normal
    const [first, second] = presentationSteps([roll, roll])
    expect(stepDuration(first!, durations)).toBe(durations.firstRoll)
    expect(stepDuration(second!, durations)).toBe(durations.nextRoll)
  })
})
