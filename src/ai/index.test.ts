import { describe, expect, it } from 'vitest'
import { applyAction, createGame, type AiLevel, type GameSettings, type GameState } from '../engine'
import { expertAction } from './expert/expert'
import { chooseAction, chooseHeuristicAction, MAX_ATTACKS_PER_TURN, NEW_TURN, nextAiAction, playUntilHumanOrEnd, progressAfter } from './index'
import { playerView } from './playerView'
import { aiPlayers, newAiGame, scenario, territoryCard } from './testScenarios'

const LEVELS: AiLevel[] = ['easy', 'normal', 'hard']

function midGameStates(): GameState[] {
  const states: GameState[] = []
  let state = newAiGame(['easy', 'normal', 'hard'], 11, { territoryDistribution: 'choice', armyPlacement: 'manual' })
  let turn = NEW_TURN
  for (let i = 0; i < 400 && state.phase.kind !== 'gameOver'; i++) {
    if (i % 20 === 0) {
      states.push(state)
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
  return states
}

function decideAs(state: GameState, level: AiLevel) {
  const playerId = state.players[state.currentPlayerIndex]?.id ?? ''
  return chooseAction(playerView(state, playerId), level)
}

function otherOpponent(state: GameState): string {
  return state.players.find((player, index) => index !== state.currentPlayerIndex && !player.isNeutral)?.id ?? ''
}

describe('chooseAction', () => {
  const states = midGameStates()

  it('covers every phase of the game', () => {
    expect(new Set(states.map((state) => state.phase.kind)).size).toBeGreaterThanOrEqual(4)
  })

  it('chooses the same action whatever the cards in the hands of the opponents', () => {
    for (const state of states) {
      const opponent = otherOpponent(state)
      const other = structuredClone(state)
      other.hands[opponent] = (state.hands[opponent] ?? []).map((card, index) =>
        territoryCard(100 + index, index % 2 === 0 ? 'artillery' : 'cavalry', 'japan'),
      )
      for (const level of LEVELS) {
        expect(decideAs(other, level)).toEqual(decideAs(state, level))
      }
    }
  })

  it('chooses the same action whatever the order of the deck and the generator state', () => {
    for (const state of states) {
      const other = structuredClone(state)
      other.deck = [...other.deck].reverse()
      other.discard = [...other.discard].reverse()
      other.rngState = (other.rngState + 12345) | 0
      for (const level of LEVELS) {
        expect(decideAs(other, level)).toEqual(decideAs(state, level))
      }
    }
  })

  it('chooses the same action for the same view', () => {
    for (const state of states) {
      for (const level of LEVELS) {
        expect(decideAs(structuredClone(state), level)).toEqual(decideAs(state, level))
      }
    }
  })

  it(`ends its attacks after ${MAX_ATTACKS_PER_TURN} attacks in the turn`, () => {
    const state = scenario({ layout: { indonesia: ['p1', 30], siam: ['p2', 1] }, phase: { kind: 'attack' } })
    const view = playerView(state, 'p1')
    for (const level of LEVELS) {
      expect(chooseAction(view, level, { attacks: MAX_ATTACKS_PER_TURN - 1, conquests: 0 }).type).toBe('attack')
      expect(chooseAction(view, level, { attacks: MAX_ATTACKS_PER_TURN, conquests: 0 })).toEqual({
        type: 'endAttack',
        playerId: 'p1',
      })
    }
  })
})

function expertDecisionsAgainstHard(settings: Partial<GameSettings>, actionCount: number) {
  const decisions: { expert: unknown; hard: unknown }[] = []
  let state = newAiGame(['expert', 'hard', 'hard'], 13, settings)
  let turn = NEW_TURN
  for (let i = 0; i < actionCount && state.phase.kind !== 'gameOver'; i++) {
    const view = playerView(state, state.players[state.currentPlayerIndex]?.id ?? '')
    const hardChoice = chooseHeuristicAction(view, 'hard', turn)
    if (view.viewer === 'p1') {
      decisions.push({ expert: chooseAction(view, 'expert', turn), hard: hardChoice })
    }
    const result = applyAction(state, hardChoice)
    if (!result.ok) {
      throw new Error(result.error.message)
    }
    turn = progressAfter(turn, hardChoice, result.events)
    state = result.state
  }
  return decisions
}

describe('chooseAction at the expert level', () => {
  it('plays the action of the expert search in the classic mode', () => {
    for (const state of midGameStates().filter((s) => s.phase.kind === 'reinforce' || s.phase.kind === 'attack').slice(0, 3)) {
      const view = playerView(state, state.players[state.currentPlayerIndex]?.id ?? '')
      expect(chooseAction(view, 'expert')).toEqual(expertAction(view))
    }
  })

  it.each([
    { variant: 'secret missions', settings: { secretMissions: true } },
    { variant: 'capitals', settings: { capitals: true } },
  ])('plays exactly like the hard level with $variant', ({ settings }) => {
    const decisions = expertDecisionsAgainstHard(settings, 300)
    expect(decisions.length).toBeGreaterThan(20)
    for (const { expert, hard } of decisions) {
      expect(expert).toEqual(hard)
    }
  })
})

describe('progressAfter', () => {
  it('counts the attacks and conquests of the turn and starts over with a new turn', () => {
    const attack = { type: 'attack', playerId: 'p1', from: 'indonesia', to: 'siam' } as const
    const conquered = { type: 'territoryConquered', playerId: 'p1', previousOwner: 'p2', from: 'indonesia', to: 'siam' } as const
    expect(progressAfter(NEW_TURN, attack, [conquered])).toEqual({ attacks: 1, conquests: 1 })
    expect(progressAfter({ attacks: 1, conquests: 1 }, attack, [])).toEqual({ attacks: 2, conquests: 1 })
    expect(
      progressAfter({ attacks: 2, conquests: 1 }, { type: 'skipFortify', playerId: 'p1' }, [
        { type: 'turnStarted', playerId: 'p2', reserve: 3 },
      ]),
    ).toEqual(NEW_TURN)
  })
})

describe('playUntilHumanOrEnd', () => {
  it('stops on the turn of a human', () => {
    const players = aiPlayers(['normal', 'normal', 'normal'])
    players[1] = { id: 'p2', name: 'Humain', color: players[1]?.color ?? '#000', kind: 'human' }
    const created = createGame({ players, seed: 4 })
    if (!created.ok) {
      throw new Error(created.error.message)
    }
    const result = playUntilHumanOrEnd(created.state)
    expect(result.rejection).toBeNull()
    const current = result.state.players[result.state.currentPlayerIndex]
    expect(current?.kind === 'human' || result.state.phase.kind === 'gameOver').toBe(true)
    expect(nextAiAction(result.state, NEW_TURN)).toBeNull()
  })

  it('plays a game between AIs up to the victory', () => {
    const result = playUntilHumanOrEnd(newAiGame(['normal', 'hard', 'easy'], 21), { maxTurns: 500 })
    expect(result.rejection).toBeNull()
    expect(result.state.phase.kind).toBe('gameOver')
    expect(result.state.winner).not.toBeNull()
  })
})
