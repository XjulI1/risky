import { describe, expect, it } from 'vitest'
import { CONQUER_24_TERRITORIES, createGame, GENERAL_MISSIONS, type GameState, type Mission } from '../engine'
import { revealedMissions, winReasonText } from './missionDisplay'

function finishedGame(secretMissions: boolean): GameState {
  const created = createGame({
    seed: 4,
    settings: { secretMissions },
    players: [
      { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human' },
      { id: 'p2', name: 'Bob', color: '#3a7bd5', kind: 'ai', level: 'hard' },
      { id: 'p3', name: 'Carol', color: '#3fa34d', kind: 'ai', level: 'easy' },
    ],
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  state.phase = { kind: 'gameOver' }
  state.winner = 'p1'
  state.winReason = 'domination'
  if (secretMissions) {
    state.missions = { p1: CONQUER_24_TERRITORIES, p2: { kind: 'eliminate', target: 'p3' }, p3: GENERAL_MISSIONS[7] as Mission }
  }
  return state
}

describe('end of a game with missions', () => {
  it('tells that the winner accomplished its mission', () => {
    const state = finishedGame(true)
    state.winReason = 'mission'
    expect(`Alice remporte la partie ${winReasonText(state)}`).toBe(
      'Alice remporte la partie en accomplissant sa mission : Conquérir 24 territoires',
    )
  })

  it('tells that the winner eliminated all its opponents', () => {
    expect(winReasonText(finishedGame(true))).toBe('en éliminant tous ses adversaires')
  })

  it('gives no reason in a game without missions', () => {
    expect(winReasonText(finishedGame(false))).toBeNull()
  })

  it('reveals the mission of every player', () => {
    expect(revealedMissions(finishedGame(true)).map(({ player, text }) => `${player.name} : ${text}`)).toEqual([
      'Alice : Conquérir 24 territoires',
      'Bob : Éliminer Carol',
      'Carol : Occuper 18 territoires avec au moins 2 armées sur chacun',
    ])
    expect(revealedMissions(finishedGame(false))).toEqual([])
  })
})
