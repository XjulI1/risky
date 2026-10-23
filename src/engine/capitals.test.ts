import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { NEUTRAL_PLAYER_ID } from './setup'
import { currentPlayer } from './state'
import { apply, assignTerritories, createTestGame, giveAllTerritoriesTo, ownedBy } from './testUtils'
import type { ActionResult, GameEvent, GameState, PlayerId } from './types'

function capitalsGame(playerCount = 3, seed = 1): GameState {
  return createTestGame(playerCount, { seed, settings: { capitals: true } })
}

function firstTerritoryOf(state: GameState, playerId: PlayerId): string {
  return ownedBy(state, playerId)[0] as string
}

function chooseFirstTerritory(state: GameState) {
  const playerId = currentPlayer(state).id
  return applyAction(state, { type: 'chooseCapital', playerId, territory: firstTerritoryOf(state, playerId) })
}

function chooseAll(state: GameState): GameState {
  let current = state
  while (current.phase.kind === 'capitalChoice') {
    const playerId = currentPlayer(current).id
    current = apply(current, { type: 'chooseCapital', playerId, territory: firstTerritoryOf(current, playerId) })
  }
  return current
}

describe('capital choice', () => {
  const start = capitalsGame()
  const chooser = currentPlayer(start).id

  it('records the territory as the pending capital of the player and passes to the next player', () => {
    const result = chooseFirstTerritory(start)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.phase).toEqual({ kind: 'capitalChoice', pending: { [chooser]: firstTerritoryOf(start, chooser) } })
    expect(result.state.currentPlayerIndex).toBe((start.currentPlayerIndex + 1) % 3)
  })

  it('tells that a choice was made without telling which territory', () => {
    const result = chooseFirstTerritory(start)
    expect(result.ok && result.events).toEqual([{ type: 'capitalChosen', playerId: chooser }])
  })

  it('keeps the capitals hidden until the last choice', () => {
    const state = apply(start, { type: 'chooseCapital', playerId: chooser, territory: firstTerritoryOf(start, chooser) })
    expect(state.capitals).toBeNull()
  })

  it('rejects a territory owned by another player', () => {
    const other = start.players.find((player) => player.id !== chooser)?.id ?? ''
    const result = applyAction(start, { type: 'chooseCapital', playerId: chooser, territory: firstTerritoryOf(start, other) })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_OWNER' } })
  })

  it('rejects an unknown territory', () => {
    const result = applyAction(start, { type: 'chooseCapital', playerId: chooser, territory: 'atlantis' })
    expect(result).toMatchObject({ ok: false, error: { code: 'UNKNOWN_TERRITORY' } })
  })

  it('rejects a choice outside of the capital choice phase', () => {
    const state = createTestGame(3)
    const playerId = currentPlayer(state).id
    const result = applyAction(state, { type: 'chooseCapital', playerId, territory: firstTerritoryOf(state, playerId) })
    expect(result).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } })
  })

  it('rejects any other action during the capital choice', () => {
    const result = applyAction(start, { type: 'deploy', playerId: chooser, territory: firstTerritoryOf(start, chooser), armies: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } })
  })
})

