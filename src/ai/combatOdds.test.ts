import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '../engine'
import { conquestProbability, rollLossDistribution } from './combatOdds'

describe('rollLossDistribution', () => {
  it('gives the outcomes of 3 dice against 2', () => {
    const [none, one, two] = rollLossDistribution(3, 2)
    expect(none).toBeCloseTo(2890 / 7776, 12)
    expect(one).toBeCloseTo(2611 / 7776, 12)
    expect(two).toBeCloseTo(2275 / 7776, 12)
  })

  it('gives the outcomes of 1 die against 1, the defender winning ties', () => {
    const [win, loss] = rollLossDistribution(1, 1)
    expect(win).toBeCloseTo(15 / 36, 12)
    expect(loss).toBeCloseTo(21 / 36, 12)
  })

  it('compares as many pairs as the smaller side has dice', () => {
    const distribution = rollLossDistribution(3, 3)
    expect(distribution).toHaveLength(4)
    expect(distribution.reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 12)
  })
})

describe('conquestProbability', () => {
  it('is 15/36 for 2 armies against 1', () => {
    expect(conquestProbability(2, 1, DEFAULT_SETTINGS)).toBeCloseTo(15 / 36, 12)
  })

  it('is certain against an empty territory and impossible with a single army', () => {
    expect(conquestProbability(5, 0, DEFAULT_SETTINGS)).toBe(1)
    expect(conquestProbability(1, 3, DEFAULT_SETTINGS)).toBe(0)
  })

  it('grows with the attacking armies', () => {
    const odds = Array.from({ length: 19 }, (_, i) => conquestProbability(i + 2, 5, DEFAULT_SETTINGS))
    odds.slice(1).forEach((p, i) => expect(p).toBeGreaterThan(odds[i] as number))
  })

  it('takes a third defending die into account', () => {
    const threeDefenders = { ...DEFAULT_SETTINGS, defenderMaxDice: 3 }
    expect(conquestProbability(10, 5, threeDefenders)).toBeLessThan(conquestProbability(10, 5, DEFAULT_SETTINGS))
  })

  it('takes a single attacking die into account', () => {
    const oneAttacker = { ...DEFAULT_SETTINGS, attackerMaxDice: 1 }
    expect(conquestProbability(10, 5, oneAttacker)).toBeLessThan(conquestProbability(10, 5, DEFAULT_SETTINGS))
  })

  it('computes exactly up to 100 armies', () => {
    expect(conquestProbability(100, 99, DEFAULT_SETTINGS)).not.toBe(conquestProbability(99, 99, DEFAULT_SETTINGS))
  })

  it('scales armies above 100 down to 100, keeping their ratio', () => {
    expect(conquestProbability(200, 70, DEFAULT_SETTINGS)).toBe(conquestProbability(100, 35, DEFAULT_SETTINGS))
    expect(conquestProbability(2000, 600, DEFAULT_SETTINGS)).toBeGreaterThan(0.99)
  })

  it('keeps a territory with a single army unable to conquer', () => {
    expect(conquestProbability(1, 500, DEFAULT_SETTINGS)).toBe(0)
  })
})
