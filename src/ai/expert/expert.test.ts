import { describe, expect, it } from 'vitest'
import { applyAction, areAdjacent, classicMap, type Action, type GameState } from '../../engine'
import { chooseHeuristicAction, MAX_ATTACKS_PER_TURN, NEW_TURN, nextAiAction, progressAfter, type TurnProgress } from '../index'
import { playerView } from '../playerView'
import { newAiGame, scenario, territoryCard } from '../testScenarios'
import { expertAction, expertCandidates, type ExpertBudget } from './expert'

const SMALL_BUDGET: ExpertBudget = { samples: 3, offensiveDeployments: 3, defensiveDeployments: 2, attacks: 4 }
const MAX_CANDIDATES = 6

type Moment = { state: GameState; turn: TurnProgress }

function midGameMoments(): Moment[] {
  const moments: Moment[] = []
  let state = newAiGame(['hard', 'hard', 'hard'], 21)
  let turn = NEW_TURN
  for (let i = 0; i < 400 && state.phase.kind !== 'gameOver'; i++) {
    if (i % 20 === 0 && (state.phase.kind === 'reinforce' || state.phase.kind === 'attack')) {
      moments.push({ state, turn })
    }
    const action = nextAiAction(state, turn)
    if (action === null) {
      break
    }
    const result = applyAction(state, action)
    if (!result.ok) {
      throw new Error(result.error.message)
    }
    turn = progressAfter(turn, action, result.events)
    state = result.state
  }
  return moments
}

function viewOf(state: GameState) {
  return playerView(state, state.players[state.currentPlayerIndex]?.id ?? '')
}

function expert(state: GameState, turn: TurnProgress = NEW_TURN): Action {
  return expertAction(viewOf(state), turn, SMALL_BUDGET)
}

function hard(state: GameState, turn: TurnProgress = NEW_TURN): Action {
  return chooseHeuristicAction(viewOf(state), 'hard', turn)
}

function candidates(state: GameState, turn: TurnProgress = NEW_TURN): Action[] {
  return expertCandidates(viewOf(state), turn, SMALL_BUDGET)
}

function withOtherHiddenCards(state: GameState): GameState {
  const other = structuredClone(state)
  const opponents = other.players.filter((player, index) => index !== other.currentPlayerIndex)
  const pool = [...other.deck, ...opponents.flatMap((player) => other.hands[player.id] ?? [])].reverse()
  for (const player of opponents) {
    other.hands[player.id] = pool.splice(0, other.hands[player.id]?.length ?? 0)
  }
  other.deck = pool
  other.rngState += 1
  return other
}

function attackPhase(layout: Parameters<typeof scenario>[0]['layout']): GameState {
  return scenario({ layout, phase: { kind: 'attack' } })
}

const strongNeighborhood = Object.fromEntries(
  classicMap.territoryIds
    .filter((id) => id !== 'alaska' && areAdjacent(classicMap, 'alaska', id))
    .map((id): [string, [string, number]] => [id, ['p2', 10]]),
)

const moments = midGameMoments()

describe('expertCandidates', () => {
  it('starts with the choice of the hard level, without duplicates', () => {
    for (const { state, turn } of moments) {
      const list = candidates(state, turn)
      expect(list[0]).toEqual(hard(state, turn))
      expect(new Set(list.map((action) => JSON.stringify(action))).size).toBe(list.length)
      expect(list.length).toBeLessThanOrEqual(MAX_CANDIDATES)
    }
  })

  it('considers ending its attacks next to a likely conquest', () => {
    const list = candidates(attackPhase({ alaska: ['p1', 10], kamchatka: ['p2', 2] }))
    expect(list).toContainEqual({ type: 'endAttack', playerId: 'p1' })
    expect(list).toContainEqual({ type: 'attack', playerId: 'p1', from: 'alaska', to: 'kamchatka' })
  })

  it('leaves out an attack with a probability of conquest below 0.25', () => {
    const list = candidates(attackPhase({ ...strongNeighborhood, alaska: ['p1', 2] }))
    expect(list.some((action) => action.type === 'attack')).toBe(false)
  })

  it('stops attacking once the attack limit of the turn is reached', () => {
    const turn = { attacks: MAX_ATTACKS_PER_TURN, conquests: 0 }
    expect(candidates(attackPhase({ alaska: ['p1', 10], kamchatka: ['p2', 2] }), turn)).toEqual([
      { type: 'endAttack', playerId: 'p1' },
    ])
  })

  it('deploys the whole reserve on each alternative territory', () => {
    const state = scenario({ layout: { alaska: ['p1', 3], kamchatka: ['p2', 2], peru: ['p1', 2] }, phase: { kind: 'reinforce', reserve: 6 } })
    const alternatives = candidates(state).slice(1)
    expect(alternatives.length).toBeGreaterThan(0)
    for (const action of alternatives) {
      expect(action).toMatchObject({ type: 'deploy', armies: 6 })
    }
  })

  it('searches neither fortifying, nor moving after a conquest, nor trading cards', () => {
    const fortify = scenario({ layout: { alaska: ['p1', 10] }, phase: { kind: 'fortify' } })
    const move = scenario({
      layout: { alaska: ['p1', 8], kamchatka: ['p1', 3] },
      phase: { kind: 'conquestMove', from: 'alaska', to: 'kamchatka', minArmies: 3, maxArmies: 7 },
    })
    const trade = scenario({
      layout: { alaska: ['p1', 3] },
      phase: { kind: 'reinforce', reserve: 3 },
      hands: {
        p1: [
          territoryCard(0, 'infantry', 'alaska'),
          territoryCard(1, 'infantry', 'peru'),
          territoryCard(2, 'infantry', 'brazil'),
          territoryCard(3, 'cavalry', 'egypt'),
          territoryCard(4, 'artillery', 'china'),
        ],
      },
    })
    for (const state of [fortify, move, trade]) {
      expect(candidates(state)).toEqual([hard(state)])
    }
  })
})

describe('expertAction', () => {
  it('plays legal actions', () => {
    for (const { state, turn } of moments) {
      const action = expert(state, turn)
      expect(applyAction(state, action).ok, `${action.type} rejected`).toBe(true)
    }
  })

  it('always plays the same action from the same view', () => {
    for (const { state, turn } of moments.slice(0, 4)) {
      expect(expert(state, turn)).toEqual(expert(structuredClone(state), turn))
    }
  })

  it('ignores the opponent hands, the deck and the game generator', () => {
    for (const { state, turn } of moments.slice(0, 4)) {
      expect(expert(withOtherHiddenCards(state), turn)).toEqual(expert(state, turn))
    }
  })

  it('plays like the hard level when it has a single candidate', () => {
    const state = scenario({ layout: { alaska: ['p1', 10] }, phase: { kind: 'fortify' } })
    expect(expert(state)).toEqual(hard(state))
  })
})
