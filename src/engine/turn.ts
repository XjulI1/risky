import { drawCard } from './cards'
import { CONQUER_24_TERRITORIES } from './missions'
import { reinforcementCount } from './reinforcement'
import { currentPlayer, isInPlay, playerById, territoriesOf } from './state'
import type { GameEvent, GameState, Player, PlayerId } from './types'

export function nextPlayerIndex(
  state: GameState,
  fromIndex: number,
  isEligible: (player: Player) => boolean = isInPlay,
): number {
  const count = state.players.length
  for (let offset = 1; offset <= count; offset++) {
    const index = (fromIndex + offset) % count
    const player = state.players[index]
    if (player !== undefined && isEligible(player)) {
      return index
    }
  }
  return -1
}

export function startTurn(state: GameState, playerIndex: number, events: GameEvent[]): void {
  state.currentPlayerIndex = playerIndex
  state.conqueredThisTurn = false
  const player = currentPlayer(state)
  const reserve = reinforcementCount(state, player.id)
  state.phase = { kind: 'reinforce', reserve }
  events.push({ type: 'turnStarted', playerId: player.id, reserve })
}

export function endTurn(state: GameState, events: GameEvent[]): void {
  if (state.conqueredThisTurn) {
    drawCard(state, currentPlayer(state).id, events)
  }
  startTurn(state, nextPlayerIndex(state, state.currentPlayerIndex), events)
}

export function eliminateIfDefeated(state: GameState, playerId: PlayerId, by: PlayerId, events: GameEvent[]): boolean {
  const player = playerById(state, playerId)
  if (player === undefined || player.eliminated || territoriesOf(state, playerId).length > 0) {
    return false
  }
  player.eliminated = true
  const taken = state.hands[playerId] ?? []
  state.hands[by] = [...(state.hands[by] ?? []), ...taken]
  state.hands[playerId] = []
  events.push({ type: 'playerEliminated', playerId, by, cardsTaken: taken.length })
  convertMissionsTargeting(state, playerId, by, events)
  return true
}

function convertMissionsTargeting(state: GameState, eliminated: PlayerId, by: PlayerId, events: GameEvent[]): void {
  const missions = state.missions ?? {}
  for (const [holder, mission] of Object.entries(missions)) {
    if (mission.kind === 'eliminate' && mission.target === eliminated && holder !== by) {
      missions[holder] = CONQUER_24_TERRITORIES
      events.push({ type: 'missionConverted', playerId: holder })
    }
  }
}

export function isLastStanding(state: GameState): boolean {
  return state.players.filter(isInPlay).length === 1
}

export function declareWinner(state: GameState, events: GameEvent[]): void {
  const winner = state.players.find(isInPlay)
  if (winner === undefined) {
    return
  }
  state.phase = { kind: 'gameOver' }
  state.winner = winner.id
  state.winReason = 'domination'
  events.push({ type: 'gameWon', playerId: winner.id })
}
