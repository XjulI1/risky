import { describe, expect, it } from 'vitest'
import { armiesLabel, PHASE_LABELS } from './labels'

describe('PHASE_LABELS', () => {
  it('names every phase in French', () => {
    expect(PHASE_LABELS.reinforce).toBe('Renforts')
    expect(PHASE_LABELS.conquestMove).toBe('Déplacement après conquête')
    expect(PHASE_LABELS.capitalChoice).toBe('Choix de la capitale')
    expect(Object.values(PHASE_LABELS)).toHaveLength(9)
  })
})

describe('armiesLabel', () => {
  it('agrees with the number', () => {
    expect(armiesLabel(1)).toBe('1 armée')
    expect(armiesLabel(7)).toBe('7 armées')
  })
})
