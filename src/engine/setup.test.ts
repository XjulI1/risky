import { describe, expect, it } from 'vitest'
import { classicMap } from './maps/classic'
import { CONQUER_24_TERRITORIES } from './missions'
import { createGame, dealMissions, DEFAULT_SETTINGS, NEUTRAL_PLAYER_ID } from './setup'
import { armiesOf, claimAll, createTestGame, ownedBy, placeAll, testPlayers } from './testUtils'
import type { Mission, PlayerConfig } from './types'

describe('createGame', () => {
  it('creates a game with the players in the given order', () => {
    const state = createTestGame(4)
    expect(state.players.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(state.players.every((p) => !p.isNeutral && !p.eliminated)).toBe(true)
    expect(state.winner).toBeNull()
  })

  it.each([1, 7])('rejects %i players', (count) => {
    const result = createGame({ players: testPlayers(count), seed: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PLAYER_COUNT' } })
  })

  it('rejects duplicate player identifiers', () => {
    const players = testPlayers(3)
    players[2] = { ...players[2]!, id: 'p1' }
    const result = createGame({ players, seed: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'DUPLICATE_PLAYER' } })
  })

  it('rejects duplicate colors', () => {
    const players = testPlayers(3)
    players[2] = { ...players[2]!, color: players[0]!.color }
    const result = createGame({ players, seed: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'DUPLICATE_PLAYER' } })
  })

  it('accepts AI players of every level', () => {
    const players = testPlayers(3)
    players[1] = { ...players[1]!, kind: 'ai', level: 'easy' }
    players[2] = { ...players[2]!, kind: 'ai', level: 'hard' }
    players.push({ ...testPlayers(4)[3]!, kind: 'ai', level: 'expert' })
    const result = createGame({ players, seed: 1 })
    expect(result.ok && result.state.players.slice(1)).toMatchObject([
      { kind: 'ai', level: 'easy' },
      { kind: 'ai', level: 'hard' },
      { kind: 'ai', level: 'expert' },
    ])
  })

  it('rejects an unknown AI level', () => {
    const players: unknown[] = testPlayers(3)
    players[1] = { ...testPlayers(3)[1], kind: 'ai', level: 'grandmaster' }
    const result = createGame({ players: players as PlayerConfig[], seed: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_PLAYER' } })
  })

  it('rejects the identifier reserved for the neutral army', () => {
    const players = testPlayers(3)
    players[0] = { ...players[0]!, id: NEUTRAL_PLAYER_ID }
    const result = createGame({ players, seed: 1 })
    expect(result).toMatchObject({ ok: false, error: { code: 'DUPLICATE_PLAYER' } })
  })
})

describe('game settings', () => {
  it('uses the default settings when none are given', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      territoryDistribution: 'random',
      armyPlacement: 'random',
      cardTradeScale: 'progressive',
      attackerMaxDice: 3,
      defenderMaxDice: 2,
      fortifyMode: 'connected',
      secretMissions: false,
      capitals: false,
    })
    expect(createTestGame(3).settings).toEqual(DEFAULT_SETTINGS)
  })

  it('completes partial settings with the defaults', () => {
    const state = createTestGame(3, { settings: { fortifyMode: 'adjacent' } })
    expect(state.settings).toEqual({ ...DEFAULT_SETTINGS, fortifyMode: 'adjacent' })
  })

  it.each([
    { attackerMaxDice: 4 },
    { attackerMaxDice: 0 },
    { defenderMaxDice: 1.5 },
    { fortifyMode: 'teleport' },
    { cardTradeScale: 'random' },
    { territoryDistribution: 'auction' },
    { armyPlacement: 'parachute' },
    { secretMissions: 'yes' },
    { capitals: 1 },
  ])('rejects the out-of-range setting %o', (settings) => {
    const result = createGame({
      players: testPlayers(3),
      seed: 1,
      settings: settings as Partial<typeof DEFAULT_SETTINGS>,
    })
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_SETTING' } })
  })
})

describe('neutral army', () => {
  it('is added with 14 random territories holding 40 armies in a 2-player game', () => {
    const state = createTestGame(2)
    const neutral = state.players.find((p) => p.isNeutral)
    expect(state.players).toHaveLength(3)
    expect(neutral?.id).toBe(NEUTRAL_PLAYER_ID)
    expect(ownedBy(state, NEUTRAL_PLAYER_ID)).toHaveLength(14)
    expect(armiesOf(state, NEUTRAL_PLAYER_ID)).toBe(40)
  })

  it('gets different territories with another seed', () => {
    const first = ownedBy(createTestGame(2, { seed: 1 }), NEUTRAL_PLAYER_ID)
    const second = ownedBy(createTestGame(2, { seed: 2 }), NEUTRAL_PLAYER_ID)
    expect(second).not.toEqual(first)
  })

  it('is not added from 3 players', () => {
    expect(createTestGame(3).players.some((p) => p.isNeutral)).toBe(false)
  })
})

