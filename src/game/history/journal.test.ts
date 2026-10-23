import { describe, expect, it } from 'vitest'
import { createGame, type GameEvent, type Player } from '../../engine'
import { groupByTurn, journalBatch, openingJournal, type JournalEntry } from './journal'

const players: Player[] = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human', isNeutral: false, eliminated: false },
  { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'ai', level: 'normal', isNeutral: false, eliminated: false },
]

function roll(attackerDice: number[], defenderDice: number[], attackerLosses: number, defenderLosses: number): GameEvent {
  return {
    type: 'diceRolled',
    attacker: 'p1',
    defender: 'p2',
    from: 'north_africa',
    to: 'brazil',
    attackerDice,
    defenderDice,
    attackerLosses,
    defenderLosses,
  }
}

const texts = (events: GameEvent[], turn = 3) => journalBatch(events, players, turn).entries.map((entry) => entry.text)

describe('journal entries', () => {
  it('opens a turn with a header', () => {
    const [entry] = journalBatch([{ type: 'turnStarted', playerId: 'p2', reserve: 3 }], players, 4).entries
    expect(entry).toEqual({ turn: 5, playerId: 'p2', text: 'Tour 5 — Bob', header: true, details: [] })
  })

  it('attaches an entry to its author and to the turn', () => {
    const [entry] = journalBatch([{ type: 'armiesDeployed', playerId: 'p1', territory: 'ukraine', armies: 3 }], players, 7).entries
    expect(entry).toMatchObject({ turn: 7, playerId: 'p1', header: false })
  })

  it('agrees the number of armies', () => {
    expect(texts([{ type: 'armiesDeployed', playerId: 'p1', territory: 'ukraine', armies: 1 }])).toEqual([
      'Alice place 1 armée en Ukraine',
    ])
    expect(texts([{ type: 'armiesDeployed', playerId: 'p1', territory: 'ukraine', armies: 4 }])).toEqual([
      'Alice place 4 armées en Ukraine',
    ])
  })

  it('describes a trade, a conquest, an advance and a fortification', () => {
    expect(
      texts([
        { type: 'cardsTraded', playerId: 'p1', cardIds: [1, 2, 3], armies: 6, bonusTerritory: null },
        { type: 'territoryConquered', playerId: 'p1', previousOwner: 'p2', from: 'north_africa', to: 'brazil' },
        { type: 'conquestMoved', playerId: 'p1', from: 'north_africa', to: 'brazil', armies: 1 },
        { type: 'fortified', playerId: 'p1', from: 'peru', to: 'brazil', armies: 5 },
      ]),
    ).toEqual([
      'Alice échange une série contre 6 armées',
      'Alice conquiert Brésil',
      'Alice avance 1 armée en Brésil',
      'Alice déplace 5 armées de Pérou vers Brésil',
    ])
  })

  it('describes the set-up, the elimination and the victory', () => {
    expect(
      texts([
        { type: 'territoryClaimed', playerId: 'p1', territory: 'peru' },
        { type: 'initialArmyPlaced', playerId: 'p2', territory: 'brazil' },
        { type: 'playerEliminated', playerId: 'p2', by: 'p1', cardsTaken: 2 },
        { type: 'gameWon', playerId: 'p1' },
      ]),
    ).toEqual(['Alice revendique Pérou', 'Bob place 1 armée en Brésil', 'Bob est éliminé par Alice', 'Alice remporte la partie'])
  })

  it('tells a card was drawn without telling which one', () => {
    const [entry] = journalBatch([{ type: 'cardDrawn', playerId: 'p2', cardId: 9 }], players, 3).entries
    expect(entry?.text).toBe('Bob pioche une carte')
    expect(entry?.details).toEqual([])
  })
})

describe('condensed attack', () => {
  it('sums up an attack won in a single roll', () => {
    const [entry] = journalBatch([roll([6, 5, 1], [4, 4], 0, 2)], players, 3).entries
    expect(entry?.text).toBe('Alice attaque Brésil depuis Afrique du Nord : 1 lancer — Bob perd 2 armées')
    expect(entry?.details).toEqual(['6-5-1 contre 4-4 — Bob perd 2 armées'])
  })

  it('sums up the rolls of an attack in a single entry, one detail line per roll', () => {
    const { entries } = journalBatch(
      [roll([6, 2, 1], [5, 3], 1, 1), roll([4, 3, 1], [6, 5], 2, 0), roll([6, 6, 2], [3, 1], 0, 2), roll([6, 4], [2, 1], 0, 2)],
      players,
      3,
    )
    expect(entries).toHaveLength(1)
    expect(entries[0]?.text).toBe('Alice attaque Brésil depuis Afrique du Nord : 4 lancers — Alice perd 3 armées, Bob perd 5 armées')
    expect(entries[0]?.details).toEqual([
      '6-2-1 contre 5-3 — Alice perd 1 armée, Bob perd 1 armée',
      '4-3-1 contre 6-5 — Alice perd 2 armées',
      '6-6-2 contre 3-1 — Bob perd 2 armées',
      '6-4 contre 2-1 — Bob perd 2 armées',
    ])
  })
})

describe('reveal steps', () => {
  it('reveals each entry once the animation steps up to its last event have played', () => {
    const batch = journalBatch(
      [
        roll([6, 5, 1], [4, 4], 0, 2),
        roll([6, 5, 1], [4, 1], 0, 1),
        { type: 'territoryConquered', playerId: 'p1', previousOwner: 'p2', from: 'north_africa', to: 'brazil' },
        { type: 'playerEliminated', playerId: 'p2', by: 'p1', cardsTaken: 0 },
      ],
      players,
      3,
    )
    expect(batch.revealSteps).toEqual([2, 3, 3])
  })

  it('reveals at once the entries without animation', () => {
    expect(journalBatch([{ type: 'armiesDeployed', playerId: 'p1', territory: 'ukraine', armies: 3 }], players, 3).revealSteps).toEqual([0])
  })
})

describe('opening journal', () => {
  const created = createGame({ players: players.map(({ id, name, color }) => ({ id, name, color, kind: 'human' })), seed: 2 })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state

  it('opens with the header of the first turn, started silently by the engine', () => {
    const current = state.players[state.currentPlayerIndex]
    expect(openingJournal(state, 1)).toEqual([
      { turn: 1, playerId: current?.id, text: `Tour 1 — ${current?.name}`, header: true, details: [] },
    ])
  })

  it('opens empty during the set-up', () => {
    expect(openingJournal(state, 0)).toEqual([])
  })
})

describe('groupByTurn', () => {
  const entry = (turn: number, text: string, header = false): JournalEntry => ({ turn, playerId: 'p1', text, header, details: [] })

  it('gathers the entries of each turn under its header, the set-up first without header', () => {
    const claim = entry(0, 'Alice revendique Pérou')
    const first = entry(1, 'Tour 1 — Alice', true)
    const deploy = entry(1, 'Alice place 3 armées en Pérou')
    const second = entry(2, 'Tour 2 — Bob', true)
    expect(groupByTurn([claim, first, deploy, second])).toEqual([
      { turn: 0, header: null, entries: [claim] },
      { turn: 1, header: first, entries: [deploy] },
      { turn: 2, header: second, entries: [] },
    ])
  })

  it('starts a group without header when the journal is cut in the middle of a turn', () => {
    const deploy = entry(7, 'Alice place 3 armées en Pérou')
    expect(groupByTurn([deploy])).toEqual([{ turn: 7, header: null, entries: [deploy] }])
  })
})