describe('capital reveal', () => {
  it('reveals every capital at once after the last choice and opens the first turn', () => {
    const start = capitalsGame(3, 4)
    let state = start
    for (let i = 0; i < 2; i++) {
      state = apply(state, { type: 'chooseCapital', playerId: currentPlayer(state).id, territory: firstTerritoryOf(state, currentPlayer(state).id) })
    }
    const last = currentPlayer(state).id
    const result = chooseFirstTerritory(state)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const expected = Object.fromEntries(start.players.map((player) => [player.id, firstTerritoryOf(start, player.id)]))
    expect(result.state.capitals).toEqual(expected)
    expect(result.events).toEqual([
      { type: 'capitalChosen', playerId: last },
      { type: 'capitalsRevealed', capitals: expected },
      expect.objectContaining({ type: 'turnStarted', playerId: start.players[start.firstPlayerIndex]?.id }),
    ])
    expect(result.state.phase.kind).toBe('reinforce')
    expect(result.state.currentPlayerIndex).toBe(start.firstPlayerIndex)
  })

  it('gives no capital to the neutral army in a 2-player game', () => {
    const start = capitalsGame(2)
    const state = chooseAll(start)
    expect(Object.keys(state.capitals ?? {}).sort()).toEqual(['p1', 'p2'])
    expect(state.capitals).not.toHaveProperty(NEUTRAL_PLAYER_ID)
    expect(state.phase.kind).toBe('reinforce')
  })

  it('lets each non-neutral player choose once, starting with the first player', () => {
    const start = capitalsGame(5, 3)
    const choosers: PlayerId[] = []
    let state = start
    while (state.phase.kind === 'capitalChoice') {
      choosers.push(currentPlayer(state).id)
      state = apply(state, { type: 'chooseCapital', playerId: currentPlayer(state).id, territory: firstTerritoryOf(state, currentPlayer(state).id) })
    }
    const order = start.players.map((_, i) => start.players[(start.firstPlayerIndex + i) % 5]?.id)
    expect(choosers).toEqual(order)
  })
})

function capitalsBoard(capitals: Record<PlayerId, string>, playerCount = 3, current: PlayerId = 'p1'): GameState {
  const state = createTestGame(playerCount, { settings: { capitals: true } })
  giveAllTerritoriesTo(state, playerCount === 2 ? NEUTRAL_PLAYER_ID : 'p3')
  assignTerritories(state, 'p2', ['alaska', 'kamchatka'])
  state.capitals = capitals
  state.currentPlayerIndex = state.players.findIndex((player) => player.id === current)
  state.phase = { kind: 'attack' }
  return state
}

function succeed(result: ActionResult): Extract<ActionResult, { ok: true }> {
  if (!result.ok) throw new Error(result.error.code)
  return result
}

function attack(state: GameState, playerId: PlayerId, from: string, to: string) {
  return succeed(applyAction(state, { type: 'attack', playerId, from, to }))
}

function eventsOfType<T extends GameEvent['type']>(events: GameEvent[], type: T): Extract<GameEvent, { type: T }>[] {
  return events.filter((event): event is Extract<GameEvent, { type: T }> => event.type === type)
}

describe('capital capture', () => {
  function aliceAgainstBobsCapital(): GameState {
    const state = capitalsBoard({ p1: 'egypt', p2: 'brazil', p3: 'peru' })
    assignTerritories(state, 'p1', ['north_africa'], 60)
    assignTerritories(state, 'p1', ['egypt'], 3)
    assignTerritories(state, 'p2', ['brazil'], 1)
    return state
  }

  it('tells whose capital was taken right after the conquest', () => {
    const { events } = attack(aliceAgainstBobsCapital(), 'p1', 'north_africa', 'brazil')
    const conquest = events.findIndex((event) => event.type === 'territoryConquered')
    expect(events[conquest + 1]).toEqual({ type: 'capitalCaptured', by: 'p1', from: 'p2', territory: 'brazil' })
  })

  it('does not eliminate a player who loses its capital', () => {
    const { state, events } = attack(aliceAgainstBobsCapital(), 'p1', 'north_africa', 'brazil')
    expect(state.players.find((player) => player.id === 'p2')?.eliminated).toBe(false)
    expect(eventsOfType(events, 'playerEliminated')).toEqual([])
    expect(state.phase.kind).toBe('conquestMove')
    expect(state.capitals).toEqual({ p1: 'egypt', p2: 'brazil', p3: 'peru' })
  })

  it('tells nothing when an ordinary territory is conquered', () => {
    const { events } = attack(aliceAgainstBobsCapital(), 'p1', 'north_africa', 'western_europe')
    expect(eventsOfType(events, 'capitalCaptured')).toEqual([])
  })

  it('gives its capital back to a player who reconquers it', () => {
    const start = capitalsBoard({ p1: 'egypt', p2: 'brazil', p3: 'peru' }, 3, 'p2')
    assignTerritories(start, 'p1', ['brazil'], 1)
    assignTerritories(start, 'p2', ['venezuela'], 60)
    const { state, events } = attack(start, 'p2', 'venezuela', 'brazil')
    expect(eventsOfType(events, 'capitalCaptured')).toEqual([{ type: 'capitalCaptured', by: 'p2', from: 'p2', territory: 'brazil' }])
    expect(state.territories.brazil?.owner).toBe('p2')
  })
})