describe('first player', () => {
  it('is the same for the same seed', () => {
    expect(createTestGame(5, { seed: 77 }).firstPlayerIndex).toBe(
      createTestGame(5, { seed: 77 }).firstPlayerIndex,
    )
  })

  it('is drawn among the non-neutral players', () => {
    const firsts = new Set<number>()
    for (let seed = 1; seed <= 60; seed++) {
      const state = createTestGame(2, { seed })
      expect(state.players[state.firstPlayerIndex]?.isNeutral).toBe(false)
      firsts.add(state.firstPlayerIndex)
    }
    expect(firsts).toEqual(new Set([0, 1]))
  })
})

describe('card deck', () => {
  it('holds 44 cards: 14 of each symbol, 2 jokers, one card per territory', () => {
    const { deck } = createTestGame(3)
    const count = (symbol: string) => deck.filter((card) => card.symbol === symbol).length
    expect(deck).toHaveLength(44)
    expect(count('infantry')).toBe(14)
    expect(count('cavalry')).toBe(14)
    expect(count('artillery')).toBe(14)
    expect(count('joker')).toBe(2)
    const territories = deck.flatMap((card) => (card.territory === null ? [] : [card.territory]))
    expect([...territories].sort()).toEqual([...classicMap.territoryIds].sort())
    expect(new Set(deck.map((card) => card.id)).size).toBe(44)
  })

  it('is shuffled', () => {
    const ids = createTestGame(3).deck.map((card) => card.id)
    expect(ids).not.toEqual([...ids].sort((a, b) => a - b))
  })
})

describe('random territory distribution', () => {
  it('gives every territory an owner and at least one army', () => {
    const state = createTestGame(3)
    expect(Object.keys(state.territories).sort()).toEqual([...classicMap.territoryIds].sort())
    expect(Object.values(state.territories).every((t) => t.armies >= 1)).toBe(true)
  })

  it('deals 10 or 11 territories to each of 4 players', () => {
    const state = createTestGame(4)
    for (const player of state.players) {
      expect([10, 11]).toContain(ownedBy(state, player.id).length)
    }
  })

  it('deals 14 territories to each player beside the neutral army', () => {
    const state = createTestGame(2)
    expect(ownedBy(state, 'p1')).toHaveLength(14)
    expect(ownedBy(state, 'p2')).toHaveLength(14)
  })

  it('opens the placement phase on the first player with the armies left to place', () => {
    const state = createTestGame(4, { settings: { armyPlacement: 'manual' } })
    expect(state.phase.kind).toBe('placement')
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
    if (state.phase.kind === 'placement') {
      for (const player of state.players) {
        expect(state.phase.remaining[player.id]).toBe(30 - ownedBy(state, player.id).length)
      }
    }
  })
})

describe('random army placement', () => {
  it.each([
    [5, 25],
    [3, 35],
  ])('puts all the initial armies on the board at once with %i players', (count, armies) => {
    const state = createTestGame(count)
    for (const player of state.players) {
      expect(armiesOf(state, player.id)).toBe(armies)
    }
  })

  it('opens the reinforcement phase of the first player', () => {
    const state = createTestGame(4)
    expect(state.phase.kind).toBe('reinforce')
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
  })

  it('spreads the armies the same way for the same seed', () => {
    expect(createTestGame(4, { seed: 9 }).territories).toEqual(createTestGame(4, { seed: 9 }).territories)
  })

  it('spreads the armies differently with another seed', () => {
    expect(createTestGame(4, { seed: 9 }).territories).not.toEqual(createTestGame(4, { seed: 10 }).territories)
  })

  it('places the remaining armies at random once the last territory is claimed', () => {
    const state = claimAll(createTestGame(3, { settings: { territoryDistribution: 'choice' } }))
    expect(state.phase.kind).toBe('reinforce')
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
    for (const player of state.players) {
      expect(armiesOf(state, player.id)).toBe(35)
    }
  })
})

