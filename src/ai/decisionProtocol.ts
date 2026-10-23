import type { Action, AiLevel } from '../engine'
import type { PlayerView } from './playerView'
import type { TurnProgress } from './strategy'

/** A decision asked to the AI worker: the view of the player to decide for, its level and the progress of its turn. */
export type DecisionRequest = {
  id: number
  view: PlayerView
  level: AiLevel
  turn: TurnProgress
}

/** The answer of the AI worker to the request of the same `id`: the chosen action, or why none could be chosen. */
export type DecisionResponse = { id: number; action: Action } | { id: number; error: string }
