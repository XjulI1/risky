import { classicMap, type GameEvent, type PhaseKind, type Player } from '../engine'

/** French name of each phase. */
export const PHASE_LABELS: Record<PhaseKind, string> = {
  claim: 'Revendication',
  placement: 'Placement',
  reinforce: 'Renforts',
  attack: 'Attaque',
  conquestMove: 'Déplacement après conquête',
  eliminationTrade: 'Échange obligatoire',
  fortify: 'Fortification',
  gameOver: 'Fin de partie',
}

/** « 1 armée », « 7 armées ». */
export function armiesLabel(count: number): string {
  return `${count} ${count > 1 ? 'armées' : 'armée'}`
}

function territoryName(id: string): string {
  return classicMap.territories[id]?.name ?? id
}

/** One-line result of the attack among `events`, or `null` when they hold no roll. */
export function attackSummary(events: GameEvent[], players: Player[]): string | null {
  const rolls = events.filter((event) => event.type === 'diceRolled')
  const first = rolls[0]
  if (first === undefined || first.type !== 'diceRolled') {
    return null
  }
  const nameOf = (id: string) => players.find((player) => player.id === id)?.name ?? id
  const attackerLosses = rolls.reduce((sum, roll) => sum + (roll.type === 'diceRolled' ? roll.attackerLosses : 0), 0)
  const defenderLosses = rolls.reduce((sum, roll) => sum + (roll.type === 'diceRolled' ? roll.defenderLosses : 0), 0)
  const conquered = events.some((event) => event.type === 'territoryConquered')
  const losses = `${nameOf(first.attacker)} perd ${armiesLabel(attackerLosses)}, ${nameOf(first.defender)} perd ${armiesLabel(defenderLosses)}`
  const result = `${territoryName(first.to)} attaqué depuis ${territoryName(first.from)} : ${losses}`
  return conquered ? `${result} — ${territoryName(first.to)} conquis` : result
}
