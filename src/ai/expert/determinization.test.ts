import { describe, expect, it } from 'vitest'
import type { GameState } from '../../engine'
import { aiRandom } from '../aiRandom'
import { playerView, type PlayerView } from '../playerView'
import { newAiGame, territoryCard } from '../testScenarios'
import { determinize } from './determinization'

const KNOWN_CARD_IDS = [0, 1, 5, 7, 9, 12]

function gameWithHands(): GameState {
  const state = newAiGame(['expert', 'hard', 'hard'], 3)
  state.hands = {
    p1: [territoryCard(0, 'infantry', 'alaska'), territoryCard(1, 'cavalry', 'northwest_territory')],
    p2: [territoryCard(5, 'artillery', 'alberta'), territoryCard(7, 'infantry', 'ontario'), territoryCard(9, 'cavalry', 'quebec')],
    p3: [territoryCard(12, 'infantry', 'peru')],
  }
  state.deck = state.deck.filter((card) => !KNOWN_CARD_IDS.includes(card.id))
  return state
}

function worldOf(view: PlayerView): GameState {
  return determinize(view, aiRandom(view, 'expert'))
}

describe('determinize', () => {
  it('builds a state the viewer cannot tell apart from the real one', () => {
    const view = playerView(gameWithHands(), 'p1')
    expect(JSON.stringify(playerView(worldOf(view), 'p1'))).toBe(JSON.stringify(view))
  })

  it('deals every card of the game once', () => {
    const world = worldOf(playerView(gameWithHands(), 'p1'))
    const ids = [...world.deck, ...world.discard, ...Object.values(world.hands).flat()].map((card) => card.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(44)
  })

  it('keeps the hand of the viewer and the size of the other hands', () => {
    const world = worldOf(playerView(gameWithHands(), 'p1'))
    expect(world.hands.p1?.map((card) => card.id)).toEqual([0, 1])
    expect(world.hands.p2).toHaveLength(3)
    expect(world.hands.p3).toHaveLength(1)
  })

  it('deals the other hands from the cards the viewer cannot see', () => {
    const world = worldOf(playerView(gameWithHands(), 'p1'))
    const dealt = [...(world.hands.p2 ?? []), ...(world.hands.p3 ?? [])].map((card) => card.id)
    expect(dealt).not.toContain(0)
    expect(dealt).not.toContain(1)
  })

  it('does not share its territories with the view', () => {
    const view = playerView(gameWithHands(), 'p1')
    const world = worldOf(view)
    world.territories.alaska!.armies += 10
    expect(view.territories.alaska?.armies).not.toBe(world.territories.alaska?.armies)
  })

  it('draws the same world from the same view', () => {
    const view = playerView(gameWithHands(), 'p1')
    expect(worldOf(view)).toEqual(worldOf(view))
  })
})
