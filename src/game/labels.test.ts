import { describe, expect, it } from 'vitest'
import type { GameEvent, Player } from '../engine'
import { armiesLabel, attackSummary, PHASE_LABELS } from './labels'

const players: Player[] = [
  { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human', isNeutral: false, eliminated: false },
  { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'human', isNeutral: false, eliminated: false },
]

const roll = (attackerLosses: number, defenderLosses: number): GameEvent => ({
  type: 'diceRolled',
  attacker: 'p1',
  defender: 'p2',
  from: 'north_africa',
  to: 'brazil',
  attackerDice: [6, 5, 1],
  defenderDice: [4, 4],
  attackerLosses,
  defenderLosses,
})

describe('PHASE_LABELS', () => {
  it('names every phase in French', () => {
    expect(PHASE_LABELS.reinforce).toBe('Renforts')
    expect(PHASE_LABELS.conquestMove).toBe('Déplacement après conquête')
    expect(Object.values(PHASE_LABELS)).toHaveLength(8)
  })
})

describe('armiesLabel', () => {
  it('agrees with the number', () => {
    expect(armiesLabel(1)).toBe('1 armée')
    expect(armiesLabel(7)).toBe('7 armées')
  })
})

describe('attackSummary', () => {
  it('sums the losses of every roll of an attack', () => {
    expect(attackSummary([roll(0, 2), roll(1, 1)], players)).toBe('Brésil attaqué depuis Afrique du Nord : Alice perd 1 armée, Bob perd 3 armées')
  })

  it('mentions the conquest', () => {
    const events: GameEvent[] = [
      roll(0, 2),
      { type: 'territoryConquered', playerId: 'p1', previousOwner: 'p2', from: 'north_africa', to: 'brazil' },
    ]
    expect(attackSummary(events, players)).toBe('Brésil attaqué depuis Afrique du Nord : Alice perd 0 armée, Bob perd 2 armées — Brésil conquis')
  })

  it('is empty without an attack', () => {
    expect(attackSummary([], players)).toBeNull()
  })
})
