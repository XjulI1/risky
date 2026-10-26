import { describe, expect, it } from 'vitest'
import { AI_LEVELS as ENGINE_AI_LEVELS, DEFAULT_SETTINGS, type PlayerConfig } from '../engine'
import {
  addPlayer,
  AI_LEVEL_LABELS,
  AI_LEVELS,
  AI_NAMES,
  chooseControl,
  chooseVariant,
  defaultSetup,
  gameFromSetup,
  isLevelAvailable,
  levelForSettings,
  MAX_NAME_LENGTH,
} from './gameForm'

function sequence(...values: number[]): () => number {
  let index = 0
  return () => values[index++ % values.length] ?? 0
}

const aiNames = (players: PlayerConfig[]) => players.filter((player) => player.kind === 'ai').map((player) => player.name)

describe('AI names', () => {
  it('lists about twenty distinct historical war leaders that fit in a player name', () => {
    expect(AI_NAMES.length).toBeGreaterThanOrEqual(18)
    expect(AI_NAMES.length).toBeLessThanOrEqual(22)
    expect(new Set(AI_NAMES).size).toBe(AI_NAMES.length)
    expect(AI_NAMES.every((name) => name.length <= MAX_NAME_LENGTH)).toBe(true)
  })

  it('names the AIs of the default setup at random from the list, the human keeping a numbered name', () => {
    const { players } = defaultSetup(sequence(0, 0))
    expect(players[0]?.name).toBe('Joueur 1')
    expect(aiNames(players)).toEqual([AI_NAMES[0], AI_NAMES[1]])
  })

  it('draws other names with another random source', () => {
    expect(aiNames(defaultSetup(sequence(0.5, 0.5)).players)).not.toEqual(aiNames(defaultSetup(sequence(0, 0)).players))
  })

  it('never gives the same name to two AIs of a game', () => {
    let players = defaultSetup(sequence(0)).players
    for (let i = 0; i < 3; i++) {
      players = addPlayer(players, sequence(0))
    }
    const names = aiNames(players)
    expect(names).toHaveLength(5)
    expect(new Set(names).size).toBe(5)
    expect(names.every((name) => AI_NAMES.includes(name))).toBe(true)
  })

  it('does not reuse a name typed for another player', () => {
    const players = defaultSetup(sequence(0)).players.map((player, index) =>
      index === 0 ? { ...player, name: AI_NAMES[2] ?? '' } : player,
    )
    const added = addPlayer(players, sequence(0.1))
    expect(aiNames(added).at(-1)).not.toBe(AI_NAMES[2])
    expect(new Set(added.map((player) => player.name)).size).toBe(added.length)
  })

  it('gives a historical name to a human turned into an AI and a numbered name back to an AI turned human', () => {
    const players = defaultSetup(sequence(0)).players
    const asAi = chooseControl(players, 'player-1', { kind: 'ai', level: 'normal' }, sequence(0))
    expect(AI_NAMES).toContain(asAi[0]?.name)
    expect(new Set(aiNames(asAi)).size).toBe(3)
    const asHuman = chooseControl(asAi, 'player-2', { kind: 'human' })
    expect(asHuman[1]?.name).toBe('Joueur 2')
  })

  it('keeps the name of an AI whose level changes', () => {
    const players = defaultSetup(sequence(0)).players
    const harder = chooseControl(players, 'player-2', { kind: 'ai', level: 'hard' }, sequence(0.9))
    expect(harder[1]?.name).toBe(players[1]?.name)
  })
})

describe('AI levels', () => {
  it('offers the levels of the engine, the expert one included', () => {
    expect(AI_LEVELS).toEqual(ENGINE_AI_LEVELS)
    expect(AI_LEVELS.map((level) => AI_LEVEL_LABELS[level])).toEqual(['Facile', 'Normal', 'Difficile', 'Expert'])
  })

  it('offers the expert level in the classic mode only', () => {
    expect(isLevelAvailable('expert', DEFAULT_SETTINGS)).toBe(true)
    expect(isLevelAvailable('expert', { ...DEFAULT_SETTINGS, secretMissions: true })).toBe(false)
    expect(isLevelAvailable('expert', { ...DEFAULT_SETTINGS, capitals: true })).toBe(false)
    expect(isLevelAvailable('hard', { ...DEFAULT_SETTINGS, capitals: true })).toBe(true)
  })

  it('brings the expert level back to the hard one when a variant is on', () => {
    expect(levelForSettings('expert', { ...DEFAULT_SETTINGS, secretMissions: true })).toBe('hard')
    expect(levelForSettings('expert', DEFAULT_SETTINGS)).toBe('expert')
    expect(levelForSettings('easy', { ...DEFAULT_SETTINGS, capitals: true })).toBe('easy')
  })
})

describe('chooseVariant', () => {
  it('starts with both variants off', () => {
    expect(defaultSetup().settings).toMatchObject({ secretMissions: false, capitals: false })
  })

  it('turns the secret missions off when the capitals mode is checked', () => {
    const settings = chooseVariant({ ...DEFAULT_SETTINGS, secretMissions: true }, 'capitals', true)
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, secretMissions: false, capitals: true })
  })

  it('turns the capitals mode off when the secret missions are checked', () => {
    const settings = chooseVariant({ ...DEFAULT_SETTINGS, capitals: true }, 'secretMissions', true)
    expect(settings).toEqual({ ...DEFAULT_SETTINGS, secretMissions: true, capitals: false })
  })

  it('leaves the other variant as it is when one is unchecked', () => {
    expect(chooseVariant({ ...DEFAULT_SETTINGS, capitals: true }, 'secretMissions', false)).toEqual({ ...DEFAULT_SETTINGS, capitals: true })
  })
})

describe('gameFromSetup', () => {
  it('starts a game again on the map of its setup, as « Rejouer » does from the end screen', () => {
    const setup = { ...defaultSetup(sequence(0)), mapId: 'france' as const }
    const replayed = gameFromSetup(setup, 7)
    expect(replayed.ok && replayed.state.mapId).toBe('france')
    expect(replayed.ok && replayed.state.players.map((player) => player.name)).toEqual(setup.players.map((player) => player.name))
  })
})

