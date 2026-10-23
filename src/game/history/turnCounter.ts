import type { GameEvent, GameState } from '../../engine'

const SETUP_PHASES = new Set(['claim', 'placement'])

/** Turn number of a new game: 0 during the set-up, 1 when it opens on the first turn. */
export function initialTurnNumber(state: GameState): number {
  return SETUP_PHASES.has(state.phase.kind) ? 0 : 1
}

/** Turn number once `events` have happened, a turn being the turn of one player. */
export function nextTurnNumber(turn: number, events: GameEvent[]): number {
  return turn + events.filter((event) => event.type === 'turnStarted').length
}