describe('victory by the capitals', () => {
  it('ends the game when the last capital is taken, moving the minimum armies', () => {
    const start = capitalsBoard({ p1: 'egypt', p2: 'peru', p3: 'brazil' })
    assignTerritories(start, 'p1', ['egypt', 'peru'], 2)
    assignTerritories(start, 'p1', ['north_africa'], 60)
    assignTerritories(start, 'p3', ['brazil'], 1)
    const { state, events } = attack(start, 'p1', 'north_africa', 'brazil')
    expect(state.phase).toEqual({ kind: 'gameOver' })
    expect(state.winner).toBe('p1')
    expect(state.winReason).toBe('capitals')
    const lastRoll = eventsOfType(events, 'diceRolled').at(-1)
    expect(eventsOfType(events, 'conquestMoved')).toEqual([
      { type: 'conquestMoved', playerId: 'p1', from: 'north_africa', to: 'brazil', armies: lastRoll?.attackerDice.length },
    ])
    expect(Object.values(state.territories).every((territory) => territory.armies >= 1)).toBe(true)
    expect(events.at(-1)).toEqual({ type: 'gameWon', playerId: 'p1' })
  })

  it('goes on while the player lacks its own capital', () => {
    const start = capitalsBoard({ p1: 'egypt', p2: 'peru', p3: 'brazil' })
    assignTerritories(start, 'p1', ['peru'], 2)
    assignTerritories(start, 'p2', ['egypt'], 2)
    assignTerritories(start, 'p1', ['north_africa'], 60)
    assignTerritories(start, 'p3', ['brazil'], 1)
    const { state } = attack(start, 'p1', 'north_africa', 'brazil')
    expect(state.phase.kind).toBe('conquestMove')
    expect(state.winner).toBeNull()
  })

  it('ends a 2-player game when a player holds both capitals, the neutral army having none', () => {
    const start = capitalsBoard({ p1: 'egypt', p2: 'brazil' }, 2)
    assignTerritories(start, 'p1', ['egypt'], 2)
    assignTerritories(start, 'p1', ['north_africa'], 60)
    assignTerritories(start, 'p2', ['brazil'], 1)
    const { state } = attack(start, 'p1', 'north_africa', 'brazil')
    expect(state.winner).toBe('p1')
    expect(state.winReason).toBe('capitals')
  })

  it('keeps the elimination of every opponent as a domination victory', () => {
    const start = capitalsBoard({ p1: 'egypt', p2: 'peru', p3: 'brazil' })
    start.players = start.players.map((player) => (player.id === 'p2' ? { ...player, eliminated: true } : player))
    giveAllTerritoriesTo(start, 'p1', 2)
    assignTerritories(start, 'p1', ['north_africa'], 60)
    assignTerritories(start, 'p3', ['brazil'], 1)
    const { state } = attack(start, 'p1', 'north_africa', 'brazil')
    expect(state.winner).toBe('p1')
    expect(state.winReason).toBe('domination')
  })

  it("does not check another player's capitals during the current turn", () => {
    const start = capitalsBoard({ p1: 'egypt', p2: 'peru', p3: 'brazil' })
    assignTerritories(start, 'p3', ['egypt', 'peru'], 2)
    assignTerritories(start, 'p1', ['north_africa'], 2)
    start.phase = { kind: 'reinforce', reserve: 3 }
    const { state } = succeed(applyAction(start, { type: 'deploy', playerId: 'p1', territory: 'north_africa', armies: 3 }))
    expect(state.winner).toBeNull()
  })
})