describe('secret missions', () => {
  const withMissions = { settings: { secretMissions: true } }

  it('are not dealt by default', () => {
    expect(createTestGame(4).missions).toBeNull()
  })

  it('are refused with 2 players', () => {
    const result = createGame({ players: testPlayers(2), seed: 1, ...withMissions })
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SETTING', message: 'Les missions secrètes exigent au moins 3 joueurs.' },
    })
  })

  it('give exactly one mission to each player', () => {
    const state = createTestGame(4, withMissions)
    expect(Object.keys(state.missions ?? {}).sort()).toEqual(['p1', 'p2', 'p3', 'p4'])
  })

  it('never deal the same card twice', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const missions = Object.values(createTestGame(4, { ...withMissions, seed }).missions ?? {})
      const cards = missions.filter((mission) => mission.kind !== 'territories' || mission.count !== 24)
      expect(new Set(cards.map((mission) => JSON.stringify(mission))).size).toBe(cards.length)
    }
  })

  it('deal the same missions for the same seed and players', () => {
    expect(createTestGame(5, { ...withMissions, seed: 31 }).missions).toEqual(
      createTestGame(5, { ...withMissions, seed: 31 }).missions,
    )
  })

  it('deal missions from the whole deck over several seeds', () => {
    const dealt = new Set<string>()
    for (let seed = 1; seed <= 100; seed++) {
      for (const mission of Object.values(createTestGame(4, { ...withMissions, seed }).missions ?? {})) {
        dealt.add(mission.kind === 'eliminate' ? `eliminate:${mission.target}` : JSON.stringify(mission))
      }
    }
    expect(dealt.size).toBe(12)
  })

  it('never ask a player to eliminate itself', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const missions = createTestGame(4, { ...withMissions, seed }).missions ?? {}
      for (const [playerId, mission] of Object.entries(missions)) {
        expect(mission).not.toEqual({ kind: 'eliminate', target: playerId })
      }
    }
  })
})

describe('capitals mode', () => {
  const withCapitals = { settings: { capitals: true } }

  it('is off by default, without capital choice nor capitals', () => {
    const state = createTestGame(3)
    expect(state.settings.capitals).toBe(false)
    expect(state.capitals).toBeNull()
    expect(state.phase.kind).toBe('reinforce')
  })

  it('is refused together with the secret missions', () => {
    const result = createGame({ players: testPlayers(3), seed: 1, settings: { capitals: true, secretMissions: true } })
    expect(result).toMatchObject({
      ok: false,
      error: { code: 'INVALID_SETTING', message: 'Les variantes missions et capitales s\'excluent.' },
    })
  })

  it.each([2, 6])('is allowed with %i players', (count) => {
    expect(createGame({ players: testPlayers(count), seed: 1, ...withCapitals }).ok).toBe(true)
  })

  it('opens the capital choice of the first player once the armies are spread at random', () => {
    const state = createTestGame(4, withCapitals)
    expect(state.phase).toEqual({ kind: 'capitalChoice', pending: {} })
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
    expect(state.capitals).toBeNull()
    for (const player of state.players) {
      expect(armiesOf(state, player.id)).toBe(30)
    }
  })

  it('opens the capital choice once the last initial army is placed by hand', () => {
    const start = createTestGame(3, { settings: { capitals: true, armyPlacement: 'manual' } })
    expect(start.phase.kind).toBe('placement')
    const state = placeAll(start)
    expect(state.phase).toEqual({ kind: 'capitalChoice', pending: {} })
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
  })

  it('opens the capital choice once the last territory is claimed, the armies being spread at random', () => {
    const state = claimAll(createTestGame(3, { settings: { capitals: true, territoryDistribution: 'choice' } }))
    expect(state.phase).toEqual({ kind: 'capitalChoice', pending: {} })
    expect(state.currentPlayerIndex).toBe(state.firstPlayerIndex)
  })

  it('opens no capital choice without the setting', () => {
    const state = placeAll(createTestGame(3, { settings: { armyPlacement: 'manual' } }))
    expect(state.phase.kind).toBe('reinforce')
    expect(state.capitals).toBeNull()
  })
})

describe('dealMissions', () => {
  it('gives the cards in order and replaces an own elimination by 24 territories', () => {
    const deck: Mission[] = [
      { kind: 'eliminate', target: 'p2' },
      { kind: 'eliminate', target: 'p2' },
      { kind: 'eliminate', target: 'p1' },
    ]
    expect(dealMissions(deck, ['p1', 'p2', 'p3'])).toEqual({
      p1: { kind: 'eliminate', target: 'p2' },
      p2: CONQUER_24_TERRITORIES,
      p3: { kind: 'eliminate', target: 'p1' },
    })
  })
})
