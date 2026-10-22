import { describe, expect, it } from 'vitest'
import { applyAction } from './index'
import { classicMap } from './maps/classic'
import { NEUTRAL_PLAYER_ID } from './setup'
import { currentPlayer } from './state'
import { apply, armiesOf, claimAll, createTestGame, freeTerritories, ownedBy, placeAll } from './testUtils'

describe('territory claim (distribution by choice)', () => {
  const start = createTestGame(3, { settings: { territoryDistribution: 'choice', armyPlacement: 'manual' } })

  it('starts with every territory free, on the first player', () => {
    expect(start.phase.kind).toBe('claim')
    expect(Object.keys(start.territories)).toHaveLength(0)
    expect(start.currentPlayerIndex).toBe(start.firstPlayerIndex)
  })

  it('gives a free territory with one army to the claiming player and passes the turn', () => {
    const playerId = currentPlayer(start).id
    const result = applyAction(start, { type: 'claimTerritory', playerId, territory: 'egypt' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories.egypt).toEqual({ owner: playerId, armies: 1 })
    expect(result.state.currentPlayerIndex).toBe((start.currentPlayerIndex + 1) % 3)
    expect(result.events).toEqual([{ type: 'territoryClaimed', playerId, territory: 'egypt' }])
    if (result.state.phase.kind === 'claim') {
      expect(result.state.phase.remaining[playerId]).toBe(34)
    }
  })

  it('rejects a territory that already has an owner', () => {
    const afterFirst = apply(start, {
      type: 'claimTerritory',
      playerId: currentPlayer(start).id,
      territory: 'egypt',
    })
    const result = applyAction(afterFirst, {
      type: 'claimTerritory',
      playerId: currentPlayer(afterFirst).id,
      territory: 'egypt',
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'TERRITORY_TAKEN' } })
  })

  it('rejects an unknown territory', () => {
    const result = applyAction(start, {
      type: 'claimTerritory',
      playerId: currentPlayer(start).id,
      territory: 'atlantis',
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'UNKNOWN_TERRITORY' } })
  })

  it('leaves 28 territories to claim when the neutral army already holds 14', () => {
    const twoPlayers = createTestGame(2, { settings: { territoryDistribution: 'choice' } })
    expect(ownedBy(twoPlayers, NEUTRAL_PLAYER_ID)).toHaveLength(14)
    expect(freeTerritories(twoPlayers)).toHaveLength(28)
  })

  it('never gives the claim turn to the neutral army', () => {
    let state = createTestGame(2, { settings: { territoryDistribution: 'choice' } })
    while (state.phase.kind === 'claim') {
      expect(currentPlayer(state).isNeutral).toBe(false)
      state = apply(state, {
        type: 'claimTerritory',
        playerId: currentPlayer(state).id,
        territory: freeTerritories(state)[0] as string,
      })
    }
  })

  it('opens the placement phase on the first player once the last territory is claimed', () => {
    const state = claimAll(start)
    expect(freeTerritories(state)).toHaveLength(0)
    expect(state.phase.kind).toBe('placement')
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
  })
})

describe('initial army placement', () => {
  const start = createTestGame(4, { settings: { armyPlacement: 'manual' } })

  it('adds one army on an owned territory and passes the turn', () => {
    const playerId = currentPlayer(start).id
    const territory = ownedBy(start, playerId)[0] as string
    const result = applyAction(start, { type: 'placeInitialArmy', playerId, territory })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.territories[territory]?.armies).toBe(2)
    expect(result.events).toEqual([{ type: 'initialArmyPlaced', playerId, territory }])
    expect(result.state.currentPlayerIndex).toBe((start.currentPlayerIndex + 1) % 4)
  })

  it('rejects a territory owned by another player', () => {
    const playerId = currentPlayer(start).id
    const enemyTerritory = classicMap.territoryIds.find((id) => start.territories[id]?.owner !== playerId)
    const result = applyAction(start, {
      type: 'placeInitialArmy',
      playerId,
      territory: enemyTerritory as string,
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'NOT_OWNER' } })
  })

  it('skips players who have no army left to place', () => {
    let state = start
    while (state.phase.kind === 'placement') {
      const player = currentPlayer(state)
      expect(state.phase.remaining[player.id]).toBeGreaterThan(0)
      state = apply(state, {
        type: 'placeInitialArmy',
        playerId: player.id,
        territory: ownedBy(state, player.id)[0] as string,
      })
    }
  })

  it.each([
    [5, 25],
    [4, 30],
  ])('ends with exactly the initial armies on the board with %i players', (count, armies) => {
    const state = placeAll(createTestGame(count, { settings: { armyPlacement: 'manual' } }))
    for (const player of state.players) {
      expect(armiesOf(state, player.id)).toBe(armies)
    }
  })

  it('ends with 40 armies each for both players and the neutral army', () => {
    const state = placeAll(
      claimAll(createTestGame(2, { settings: { territoryDistribution: 'choice', armyPlacement: 'manual' } })),
    )
    expect(armiesOf(state, 'p1')).toBe(40)
    expect(armiesOf(state, 'p2')).toBe(40)
    expect(armiesOf(state, NEUTRAL_PLAYER_ID)).toBe(40)
  })

  it('opens the reinforcement phase of the first player at the end of the setup', () => {
    const state = placeAll(start)
    expect(state.phase.kind).toBe('reinforce')
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
  })
})
