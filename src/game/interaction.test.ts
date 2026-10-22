import { describe, expect, it } from 'vitest'
import { attackOrigins, classicMap, createGame, type Card, type GameSettings, type GameState } from '../engine'
import { IDLE, reduceInteraction, viewOf, type Interaction, type InteractionInput } from './interaction'

function game(settings: Partial<GameSettings> = {}): GameState {
  const created = createGame({
    seed: 8,
    settings,
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'human' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  created.state.currentPlayerIndex = 0
  return created.state
}

function board(phase: GameState['phase'], owned: Record<string, number>, settings: Partial<GameSettings> = {}): GameState {
  const state = game(settings)
  for (const id of classicMap.territoryIds) {
    state.territories[id] = { owner: 'p2', armies: 2 }
  }
  for (const [id, armies] of Object.entries(owned)) {
    state.territories[id] = { owner: 'p1', armies }
  }
  state.phase = phase
  return state
}

const tap = (territory: string): InteractionInput => ({ kind: 'territory', territory })
const ocean: InteractionInput = { kind: 'ocean' }

function selectable(state: GameState, interaction: Interaction = IDLE): string[] {
  const { highlights } = viewOf(state, interaction)
  return Object.entries(highlights)
    .filter(([, highlight]) => highlight === 'selectable')
    .map(([id]) => id)
    .sort()
}

function cards(count: number): Card[] {
  return Array.from({ length: count }, (_, i) => ({ id: i, symbol: 'infantry', territory: 'japan' }))
}

describe('setup', () => {
  it('offers the free territories during the claim', () => {
    const state = game({ territoryDistribution: 'choice' })
    state.territories.egypt = { owner: 'p2', armies: 1 }
    const offered = selectable(state)
    expect(offered).toHaveLength(41)
    expect(offered).not.toContain('egypt')
  })

  it('claims a free territory on tap', () => {
    const state = game({ territoryDistribution: 'choice' })
    expect(reduceInteraction(state, IDLE, tap('egypt'))).toEqual({
      interaction: IDLE,
      action: { type: 'claimTerritory', playerId: 'p1', territory: 'egypt' },
    })
  })

  it('ignores a tap on a territory already taken', () => {
    const state = game({ territoryDistribution: 'choice' })
    state.territories.egypt = { owner: 'p2', armies: 1 }
    expect(reduceInteraction(state, IDLE, tap('egypt'))).toEqual({ interaction: IDLE })
  })

  it.each(['random', 'choice'] as const)('offers own territories and places an army on tap after a %s distribution', (distribution) => {
    const state = board({ kind: 'placement', remaining: { p1: 12, p2: 12, p3: 12 } }, { egypt: 1, peru: 1 }, {
      territoryDistribution: distribution,
    })
    expect(selectable(state)).toEqual(['egypt', 'peru'])
    expect(reduceInteraction(state, IDLE, tap('peru')).action).toEqual({
      type: 'placeInitialArmy',
      playerId: 'p1',
      territory: 'peru',
    })
    expect(viewOf(state, IDLE).armiesToPlace).toBe(12)
  })
})

describe('reinforcement', () => {
  const reinforcing = () => board({ kind: 'reinforce', reserve: 5 }, { egypt: 3, peru: 1 })

  it('offers own territories', () => {
    expect(selectable(reinforcing())).toEqual(['egypt', 'peru'])
  })

  it('opens an amount picker bounded by the reserve on tap', () => {
    const state = reinforcing()
    const { interaction } = reduceInteraction(state, IDLE, tap('egypt'))
    expect(interaction).toEqual({ kind: 'deployAmount', territory: 'egypt' })
    expect(viewOf(state, interaction).panel).toMatchObject({ kind: 'amount', purpose: 'deploy', min: 1, max: 5, initial: 1 })
    expect(viewOf(state, interaction).highlights.egypt).toBe('selected')
  })

  it('deploys the chosen amount on confirm', () => {
    const state = reinforcing()
    expect(reduceInteraction(state, { kind: 'deployAmount', territory: 'egypt' }, { kind: 'confirm', amount: 3 })).toEqual({
      interaction: IDLE,
      action: { type: 'deploy', playerId: 'p1', territory: 'egypt', armies: 3 },
    })
  })

  it('cancels the picker on the ocean', () => {
    expect(reduceInteraction(reinforcing(), { kind: 'deployAmount', territory: 'egypt' }, ocean)).toEqual({ interaction: IDLE })
  })

  it('offers no deployment while a trade is required', () => {
    const state = reinforcing()
    state.hands.p1 = cards(5)
    expect(selectable(state)).toEqual([])
    expect(viewOf(state, IDLE).panel).toEqual({ kind: 'tradeRequired' })
    expect(reduceInteraction(state, IDLE, tap('egypt'))).toEqual({ interaction: IDLE })
  })
})

describe('attack', () => {
  const attacking = () => board({ kind: 'attack' }, { north_africa: 5, egypt: 1, middle_east: 3 })

  it('offers only legal origins', () => {
    const state = attacking()
    expect(selectable(state)).toEqual(attackOrigins(state, 'p1').sort())
    expect(selectable(state)).not.toContain('egypt')
  })

  it('selects an origin and marks its enemy neighbors as targets', () => {
    const state = attacking()
    const { interaction } = reduceInteraction(state, IDLE, tap('north_africa'))
    expect(interaction).toEqual({ kind: 'attackFrom', from: 'north_africa' })
    const { highlights } = viewOf(state, interaction)
    expect(highlights.north_africa).toBe('selected')
    const targets = Object.entries(highlights).filter(([, h]) => h === 'target').map(([id]) => id).sort()
    expect(targets).toEqual(['brazil', 'congo', 'east_africa', 'southern_europe', 'western_europe'])
  })

  it('opens a confirmation panel with origin, target and their armies', () => {
    const state = attacking()
    const { interaction } = reduceInteraction(state, { kind: 'attackFrom', from: 'north_africa' }, tap('brazil'))
    expect(interaction).toEqual({ kind: 'attackPanel', from: 'north_africa', to: 'brazil' })
    expect(viewOf(state, interaction).panel).toEqual({
      kind: 'attackConfirm',
      from: 'north_africa',
      to: 'brazil',
      fromArmies: 5,
      toArmies: 2,
      label: 'Attaquer Brésil (2) depuis Afrique du Nord (5)',
    })
  })

  it('attacks on confirm', () => {
    expect(reduceInteraction(attacking(), { kind: 'attackPanel', from: 'north_africa', to: 'brazil' }, { kind: 'confirm' })).toEqual({
      interaction: IDLE,
      action: { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' },
    })
  })

  it.each([
    ['the ocean', ocean],
    ['the origin again', tap('north_africa')],
  ])('cancels the selection on %s', (_, input) => {
    expect(reduceInteraction(attacking(), { kind: 'attackFrom', from: 'north_africa' }, input)).toEqual({ interaction: IDLE })
  })

  it('switches to another legal origin', () => {
    expect(reduceInteraction(attacking(), { kind: 'attackFrom', from: 'north_africa' }, tap('middle_east')).interaction).toEqual({
      kind: 'attackFrom',
      from: 'middle_east',
    })
  })

  it('drops a selection whose origin is exhausted', () => {
    const state = attacking()
    state.territories.north_africa = { owner: 'p1', armies: 1 }
    expect(viewOf(state, { kind: 'attackFrom', from: 'north_africa' }).interaction).toEqual(IDLE)
    expect(selectable(state, { kind: 'attackFrom', from: 'north_africa' })).toEqual(['middle_east'])
  })

  it('ends the attacks on the dedicated button', () => {
    const state = attacking()
    expect(viewOf(state, IDLE).buttons.endAttack).toBe(true)
    expect(reduceInteraction(state, { kind: 'attackFrom', from: 'north_africa' }, { kind: 'endAttack' })).toEqual({
      interaction: IDLE,
      action: { type: 'endAttack', playerId: 'p1' },
    })
  })
})

describe('conquest move', () => {
  const moving = () =>
    board({ kind: 'conquestMove', from: 'north_africa', to: 'brazil', minArmies: 3, maxArmies: 7 }, { north_africa: 8, brazil: 0 })

  it('shows a picker bounded by the engine and set to the maximum', () => {
    expect(viewOf(moving(), IDLE).panel).toMatchObject({ kind: 'amount', purpose: 'conquest', min: 3, max: 7, initial: 7 })
  })

  it('moves the chosen armies on confirm', () => {
    expect(reduceInteraction(moving(), IDLE, { kind: 'confirm', amount: 7 }).action).toEqual({
      type: 'moveAfterConquest',
      playerId: 'p1',
      armies: 7,
    })
  })

  it('offers nothing else on the board', () => {
    expect(selectable(moving())).toEqual([])
    expect(reduceInteraction(moving(), IDLE, tap('egypt'))).toEqual({ interaction: IDLE })
  })
})

describe('fortification', () => {
  const fortifying = (fortifyMode: 'adjacent' | 'connected') =>
    board({ kind: 'fortify' }, { north_africa: 4, egypt: 1, middle_east: 1 }, { fortifyMode })

  it.each([
    ['adjacent', ['egypt']],
    ['connected', ['egypt', 'middle_east']],
  ] as const)('marks the destinations of the %s mode', (mode, destinations) => {
    const state = fortifying(mode)
    expect(selectable(state)).toEqual(['north_africa'])
    const { interaction } = reduceInteraction(state, IDLE, tap('north_africa'))
    const { highlights } = viewOf(state, interaction)
    expect(Object.entries(highlights).filter(([, h]) => h === 'target').map(([id]) => id).sort()).toEqual([...destinations])
  })

  it('opens an amount picker bounded by the origin armies minus one, set to the maximum', () => {
    const state = fortifying('connected')
    const { interaction } = reduceInteraction(state, { kind: 'fortifyFrom', from: 'north_africa' }, tap('middle_east'))
    expect(interaction).toEqual({ kind: 'fortifyAmount', from: 'north_africa', to: 'middle_east' })
    expect(viewOf(state, interaction).panel).toMatchObject({ kind: 'amount', purpose: 'fortify', min: 1, max: 3, initial: 3 })
  })

  it('fortifies on confirm', () => {
    const state = fortifying('connected')
    expect(reduceInteraction(state, { kind: 'fortifyAmount', from: 'north_africa', to: 'egypt' }, { kind: 'confirm', amount: 2 }).action).toEqual({
      type: 'fortify',
      playerId: 'p1',
      from: 'north_africa',
      to: 'egypt',
      armies: 2,
    })
  })

  it('skips the fortification on the dedicated button', () => {
    const state = fortifying('adjacent')
    expect(viewOf(state, IDLE).buttons.skipFortify).toBe(true)
    expect(reduceInteraction(state, IDLE, { kind: 'skipFortify' }).action).toEqual({ type: 'skipFortify', playerId: 'p1' })
  })
})
