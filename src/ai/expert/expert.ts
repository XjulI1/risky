import { applyActionInPlace, defenderBonusOn, type Action, type TerritoryId } from '../../engine'
import { aiRandom } from '../aiRandom'
import { conquestProbability } from '../combatOdds'
import { armiesOn, borderTerritories, enemyNeighbors, threat } from '../evaluation'
import { chooseHeuristicAction, MAX_ATTACKS_PER_TURN, NEW_TURN, progressAfter } from '../heuristic'
import type { PlayerView } from '../playerView'
import { attackOptions, type TurnProgress } from '../strategy'
import { determinize } from './determinization'
import { rollout } from './rollout'

/** Search budget of the expert: worlds simulated per candidate action, and candidates kept per kind of decision. */
export type ExpertBudget = {
  samples: number
  offensiveDeployments: number
  defensiveDeployments: number
  attacks: number
}

export const DEFAULT_EXPERT_BUDGET: ExpertBudget = {
  samples: 24,
  offensiveDeployments: 3,
  defensiveDeployments: 2,
  attacks: 4,
}

const MIN_ATTACK_PROBABILITY = 0.25

function topBy<T>(items: readonly T[], count: number, score: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, score: score(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ item }) => item)
}

function offensiveOdds(view: PlayerView, origin: TerritoryId, reserve: number): number {
  return Math.max(
    0,
    ...enemyNeighbors(view, origin).map((target) =>
      conquestProbability(armiesOn(view, origin) + reserve, armiesOn(view, target), view.settings, defenderBonusOn(view, target)),
    ),
  )
}

function deploymentCandidates(view: PlayerView, budget: ExpertBudget, reserve: number): Action[] {
  const borders = borderTerritories(view, view.viewer)
  const territories = [
    ...topBy(borders, budget.offensiveDeployments, (territory) => offensiveOdds(view, territory, reserve)),
    ...topBy(borders, budget.defensiveDeployments, (territory) => threat(view, territory)),
  ]
  return territories.map((territory) => ({ type: 'deploy', playerId: view.viewer, territory, armies: reserve }))
}

function attackCandidates(view: PlayerView, budget: ExpertBudget): Action[] {
  const options = attackOptions(view, view.viewer).filter((option) => option.probability >= MIN_ATTACK_PROBABILITY)
  return [
    { type: 'endAttack', playerId: view.viewer },
    ...topBy(options, budget.attacks, (option) => option.probability).map(
      (option): Action => ({ type: 'attack', playerId: view.viewer, from: option.from, to: option.to }),
    ),
  ]
}

function alternativesTo(view: PlayerView, turn: TurnProgress, budget: ExpertBudget, heuristic: Action): Action[] {
  const phase = view.phase
  if (heuristic.type === 'deploy' && (phase.kind === 'reinforce' || phase.kind === 'eliminationTrade')) {
    return deploymentCandidates(view, budget, phase.reserve)
  }
  if (phase.kind === 'attack' && turn.attacks < MAX_ATTACKS_PER_TURN) {
    return attackCandidates(view, budget)
  }
  return []
}

function distinct(actions: Action[]): Action[] {
  const seen = new Set<string>()
  return actions.filter((action) => {
    const key = JSON.stringify(action)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/** The candidate actions the expert compares, the choice of the hard level first. */
export function expertCandidates(view: PlayerView, turn: TurnProgress, budget: ExpertBudget = DEFAULT_EXPERT_BUDGET): Action[] {
  const heuristic = chooseHeuristicAction(view, 'hard', turn)
  return distinct([heuristic, ...alternativesTo(view, turn, budget, heuristic)])
}

/** Mean value of each candidate over the same simulated worlds and dice, so that candidates are compared on equal luck. */
export function candidateValues(view: PlayerView, turn: TurnProgress, candidates: Action[], samples: number): number[] {
  const random = aiRandom(view, 'expert')
  const totals = candidates.map(() => 0)
  for (let sample = 0; sample < samples; sample++) {
    const world = determinize(view, random)
    candidates.forEach((candidate, index) => {
      const state = structuredClone(world)
      const result = applyActionInPlace(state, candidate)
      totals[index] = result.ok
        ? (totals[index] ?? 0) + rollout(state, view.viewer, progressAfter(turn, candidate, result.events))
        : -Infinity
    })
  }
  return totals.map((total) => total / samples)
}

/**
 * The action of the expert level: the hard level's choice, unless simulating the rest of the round from
 * worlds consistent with the view finds a better deployment or attack; the same view and progress always give the same action.
 */
export function expertAction(view: PlayerView, turn: TurnProgress = NEW_TURN, budget: ExpertBudget = DEFAULT_EXPERT_BUDGET): Action {
  const candidates = expertCandidates(view, turn, budget)
  const [heuristic] = candidates
  if (heuristic === undefined || candidates.length === 1) {
    return heuristic ?? chooseHeuristicAction(view, 'hard', turn)
  }
  const values = candidateValues(view, turn, candidates, budget.samples)
  const best = values.reduce((bestIndex, value, index) => (value > (values[bestIndex] ?? -Infinity) ? index : bestIndex), 0)
  return candidates[best] ?? heuristic
}
