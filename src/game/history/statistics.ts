import type { GameEvent, GameState, PlayerId } from '../../engine'

const TERRITORY_BONUS = 2

/** Territories and armies of a player at a turn start. */
export type PlayerSnapshot = {
  territories: number
  armies: number
}

/** Snapshot of every non-neutral player at the start of a turn. */
export type TurnSnapshot = {
  turn: number
  players: Record<PlayerId, PlayerSnapshot>
}

/** Running totals of a player over the game. */
export type PlayerCounters = {
  conquests: number
  armiesLost: number
  armiesDestroyed: number
  attacks: number
  bestDieRolls: number
  trades: number
  armiesFromTrades: number
  eliminatedAtTurn: number | null
}

/** Statistics of a game: a snapshot per turn and counters per non-neutral player. */
export type GameStatistics = {
  snapshots: TurnSnapshot[]
  counters: Record<PlayerId, PlayerCounters>
}

const NO_COUNTS: PlayerCounters = {
  conquests: 0,
  armiesLost: 0,
  armiesDestroyed: 0,
  attacks: 0,
  bestDieRolls: 0,
  trades: 0,
  armiesFromTrades: 0,
  eliminatedAtTurn: null,
}

function snapshot(state: GameState, turn: number): TurnSnapshot {
  const players: Record<PlayerId, PlayerSnapshot> = {}
  for (const player of state.players.filter((candidate) => !candidate.isNeutral)) {
    players[player.id] = { territories: 0, armies: 0 }
  }
  for (const territory of Object.values(state.territories)) {
    const totals = players[territory.owner]
    if (totals !== undefined) {
      totals.territories += 1
      totals.armies += territory.armies
    }
  }
  return { turn, players }
}

/** Statistics of a new game, with the snapshot of its first turn when it opens on it. */
export function initialStatistics(state: GameState, turn: number): GameStatistics {
  return {
    snapshots: turn > 0 ? [snapshot(state, turn)] : [],
    counters: Object.fromEntries(
      state.players.filter((player) => !player.isNeutral).map((player) => [player.id, { ...NO_COUNTS }]),
    ),
  }
}

/**
 * Statistics once `events` have happened, `stateAfter` being the engine state they led to and
 * `turn` the turn number before them; `statistics` is left untouched.
 */
export function recordStatistics(
  statistics: GameStatistics,
  events: GameEvent[],
  stateAfter: GameState,
  turn: number,
): GameStatistics {
  const counters = structuredClone(statistics.counters)
  const snapshots = [...statistics.snapshots]
  const add = (playerId: PlayerId, changes: Partial<Record<Exclude<keyof PlayerCounters, 'eliminatedAtTurn'>, number>>) => {
    const playerCounters = counters[playerId]
    if (playerCounters === undefined) {
      return
    }
    for (const [key, value] of Object.entries(changes) as [keyof typeof changes, number][]) {
      playerCounters[key] += value
    }
  }
  let currentTurn = turn
  const attacker = events.find((event) => event.type === 'diceRolled')
  if (attacker?.type === 'diceRolled') {
    add(attacker.attacker, { attacks: 1 })
  }

  for (const event of events) {
    switch (event.type) {
      case 'turnStarted':
        currentTurn += 1
        snapshots.push(snapshot(stateAfter, currentTurn))
        break
      case 'diceRolled':
        add(event.attacker, {
          armiesLost: event.attackerLosses,
          armiesDestroyed: event.defenderLosses,
          bestDieRolls: (event.attackerDice[0] ?? 0) > (event.defenderDice[0] ?? 0) ? 1 : 0,
        })
        add(event.defender, { armiesLost: event.defenderLosses, armiesDestroyed: event.attackerLosses })
        break
      case 'territoryConquered':
        add(event.playerId, { conquests: 1 })
        break
      case 'cardsTraded':
        add(event.playerId, {
          trades: 1,
          armiesFromTrades: event.armies + (event.bonusTerritory === null ? 0 : TERRITORY_BONUS),
        })
        break
      case 'playerEliminated': {
        const eliminated = counters[event.playerId]
        if (eliminated !== undefined) {
          eliminated.eliminatedAtTurn = currentTurn
        }
        break
      }
    }
  }
  return { snapshots, counters }
}

/** Players from the winner to the first eliminated: the winner, then the others in reverse order of elimination. */
export function finalRanking(statistics: GameStatistics, winner: PlayerId | null): PlayerId[] {
  const eliminationTurn = (playerId: PlayerId) => statistics.counters[playerId]?.eliminatedAtTurn ?? Infinity
  return Object.keys(statistics.counters).sort((a, b) => {
    if (a === winner || b === winner) {
      return a === winner ? -1 : 1
    }
    return eliminationTurn(b) - eliminationTurn(a)
  })
}
