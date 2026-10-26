import { describe, expect, it } from 'vitest'
import { attackTargets, classicMap, CONQUER_24_TERRITORIES, generalMissions, type GameState } from '../engine'
import { playerView } from './playerView'
import { newAiGame, territoryCard } from './testScenarios'

const GENERAL_MISSIONS = generalMissions(classicMap)

function gameWithHands(): GameState {
  const state = newAiGame(['normal', 'normal', 'normal'], 7)
  state.hands = {
    p1: [territoryCard(1, 'infantry', 'alaska'), territoryCard(2, 'cavalry', 'peru')],
    p2: [territoryCard(3, 'artillery', 'egypt'), territoryCard(4, 'infantry', 'china'), territoryCard(5, 'cavalry', 'japan')],
    p3: [],
  }
  return state
}

describe('playerView', () => {
  it('reduces the hands of the opponents to their size', () => {
    const view = playerView(gameWithHands(), 'p1')
    expect(view).not.toHaveProperty('hands')
    expect(view.handSizes).toEqual({ p1: 2, p2: 3, p3: 0 })
  })

  it('keeps the hand of the viewer', () => {
    const view = playerView(gameWithHands(), 'p1')
    expect(view.viewer).toBe('p1')
    expect(view.hand.map((card) => card.id)).toEqual([1, 2])
  })

  it('leaves out the deck, the discard pile and the generator state', () => {
    const view = playerView(gameWithHands(), 'p1')
    expect(view).not.toHaveProperty('deck')
    expect(view).not.toHaveProperty('discard')
    expect(view).not.toHaveProperty('rngState')
  })

  it('keeps the public state', () => {
    const state = gameWithHands()
    const view = playerView(state, 'p1')
    expect(view.territories).toEqual(state.territories)
    expect(view.phase).toEqual(state.phase)
    expect(view.players).toEqual(state.players)
    expect(view.tradeCount).toBe(state.tradeCount)
    expect(view.settings).toEqual(state.settings)
  })

  it('serializes the same way whatever the hidden information and the territory insertion order', () => {
    const state = gameWithHands()
    const other = structuredClone(state)
    other.deck = [...other.deck].reverse()
    other.rngState += 1
    other.territories = Object.fromEntries(Object.entries(other.territories).reverse())
    other.hands.p2 = [territoryCard(30, 'infantry', 'brazil'), territoryCard(31, 'infantry', 'iceland'), territoryCard(32, 'infantry', 'ural')]
    expect(JSON.stringify(playerView(other, 'p1'))).toBe(JSON.stringify(playerView(state, 'p1')))
  })

  it('keeps the mission of the viewer and none of the others', () => {
    const state = newAiGame(['normal', 'normal', 'normal'], 7, { secretMissions: true })
    state.missions = { p1: CONQUER_24_TERRITORIES, p2: { kind: 'eliminate', target: 'p1' }, p3: GENERAL_MISSIONS[0]! }
    const view = playerView(state, 'p1')
    expect(view.ownMission).toEqual(CONQUER_24_TERRITORIES)
    expect(view).not.toHaveProperty('missions')
    const other = structuredClone(state)
    other.missions = { ...state.missions, p2: GENERAL_MISSIONS[3]!, p3: { kind: 'eliminate', target: 'p2' } }
    expect(JSON.stringify(playerView(other, 'p1'))).toBe(JSON.stringify(view))
  })

  it('shows the viewer its own pending capital only', () => {
    const state = newAiGame(['normal', 'normal', 'normal'], 7, { capitals: true })
    state.phase = { kind: 'capitalChoice', pending: { p1: 'egypt', p2: 'brazil' } }
    expect(playerView(state, 'p1').phase).toEqual({ kind: 'capitalChoice', pending: { p1: 'egypt' } })
    expect(playerView(state, 'p3').phase).toEqual({ kind: 'capitalChoice', pending: {} })
    expect(playerView(state, 'p3').capitals).toBeNull()
    const other = structuredClone(state)
    other.phase = { kind: 'capitalChoice', pending: { p1: 'peru' } }
    expect(JSON.stringify(playerView(other, 'p3'))).toBe(JSON.stringify(playerView(state, 'p3')))
  })

  it('shows the revealed capitals to everybody', () => {
    const state = newAiGame(['normal', 'normal', 'normal'], 7, { capitals: true })
    state.capitals = { p1: 'egypt', p2: 'brazil', p3: 'peru' }
    expect(playerView(state, 'p2').capitals).toEqual({ p1: 'egypt', p2: 'brazil', p3: 'peru' })
  })

  it('has no mission without secret missions', () => {
    expect(playerView(gameWithHands(), 'p1').ownMission).toBeNull()
  })

  it('can be given to the queries of the engine', () => {
    const view = playerView(gameWithHands(), 'p1')
    const origin = classicMap.territoryIds.find((id) => view.territories[id]?.owner === 'p1' && view.territories[id].armies > 1)
    expect(origin).toBeDefined()
    expect(attackTargets(view, origin as string).every((target) => view.territories[target]?.owner !== 'p1')).toBe(true)
  })
})
