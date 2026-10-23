import {
  applyAction,
  classicMap,
  CONQUER_24_TERRITORIES,
  createGame,
  type Action,
  type AiLevel,
  type Card,
  type GameSettings,
  type GameState,
  type Mission,
  type Phase,
  type PlayerConfig,
  type PlayerId,
  type TerritoryId,
} from '../engine'
import { chooseAction } from './index'
import { playerView } from './playerView'
import type { TurnProgress } from './strategy'

const COLORS = ['#d64541', '#3a7bd5', '#3fa34d', '#e3b23c', '#8e5cc4', '#e8803a']

export function aiPlayers(levels: AiLevel[]): PlayerConfig[] {
  return levels.map((level, i) => ({
    id: `p${i + 1}`,
    name: `IA ${i + 1}`,
    color: COLORS[i] ?? '#000000',
    kind: 'ai',
    level,
  }))
}

export function newAiGame(levels: AiLevel[], seed = 1, settings: Partial<GameSettings> = {}): GameState {
  const created = createGame({ players: aiPlayers(levels), seed, settings })
  if (!created.ok) {
    throw new Error(created.error.message)
  }
  return created.state
}

export type Scenario = {
  layout: Record<TerritoryId, [PlayerId, number]>
  phase: Phase
  current?: PlayerId
  filler?: PlayerId
  playerCount?: number
  hands?: Record<PlayerId, Card[]>
  settings?: Partial<GameSettings>
  missions?: Record<PlayerId, Mission>
}

export function scenario({
  layout,
  phase,
  current = 'p1',
  filler = 'p2',
  playerCount = 3,
  hands = {},
  settings = {},
  missions,
}: Scenario): GameState {
  const state = newAiGame(Array.from({ length: playerCount }, () => 'normal'), 1, settings)
  for (const id of classicMap.territoryIds) {
    const [owner, armies] = layout[id] ?? [filler, 1]
    state.territories[id] = { owner, armies }
  }
  state.currentPlayerIndex = state.players.findIndex((player) => player.id === current)
  state.phase = phase
  state.hands = { ...state.hands, ...hands }
  state.missions = missions ?? null
  return state
}

export function mustEliminateCarol(withMission: boolean): GameState {
  return scenario({
    layout: {
      indonesia: ['p1', 7],
      new_guinea: ['p1', 8],
      western_australia: ['p1', 1],
      siam: ['p3', 4],
      china: ['p3', 9],
      eastern_australia: ['p2', 3],
      alaska: ['p2', 9],
    },
    phase: { kind: 'attack' },
    filler: 'p4',
    playerCount: 4,
    missions: withMission
      ? { p1: { kind: 'eliminate', target: 'p3' }, p2: CONQUER_24_TERRITORIES, p3: CONQUER_24_TERRITORIES, p4: CONQUER_24_TERRITORIES }
      : undefined,
  })
}

export function territoryCard(id: number, symbol: 'infantry' | 'cavalry' | 'artillery', territory: TerritoryId): Card {
  return { id, symbol, territory }
}

export function decide(state: GameState, level: AiLevel, turn: TurnProgress = { attacks: 0, conquests: 0 }): Action {
  const playerId = state.players[state.currentPlayerIndex]?.id ?? ''
  return chooseAction(playerView(state, playerId), level, turn)
}

export function applyOrThrow(state: GameState, action: Action): GameState {
  const result = applyAction(state, action)
  if (!result.ok) {
    throw new Error(`${action.type} rejected: ${result.error.message}`)
  }
  return result.state
}

export type Step = {
  before: GameState
  action: Action
}

export function playWhile(
  state: GameState,
  level: AiLevel,
  keepGoing: (state: GameState) => boolean,
): { state: GameState; steps: Step[] } {
  const steps: Step[] = []
  let current = state
  while (keepGoing(current) && steps.length < 500) {
    const action = decide(current, level)
    steps.push({ before: current, action })
    current = applyOrThrow(current, action)
  }
  return { state: current, steps }
}
