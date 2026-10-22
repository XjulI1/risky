import { resolveRoll, type GameSettings } from '../engine'

/** The settings that shape a fight. */
export type DiceSettings = Pick<GameSettings, 'attackerMaxDice' | 'defenderMaxDice'>

/** Largest army count the odds table covers; larger counts are scaled down to it, keeping their ratio. */
export const MAX_TABULATED_ARMIES = 100

const DIE_FACES = 6

const distributions = new Map<string, number[]>()
const conquestTables = new Map<string, Float64Array>()

function diceCombinations(count: number): number[][] {
  if (count === 0) {
    return [[]]
  }
  return diceCombinations(count - 1).flatMap((dice) =>
    Array.from({ length: DIE_FACES }, (_, face) => [...dice, face + 1]),
  )
}

function enumerateRoll(attackerDice: number, defenderDice: number): number[] {
  const losses = new Array<number>(Math.min(attackerDice, defenderDice) + 1).fill(0)
  const attackerRolls = diceCombinations(attackerDice)
  const defenderRolls = diceCombinations(defenderDice)
  const total = attackerRolls.length * defenderRolls.length
  for (const attacker of attackerRolls) {
    for (const defender of defenderRolls) {
      const { attackerLosses } = resolveRoll(attacker, defender)
      losses[attackerLosses] = (losses[attackerLosses] ?? 0) + 1 / total
    }
  }
  return losses
}

/** Exact probability of each number of attacker losses (the index) in a single roll. */
export function rollLossDistribution(attackerDice: number, defenderDice: number): number[] {
  const key = `${attackerDice}:${defenderDice}`
  let distribution = distributions.get(key)
  if (distribution === undefined) {
    distribution = enumerateRoll(attackerDice, defenderDice)
    distributions.set(key, distribution)
  }
  return distribution
}

const SIZE = MAX_TABULATED_ARMIES + 1

function buildConquestTable(dice: DiceSettings): Float64Array {
  const table = new Float64Array(SIZE * SIZE)
  for (let attackers = 2; attackers < SIZE; attackers++) {
    table[attackers * SIZE] = 1
    for (let defenders = 1; defenders < SIZE; defenders++) {
      const attackerDice = Math.min(dice.attackerMaxDice, attackers - 1)
      const defenderDice = Math.min(dice.defenderMaxDice, defenders)
      const distribution = rollLossDistribution(attackerDice, defenderDice)
      const pairs = distribution.length - 1
      let probability = 0
      distribution.forEach((p, attackerLosses) => {
        probability += p * (table[(attackers - attackerLosses) * SIZE + defenders - (pairs - attackerLosses)] ?? 0)
      })
      table[attackers * SIZE + defenders] = probability
    }
  }
  return table
}

function conquestTable(dice: DiceSettings): Float64Array {
  const key = `${dice.attackerMaxDice}:${dice.defenderMaxDice}`
  let table = conquestTables.get(key)
  if (table === undefined) {
    table = buildConquestTable(dice)
    conquestTables.set(key, table)
  }
  return table
}

/**
 * Probability that a territory holding `attackerArmies` conquers one holding `defenderArmies`
 * when attacking until decided with the most dice allowed; above 100 armies, both counts are
 * scaled down so that the larger one is 100.
 */
export function conquestProbability(attackerArmies: number, defenderArmies: number, dice: DiceSettings): number {
  const scale = Math.min(1, MAX_TABULATED_ARMIES / Math.max(attackerArmies, defenderArmies, 1))
  const attackers = Math.max(0, Math.round(attackerArmies * scale))
  const defenders = Math.max(0, Math.round(defenderArmies * scale))
  if (defenders === 0) {
    return 1
  }
  return conquestTable(dice)[attackers * SIZE + defenders] ?? 0
}
