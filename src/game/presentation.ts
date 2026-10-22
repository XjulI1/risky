import type { GameEvent, GameState, TerritoryId } from '../engine'
import type { AnimationDurations } from './animationSpeed'

type DiceRolled = Extract<GameEvent, { type: 'diceRolled' }>
type TerritoryConquered = Extract<GameEvent, { type: 'territoryConquered' }>
type ConquestMoved = Extract<GameEvent, { type: 'conquestMoved' }>

/** One animated beat of an engine answer, applied to the displayed state when it ends. */
export type PresentationStep =
  | { kind: 'roll'; event: DiceRolled; rollIndex: number }
  | { kind: 'conquest'; event: TerritoryConquered }
  | { kind: 'armyMove'; event: ConquestMoved }

/** Animated steps of an engine answer, in order; events without animation are left to the final state. */
export function presentationSteps(events: GameEvent[]): PresentationStep[] {
  const steps: PresentationStep[] = []
  let rollIndex = 0
  for (const event of events) {
    if (event.type === 'diceRolled') {
      steps.push({ kind: 'roll', event, rollIndex })
      rollIndex += 1
      continue
    }
    rollIndex = 0
    if (event.type === 'territoryConquered') {
      steps.push({ kind: 'conquest', event })
    } else if (event.type === 'conquestMoved') {
      steps.push({ kind: 'armyMove', event })
    }
  }
  return steps
}

/** How long a step lasts at the given speed. */
export function stepDuration(step: PresentationStep, durations: AnimationDurations): number {
  switch (step.kind) {
    case 'roll':
      return step.rollIndex === 0 ? durations.firstRoll : durations.nextRoll
    case 'conquest':
      return durations.conquest
    case 'armyMove':
      return durations.armyMove
  }
}

function withArmies(state: GameState, changes: [TerritoryId, number][]): GameState {
  const territories = { ...state.territories }
  for (const [id, delta] of changes) {
    const territory = territories[id]
    if (territory !== undefined) {
      territories[id] = { ...territory, armies: territory.armies + delta }
    }
  }
  return { ...state, territories }
}

/** The displayed state once `step` has played, leaving `state` untouched. */
export function projectStep(state: GameState, step: PresentationStep): GameState {
  switch (step.kind) {
    case 'roll':
      return withArmies(state, [
        [step.event.from, -step.event.attackerLosses],
        [step.event.to, -step.event.defenderLosses],
      ])
    case 'armyMove':
      return withArmies(state, [
        [step.event.from, -step.event.armies],
        [step.event.to, step.event.armies],
      ])
    case 'conquest': {
      const territory = state.territories[step.event.to]
      if (territory === undefined) {
        return state
      }
      return { ...state, territories: { ...state.territories, [step.event.to]: { ...territory, owner: step.event.playerId } } }
    }
  }
}
