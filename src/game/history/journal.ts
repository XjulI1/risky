import { classicMap, missionText, type GameEvent, type GameState, type Player, type PlayerId } from '../../engine'
import { armiesLabel } from '../labels'
import { presentationSteps } from '../presentation'

/** A line of the game journal, in French; `details` holds the rolls of an attack. */
export type JournalEntry = {
  turn: number
  playerId: PlayerId
  text: string
  header: boolean
  details: string[]
}

/** Entries caused by one engine answer, with the number of animation steps to play before each one shows. */
export type JournalBatch = {
  entries: JournalEntry[]
  revealSteps: number[]
}

type DiceRolled = Extract<GameEvent, { type: 'diceRolled' }>
type SecretEvent = Extract<GameEvent, { type: 'missionConverted' }>
type JournaledEvent = Exclude<GameEvent, DiceRolled | SecretEvent>

function territoryName(id: string): string {
  return classicMap.territories[id]?.name ?? id
}

function lossesText(rolls: DiceRolled[], nameOf: (id: PlayerId) => string): string {
  const [first] = rolls
  if (first === undefined) {
    return ''
  }
  const attackerLosses = rolls.reduce((sum, roll) => sum + roll.attackerLosses, 0)
  const defenderLosses = rolls.reduce((sum, roll) => sum + roll.defenderLosses, 0)
  return [
    [first.attacker, attackerLosses] as const,
    [first.defender, defenderLosses] as const,
  ]
    .filter(([, losses]) => losses > 0)
    .map(([playerId, losses]) => `${nameOf(playerId)} perd ${armiesLabel(losses)}`)
    .join(', ')
}

function rollLine(roll: DiceRolled, nameOf: (id: PlayerId) => string): string {
  return `${roll.attackerDice.join('-')} contre ${roll.defenderDice.join('-')} — ${lossesText([roll], nameOf)}`
}

function attackEntry(rolls: DiceRolled[], nameOf: (id: PlayerId) => string, turn: number): JournalEntry | null {
  const [first] = rolls
  if (first === undefined) {
    return null
  }
  const count = `${rolls.length} ${rolls.length > 1 ? 'lancers' : 'lancer'}`
  return {
    turn,
    playerId: first.attacker,
    text: `${nameOf(first.attacker)} attaque ${territoryName(first.to)} depuis ${territoryName(first.from)} : ${count} — ${lossesText(rolls, nameOf)}`,
    header: false,
    details: rolls.map((roll) => rollLine(roll, nameOf)),
  }
}

function eventText(event: JournaledEvent, players: Player[], nameOf: (id: PlayerId) => string, turn: number): string {
  switch (event.type) {
    case 'turnStarted':
      return `Tour ${turn} — ${nameOf(event.playerId)}`
    case 'territoryClaimed':
      return `${nameOf(event.playerId)} revendique ${territoryName(event.territory)}`
    case 'initialArmyPlaced':
      return `${nameOf(event.playerId)} place 1 armée en ${territoryName(event.territory)}`
    case 'armiesDeployed':
      return `${nameOf(event.playerId)} place ${armiesLabel(event.armies)} en ${territoryName(event.territory)}`
    case 'cardsTraded':
      return `${nameOf(event.playerId)} échange une série contre ${armiesLabel(event.armies)}`
    case 'territoryConquered':
      return `${nameOf(event.playerId)} conquiert ${territoryName(event.to)}`
    case 'conquestMoved':
      return `${nameOf(event.playerId)} avance ${armiesLabel(event.armies)} en ${territoryName(event.to)}`
    case 'fortified':
      return `${nameOf(event.playerId)} déplace ${armiesLabel(event.armies)} de ${territoryName(event.from)} vers ${territoryName(event.to)}`
    case 'cardDrawn':
      return `${nameOf(event.playerId)} pioche une carte`
    case 'playerEliminated':
      return `${nameOf(event.playerId)} est éliminé par ${nameOf(event.by)}`
    case 'missionAccomplished':
      return `${nameOf(event.playerId)} accomplit sa mission : ${missionText(event.mission, players)}`
    case 'gameWon':
      return `${nameOf(event.playerId)} remporte la partie`
  }
}

function authorOf(event: JournaledEvent): PlayerId {
  return event.type === 'playerEliminated' ? event.by : event.playerId
}

/**
 * Journal entries of the events of one engine answer, `turn` being the turn number before them.
 * The rolls of an attack make a single entry; drawn cards stay anonymous and converted missions secret.
 */
export function journalBatch(events: GameEvent[], players: Player[], turn: number): JournalBatch {
  const nameOf = (id: PlayerId) => players.find((player) => player.id === id)?.name ?? id
  const entries: JournalEntry[] = []
  const revealSteps: number[] = []
  const stepsThrough = (index: number) => presentationSteps(events.slice(0, index + 1)).length
  let currentTurn = turn
  let rolls: DiceRolled[] = []

  const flushAttack = (lastIndex: number) => {
    const entry = attackEntry(rolls, nameOf, currentTurn)
    if (entry !== null) {
      entries.push(entry)
      revealSteps.push(stepsThrough(lastIndex))
    }
    rolls = []
  }

  events.forEach((event, index) => {
    if (event.type === 'missionConverted') {
      return
    }
    if (event.type === 'diceRolled') {
      rolls.push(event)
      return
    }
    flushAttack(index - 1)
    if (event.type === 'turnStarted') {
      currentTurn += 1
    }
    entries.push({
      turn: currentTurn,
      playerId: authorOf(event),
      text: eventText(event, players, nameOf, currentTurn),
      header: event.type === 'turnStarted',
      details: [],
    })
    revealSteps.push(stepsThrough(index))
  })
  flushAttack(events.length - 1)
  return { entries, revealSteps }
}

/** Journal of a new game: the header of its first turn when it opens on it, since the engine starts it silently. */
export function openingJournal(state: GameState, turn: number): JournalEntry[] {
  const player = state.players[state.currentPlayerIndex]
  if (turn === 0 || player === undefined) {
    return []
  }
  return [{ turn, playerId: player.id, text: `Tour ${turn} — ${player.name}`, header: true, details: [] }]
}

/** Entries of one turn, under the entry that opened it; turn 0 gathers the set-up, without header. */
export type JournalGroup = {
  turn: number
  header: JournalEntry | null
  entries: JournalEntry[]
}

/** Gathers consecutive entries by turn, in journal order. */
export function groupByTurn(entries: JournalEntry[]): JournalGroup[] {
  const groups: JournalGroup[] = []
  for (const entry of entries) {
    const last = groups.at(-1)
    if (entry.header) {
      groups.push({ turn: entry.turn, header: entry, entries: [] })
    } else if (last !== undefined && last.turn === entry.turn) {
      last.entries.push(entry)
    } else {
      groups.push({ turn: entry.turn, header: null, entries: [entry] })
    }
  }
  return groups
}
