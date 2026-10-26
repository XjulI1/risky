import { describe, expect, it } from 'vitest'
import { classicMap, CONQUER_24_TERRITORIES, generalMissions, type Mission } from '../../engine'
import { isBorder } from '../evaluation'
import { playerView } from '../playerView'
import { decide, newAiGame, playWhile, scenario, territoryCard } from '../testScenarios'

const GENERAL_MISSIONS = generalMissions(classicMap)

const DEFENDED_INDONESIA = (originArmies: number, siamArmies: number) =>
  scenario({
    layout: {
      indonesia: ['p1', originArmies],
      new_guinea: ['p1', 1],
      western_australia: ['p1', 1],
      eastern_australia: ['p1', 1],
      siam: ['p2', siamArmies],
    },
    phase: { kind: 'attack' },
  })

describe('easy AI', () => {
  it('deploys its reinforcements on border territories only', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { state, steps } = playWhile(newAiGame(['easy', 'easy', 'easy'], seed), 'easy', (current) => current.phase.kind === 'reinforce')
      expect(steps.length).toBeGreaterThan(0)
      for (const { before, action } of steps) {
        expect(action.type).toBe('deploy')
        if (action.type === 'deploy') {
          expect(isBorder(playerView(before, action.playerId), action.territory)).toBe(true)
        }
      }
      expect(state.phase.kind).toBe('attack')
    }
  })

  it('does not attack 3 armies with 5', () => {
    expect(decide(DEFENDED_INDONESIA(5, 3), 'easy')).toEqual({ type: 'endAttack', playerId: 'p1' })
  })

  it('attacks with twice as many armies and at least 4', () => {
    expect(decide(DEFENDED_INDONESIA(6, 3), 'easy')).toEqual({ type: 'attack', playerId: 'p1', from: 'indonesia', to: 'siam' })
    expect(decide(DEFENDED_INDONESIA(3, 1), 'easy')).toEqual({ type: 'endAttack', playerId: 'p1' })
  })

  it('stops attacking after 3 conquests in the turn', () => {
    const state = DEFENDED_INDONESIA(10, 1)
    expect(decide(state, 'easy', { attacks: 2, conquests: 2 }).type).toBe('attack')
    expect(decide(state, 'easy', { attacks: 3, conquests: 3 }).type).toBe('endAttack')
  })

  it('trades its cards only when it has to', () => {
    const infantry = [1, 2, 3, 4, 5].map((id) => territoryCard(id, 'infantry', 'alaska'))
    const withHand = (size: number) =>
      scenario({
        layout: { indonesia: ['p1', 3], siam: ['p2', 3] },
        phase: { kind: 'reinforce', reserve: 3 },
        hands: { p1: infantry.slice(0, size) },
      })
    expect(decide(withHand(3), 'easy').type).toBe('deploy')
    expect(decide(withHand(4), 'easy').type).toBe('deploy')
    expect(decide(withHand(5), 'easy').type).toBe('tradeCards')
  })

  it('plays the same action whatever its mission', () => {
    const missions: Mission[] = [CONQUER_24_TERRITORIES, GENERAL_MISSIONS[3]!, { kind: 'eliminate', target: 'p2' }]
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const { steps } = playWhile(newAiGame(['easy', 'easy', 'easy'], seed, { secretMissions: true }), 'easy', (current) => current.phase.kind !== 'gameOver' && current.currentPlayerIndex === current.firstPlayerIndex)
      expect(steps.length).toBeGreaterThan(1)
      for (const { before } of steps) {
        const me = before.players[before.currentPlayerIndex]?.id ?? ''
        const actions = missions.map((mission) => decide({ ...before, missions: { ...before.missions, [me]: mission } }, 'easy'))
        expect(actions.every((action) => JSON.stringify(action) === JSON.stringify(actions[0]))).toBe(true)
      }
    }
  })
})
