import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chooseAction, type TurnProgress } from '../ai'
import type { PlayerView } from '../ai/playerView'
import { classicMap, CONQUER_24_TERRITORIES, createGame, type Action, type AiLevel, type GameState, type PlayerControl } from '../engine'
import { capitalColors } from '../board/boardViewModel'
import type { AiDecider } from './aiDecider'
import { ANIMATION_DURATIONS, type AnimationSpeed } from './animationSpeed'
import type { GameSetup } from './gameForm'
import { loadSavedGame, SAVE_KEY } from './persistence'
import { createGameSession, createGameSessionFromSave } from './useGameSession'

const HUMAN: PlayerControl = { kind: 'human' }
const AI: PlayerControl = { kind: 'ai', level: 'normal' }

function attackingGame(controls: PlayerControl[] = [HUMAN, HUMAN, HUMAN]): GameState {
  const created = createGame({
    seed: 12,
    players: controls.map((control, i) => ({
      id: `p${i + 1}`,
      name: `Joueur ${i + 1}`,
      color: ['#d64541', '#3a7bd5', '#3fa34d'][i] ?? '#000',
      ...control,
    })),
  })
  if (!created.ok) throw new Error(created.error.message)
  const state = created.state
  for (const id of classicMap.territoryIds) {
    state.territories[id] = { owner: 'p2', armies: 1 }
  }
  state.territories.north_africa = { owner: 'p1', armies: 30 }
  state.territories.brazil = { owner: 'p2', armies: 6 }
  state.currentPlayerIndex = 0
  state.phase = { kind: 'attack' }
  return state
}

const attack = { type: 'attack', playerId: 'p1', from: 'north_africa', to: 'brazil' } as const

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  }
}

const setup = (state: GameState): GameSetup => ({
  players: state.players.filter((player) => !player.isNeutral).map(({ id, name, color, ...control }) => ({
    id,
    name,
    color,
    ...(control.kind === 'ai' ? { kind: 'ai' as const, level: control.level } : { kind: 'human' as const }),
  })),
  settings: state.settings,
  mapId: state.mapId,
})

function slowDecider(milliseconds: number): AiDecider & { disposed: boolean } {
  const decider = {
    disposed: false,
    decide: (view: PlayerView, level: AiLevel, turn: TurnProgress) =>
      new Promise<Action>((resolve) => setTimeout(() => resolve(chooseAction(view, level, turn)), milliseconds)),
    dispose: () => {
      decider.disposed = true
    },
  }
  return decider
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('createGameSession', () => {
  it('updates the engine state at once and the displayed state at the end of the animations', async () => {
    const initial = attackingGame()
    const session = createGameSession(initial, { speed: 'normal' })
    session.dispatch(attack)
    expect(session.engineState.value).not.toBe(initial)
    expect(session.displayedState.value).toBe(initial)
    expect(session.isPresenting.value).toBe(true)
    await vi.runAllTimersAsync()
    expect(session.isPresenting.value).toBe(false)
    expect(session.displayedState.value).toBe(session.engineState.value)
  })

  it('shows the dice of each roll as the current step while presenting', async () => {
    const session = createGameSession(attackingGame(), { speed: 'normal' })
    session.dispatch(attack)
    expect(session.currentStep.value?.kind).toBe('roll')
    await vi.runAllTimersAsync()
    expect(session.currentStep.value).toBeNull()
  })

  it('does not animate at the instant speed', () => {
    const session = createGameSession(attackingGame(), { speed: 'instant' })
    session.dispatch(attack)
    expect(session.isPresenting.value).toBe(false)
    expect(session.displayedState.value).toBe(session.engineState.value)
  })

  it('ignores player input while presenting', () => {
    const session = createGameSession(attackingGame(), { speed: 'normal' })
    session.dispatch(attack)
    const engineState = session.engineState.value
    session.input({ kind: 'endAttack' })
    expect(session.engineState.value).toBe(engineState)
  })

  it('jumps to the final state when the animation is skipped', () => {
    const session = createGameSession(attackingGame(), { speed: 'normal' })
    session.dispatch(attack)
    session.skipAnimation()
    expect(session.isPresenting.value).toBe(false)
    expect(session.currentStep.value).toBeNull()
    expect(session.displayedState.value).toBe(session.engineState.value)
  })

  it('exposes the engine message when an action is rejected, without changing the state', () => {
    const initial = attackingGame()
    const session = createGameSession(initial, { speed: 'instant' })
    session.dispatch({ type: 'attack', playerId: 'p1', from: 'north_africa', to: 'india' })
    expect(session.error.value).toBe('Ces territoires ne sont pas voisins.')
    expect(session.engineState.value).toBe(initial)
    session.dismissError()
    expect(session.error.value).toBeNull()
  })

  it('turns player input into engine actions', () => {
    const session = createGameSession(attackingGame(), { speed: 'instant' })
    session.input({ kind: 'endAttack' })
    expect(session.engineState.value.phase.kind).toBe('fortify')
  })
})

describe('hand-off between humans', () => {
  function endTurn(controls: PlayerControl[]) {
    const session = createGameSession(attackingGame(controls), { speed: 'instant' })
    session.input({ kind: 'endAttack' })
    session.input({ kind: 'skipFortify' })
    return session
  }

  it('asks the next human to take the device', () => {
    const session = endTurn([HUMAN, HUMAN, HUMAN])
    expect(session.handoffTo.value?.id).toBe('p2')
    session.acknowledgeHandoff()
    expect(session.handoffTo.value).toBeNull()
  })

  it('does not interrupt a game with a single human', () => {
    expect(endTurn([HUMAN, AI, AI]).handoffTo.value).toBeNull()
  })
})

describe('hand-off during the capital choice', () => {
  function choosingGame(controls: PlayerControl[]): GameState {
    const created = createGame({
      seed: 12,
      settings: { capitals: true },
      players: controls.map((control, i) => ({ id: `p${i + 1}`, name: `Joueur ${i + 1}`, color: ['#d64541', '#3a7bd5', '#3fa34d'][i] ?? '#000', ...control })),
    })
    if (!created.ok) throw new Error(created.error.message)
    created.state.currentPlayerIndex = 0
    created.state.firstPlayerIndex = 0
    return created.state
  }

  function chooseFirstTerritory(session: ReturnType<typeof createGameSession>) {
    const state = session.engineState.value
    const playerId = state.players[state.currentPlayerIndex]?.id ?? ''
    const territory = classicMap.territoryIds.find((id) => state.territories[id]?.owner === playerId) ?? ''
    session.input({ kind: 'territory', territory })
    session.input({ kind: 'confirm' })
  }

  it('asks the next human to take the device before each choice', () => {
    const session = createGameSession(choosingGame([HUMAN, HUMAN, HUMAN]), { speed: 'instant' })
    chooseFirstTerritory(session)
    expect(session.engineState.value.phase.kind).toBe('capitalChoice')
    expect(session.handoffTo.value?.id).toBe('p2')
    session.acknowledgeHandoff()
    chooseFirstTerritory(session)
    expect(session.handoffTo.value?.id).toBe('p3')
  })

  it('announces every capital once the last one is chosen, the AI waiting for the announcement to close', async () => {
    const session = createGameSession(choosingGame([AI, HUMAN, HUMAN]), { speed: 'instant' })
    await vi.runAllTimersAsync()
    chooseFirstTerritory(session)
    session.acknowledgeHandoff()
    expect(session.revealedCapitals.value).toBeNull()
    chooseFirstTerritory(session)
    const revealed = session.engineState.value
    expect(revealed.capitals).not.toBeNull()
    expect(session.revealedCapitals.value).toEqual(revealed.capitals)
    await vi.runAllTimersAsync()
    expect(session.engineState.value).toBe(revealed)
    session.acknowledgeRevealedCapitals()
    expect(session.revealedCapitals.value).toBeNull()
    await vi.runAllTimersAsync()
    expect(session.engineState.value).not.toBe(revealed)
  })

  it('does not interrupt the choice of a single human', () => {
    const session = createGameSession(choosingGame([HUMAN, AI, AI]), { speed: 'instant' })
    chooseFirstTerritory(session)
    expect(session.handoffTo.value).toBeNull()
  })
})

describe('capital lost by a human', () => {
  function bobsCapitalTaken(controls: PlayerControl[], capitals = { p1: 'egypt', p2: 'brazil', p3: 'peru' }) {
    const state = attackingGame(controls)
    state.settings = { ...state.settings, capitals: true }
    state.capitals = capitals
    state.territories.brazil = { owner: 'p2', armies: 1 }
    const session = createGameSession(state, { speed: 'instant' })
    session.dispatch(attack)
    return session
  }

  it('alerts when a human loses its capital', () => {
    const session = bobsCapitalTaken([HUMAN, HUMAN, HUMAN])
    expect(session.capitalLost.value).toMatchObject({ player: { id: 'p2' }, territory: 'brazil' })
    session.acknowledgeCapitalLost()
    expect(session.capitalLost.value).toBeNull()
  })

  it('does not alert when an AI loses its capital', () => {
    expect(bobsCapitalTaken([HUMAN, AI, AI]).capitalLost.value).toBeNull()
  })

  it('does not alert when a capital already lost changes hands', () => {
    expect(bobsCapitalTaken([HUMAN, HUMAN, HUMAN], { p1: 'egypt', p2: 'peru', p3: 'brazil' }).capitalLost.value).toBeNull()
  })
})

describe('converted mission', () => {
  function carolEliminatedByP1(controls: PlayerControl[]) {
    const state = attackingGame(controls)
    state.territories.brazil = { owner: 'p3', armies: 1 }
    state.missions = { p1: CONQUER_24_TERRITORIES, p2: { kind: 'eliminate', target: 'p3' }, p3: CONQUER_24_TERRITORIES }
    const session = createGameSession(state, { speed: 'instant' })
    session.dispatch(attack)
    session.input({ kind: 'confirm', amount: 3 })
    return session
  }

  function passTurn(session: ReturnType<typeof carolEliminatedByP1>) {
    session.input({ kind: 'endAttack' })
    session.input({ kind: 'skipFortify' })
  }

  it('tells the human holder at the start of its next turn, after the hand-off', () => {
    const session = carolEliminatedByP1([HUMAN, HUMAN, HUMAN])
    expect(session.engineState.value.missions?.p2).toEqual(CONQUER_24_TERRITORIES)
    expect(session.convertedMission.value).toBeNull()
    passTurn(session)
    expect(session.handoffTo.value?.id).toBe('p2')
    expect(session.convertedMission.value?.id).toBe('p2')
    session.acknowledgeConvertedMission()
    expect(session.convertedMission.value).toBeNull()
  })

  it('keeps the conversion out of the journal', () => {
    const session = carolEliminatedByP1([HUMAN, HUMAN, HUMAN])
    passTurn(session)
    expect(session.journal.value.some((entry) => entry.text.includes('mission'))).toBe(false)
  })

  it('tells nothing when the holder is an AI', () => {
    const session = carolEliminatedByP1([HUMAN, AI, HUMAN])
    passTurn(session)
    expect(session.convertedMission.value).toBeNull()
  })
})

describe('AI turns', () => {
  function reinforcingGame(controls: PlayerControl[]): GameState {
    const state = attackingGame(controls)
    state.phase = { kind: 'reinforce', reserve: 3 }
    return state
  }

  const currentId = (state: GameState) => state.players[state.currentPlayerIndex]?.id

  it('plays the actions of an AI on its own until a human must play', async () => {
    const initial = reinforcingGame([AI, HUMAN, AI])
    const session = createGameSession(initial, { speed: 'instant' })
    await vi.runAllTimersAsync()
    expect(session.engineState.value).not.toBe(initial)
    expect(currentId(session.engineState.value)).toBe('p2')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('waits for the delay of the speed before each action', async () => {
    const initial = reinforcingGame([AI, HUMAN, HUMAN])
    const session = createGameSession(initial, { speed: 'normal' })
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction - 1)
    expect(session.engineState.value).toBe(initial)
    await vi.advanceTimersByTimeAsync(1)
    expect(session.engineState.value).not.toBe(initial)
  })

  it('plays without delay at the instant speed', async () => {
    const initial = reinforcingGame([AI, HUMAN, HUMAN])
    const session = createGameSession(initial, { speed: 'instant' })
    await vi.advanceTimersByTimeAsync(0)
    expect(session.engineState.value).not.toBe(initial)
  })

  it('highlights the origin and the target of an attack before rolling the dice', async () => {
    const session = createGameSession(attackingGame([AI, HUMAN, HUMAN]), { speed: 'normal' })
    await vi.advanceTimersByTimeAsync(0)
    const focus = session.aiFocus.value
    expect(focus?.from).toBe('north_africa')
    expect(session.lastEvents.value).toEqual([])
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction)
    expect(session.aiFocus.value).toBeNull()
    expect(session.lastEvents.value[0]).toMatchObject({ type: 'diceRolled', from: focus?.from, to: focus?.to })
  })

  it('names the AI that is playing and ignores the input of the humans meanwhile', () => {
    const initial = attackingGame([AI, HUMAN, HUMAN])
    const session = createGameSession(initial, { speed: 'normal' })
    expect(session.thinkingPlayer.value?.id).toBe('p1')
    session.input({ kind: 'endAttack' })
    expect(session.engineState.value).toBe(initial)
  })

  it('does not name any AI during the turn of a human', () => {
    expect(createGameSession(attackingGame(), { speed: 'normal' }).thinkingPlayer.value).toBeNull()
  })

  it('stops playing when the game is left', async () => {
    const initial = reinforcingGame([AI, HUMAN, HUMAN])
    const session = createGameSession(initial, { speed: 'normal' })
    session.dispose()
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction * 10)
    expect(session.engineState.value).toBe(initial)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('waits for the human to close the notice of the card drawn before the AI plays', async () => {
    const session = createGameSession(attackingGame([HUMAN, AI, AI]), { speed: 'instant' })
    session.dispatch(attack)
    session.input({ kind: 'confirm', amount: 3 })
    session.input({ kind: 'endAttack' })
    session.input({ kind: 'skipFortify' })
    expect(session.drawnCard.value).not.toBeNull()
    const afterHumanTurn = session.engineState.value
    await vi.advanceTimersByTimeAsync(1000)
    expect(session.engineState.value).toBe(afterHumanTurn)
    session.acknowledgeDrawnCard()
    await vi.advanceTimersByTimeAsync(0)
    expect(session.engineState.value).not.toBe(afterHumanTurn)
  })
})

describe('AI thinking', () => {
  function reinforcingGame(): GameState {
    const state = attackingGame([AI, HUMAN, HUMAN])
    state.phase = { kind: 'reinforce', reserve: 3 }
    return state
  }

  it('plays at the end of the delay when the decision is shorter', async () => {
    const initial = reinforcingGame()
    const session = createGameSession(initial, { speed: 'normal', decider: slowDecider(300) })
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction - 1)
    expect(session.engineState.value).toBe(initial)
    await vi.advanceTimersByTimeAsync(1)
    expect(session.engineState.value).not.toBe(initial)
  })

  it('plays a deployment as soon as it is decided when the decision is longer than the delay', async () => {
    const initial = reinforcingGame()
    const session = createGameSession(initial, { speed: 'fast', decider: slowDecider(1000) })
    await vi.advanceTimersByTimeAsync(999)
    expect(session.engineState.value).toBe(initial)
    await vi.advanceTimersByTimeAsync(1)
    expect(session.lastEvents.value[0]).toMatchObject({ type: 'armiesDeployed' })
  })

  it('highlights an attack decided late during half the delay before playing it', async () => {
    const initial = attackingGame([AI, HUMAN, HUMAN])
    const session = createGameSession(initial, { speed: 'normal', decider: slowDecider(1000) })
    await vi.advanceTimersByTimeAsync(999)
    expect(session.aiFocus.value).toBeNull()
    await vi.advanceTimersByTimeAsync(1)
    const focus = session.aiFocus.value
    expect(focus?.from).toBe('north_africa')
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction / 2 - 1)
    expect(session.engineState.value).toBe(initial)
    await vi.advanceTimersByTimeAsync(1)
    expect(session.aiFocus.value).toBeNull()
    expect(session.lastEvents.value[0]).toMatchObject({ type: 'diceRolled', from: focus?.from, to: focus?.to })
  })

  it('waits for nothing but the decision at the instant speed', async () => {
    const initial = reinforcingGame()
    const session = createGameSession(initial, { speed: 'instant', decider: slowDecider(200) })
    await vi.advanceTimersByTimeAsync(199)
    expect(session.engineState.value).toBe(initial)
    await vi.advanceTimersByTimeAsync(1)
    expect(session.engineState.value).not.toBe(initial)
  })

  it('shows that the AI is thinking half a second after a long decision started, until its action is played', async () => {
    const session = createGameSession(reinforcingGame(), { speed: 'fast', decider: slowDecider(2000) })
    await vi.advanceTimersByTimeAsync(499)
    expect(session.aiThinking.value).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(session.aiThinking.value).toBe(true)
    await vi.advanceTimersByTimeAsync(1500)
    expect(session.lastEvents.value[0]).toMatchObject({ type: 'armiesDeployed' })
    expect(session.aiThinking.value).toBe(false)
  })

  it('never shows that the AI is thinking for a quick decision', async () => {
    const session = createGameSession(reinforcingGame(), { speed: 'normal', decider: slowDecider(100) })
    for (const step of [100, 450, 149]) {
      await vi.advanceTimersByTimeAsync(step)
      expect(session.aiThinking.value).toBe(false)
    }
  })

  it('tells that the AI could not play when its decision fails', async () => {
    const initial = reinforcingGame()
    const failing: AiDecider = { decide: () => Promise.reject(new Error('worker crashed')), dispose: () => {} }
    const session = createGameSession(initial, { speed: 'normal', decider: failing })
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction)
    expect(session.engineState.value).toBe(initial)
    expect(session.error.value).toBe(`${initial.players[0]?.name} n'a pas pu jouer.`)
    expect(session.aiThinking.value).toBe(false)
  })

  it('drops the pending decision when the game is left', async () => {
    const initial = reinforcingGame()
    const storage = memoryStorage()
    const decider = slowDecider(2000)
    const session = createGameSession(initial, { speed: 'normal', decider, persistence: { setup: setup(initial), storage } })
    const saved = storage.getItem(SAVE_KEY)
    await vi.advanceTimersByTimeAsync(1000)
    session.dispose()
    await vi.advanceTimersByTimeAsync(5000)
    expect(session.engineState.value).toBe(initial)
    expect(storage.getItem(SAVE_KEY)).toBe(saved)
    expect(decider.disposed).toBe(true)
    expect(session.aiThinking.value).toBe(false)
  })
})

describe('journal, statistics and save', () => {
  function savedSession(initial: GameState, speed: AnimationSpeed = 'instant') {
    const storage = memoryStorage()
    const session = createGameSession(initial, { speed, persistence: { setup: setup(initial), storage } })
    return { session, storage }
  }

  const deploy = { type: 'deploy', playerId: 'p1', territory: 'north_africa', armies: 3 } as const

  function reinforcing(controls: PlayerControl[] = [HUMAN, HUMAN, HUMAN]): GameState {
    const state = attackingGame(controls)
    state.phase = { kind: 'reinforce', reserve: 3 }
    return state
  }

  it('adds the entries and updates the statistics of each action', () => {
    const { session } = savedSession(reinforcing())
    session.dispatch(deploy)
    expect(session.journal.value.at(-1)?.text).toBe('Joueur 1 place 3 armées en Afrique du Nord')
    session.input({ kind: 'endAttack' })
    session.input({ kind: 'skipFortify' })
    expect(session.turnNumber.value).toBe(2)
    expect(session.statistics.value.snapshots.at(-1)?.turn).toBe(2)
    expect(session.journal.value.at(-1)).toMatchObject({ header: true, text: 'Tour 2 — Joueur 2' })
  })

  it('shows an attack in the journal only once its rolls have been animated', async () => {
    const { session } = savedSession(attackingGame(), 'normal')
    session.dispatch(attack)
    const attackEntry = session.journal.value.find((entry) => entry.text.includes('attaque'))
    expect(attackEntry).toBeDefined()
    expect(session.visibleJournal.value).not.toContain(attackEntry)
    await vi.runAllTimersAsync()
    expect(session.visibleJournal.value).toContain(attackEntry)
    expect(session.visibleJournal.value).toHaveLength(session.journal.value.length)
  })

  it('shows the whole journal at once when the animation is skipped', () => {
    const { session } = savedSession(attackingGame(), 'normal')
    session.dispatch(attack)
    session.skipAnimation()
    expect(session.visibleJournal.value).toEqual(session.journal.value)
  })

  it('saves the game after each action of a human', () => {
    const { session, storage } = savedSession(reinforcing())
    session.dispatch(deploy)
    const loaded = loadSavedGame(storage)
    expect(loaded.kind === 'saved' && loaded.game.engineState).toEqual(session.engineState.value)
    expect(loaded.kind === 'saved' && loaded.game.journal).toEqual(session.journal.value)
    expect(loaded.kind === 'saved' && loaded.game.status).toBe('inProgress')
  })

  it('saves the game after each action of an AI', async () => {
    const { session, storage } = savedSession(reinforcing([AI, HUMAN, HUMAN]))
    await vi.advanceTimersByTimeAsync(0)
    const loaded = loadSavedGame(storage)
    expect(loaded.kind === 'saved' && loaded.game.engineState).toEqual(session.engineState.value)
    expect(loaded.kind === 'saved' && loaded.game.engineState).not.toEqual(reinforcing([AI, HUMAN, HUMAN]))
  })

  it('resumes a game saved during the capital choice on the right player, without revealing the choices made', () => {
    const created = createGame({
      seed: 12,
      settings: { capitals: true },
      players: [HUMAN, HUMAN, HUMAN].map((control, i) => ({ id: `p${i + 1}`, name: `Joueur ${i + 1}`, color: ['#d64541', '#3a7bd5', '#3fa34d'][i] ?? '#000', ...control })),
    })
    if (!created.ok) throw new Error(created.error.message)
    const { session, storage } = savedSession(created.state)
    const chooser = session.engineState.value.players[session.engineState.value.currentPlayerIndex]?.id ?? ''
    const territory = classicMap.territoryIds.find((id) => session.engineState.value.territories[id]?.owner === chooser) ?? ''
    session.input({ kind: 'territory', territory })
    session.input({ kind: 'confirm' })
    const loaded = loadSavedGame(storage)
    if (loaded.kind !== 'saved') throw new Error(loaded.kind)
    const resumed = createGameSessionFromSave(loaded.game, { speed: 'instant', storage })
    const state = resumed.engineState.value
    expect(state.phase).toEqual({ kind: 'capitalChoice', pending: { [chooser]: territory } })
    expect(state.currentPlayerIndex).toBe(session.engineState.value.currentPlayerIndex)
    expect(state.players[state.currentPlayerIndex]?.id).not.toBe(chooser)
    expect(state.capitals).toBeNull()
    expect(capitalColors(resumed.displayedState.value)).toEqual({})
    expect(resumed.revealedCapitals.value).toBeNull()
    expect(resumed.journal.value.some((entry) => entry.text.includes('apitale'))).toBe(false)
  })

  it('saves a game as soon as it starts, replacing the previous save', () => {
    const { storage } = savedSession(reinforcing())
    expect(loadSavedGame(storage).kind).toBe('saved')
  })

  it('warns once that the game cannot be saved', () => {
    const initial = reinforcing()
    const full = {
      ...memoryStorage(),
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError')
      },
    }
    const session = createGameSession(initial, { speed: 'instant', persistence: { setup: setup(initial), storage: full } })
    expect(session.storageWarning.value).toBe(true)
    session.dismissStorageWarning()
    session.dispatch(deploy)
    expect(session.storageWarning.value).toBe(false)
    expect(session.engineState.value.phase.kind).toBe('attack')
  })

  it('resumes a saved game without animation and lets an AI go on with its turn', async () => {
    const { session: first, storage } = savedSession(attackingGame())
    first.dispatch(attack)
    first.input({ kind: 'confirm', amount: 3 })
    first.input({ kind: 'endAttack' })
    first.input({ kind: 'skipFortify' })
    first.dispose()
    const loaded = loadSavedGame(storage)
    if (loaded.kind !== 'saved') throw new Error('no save')
    const aiTurn = structuredClone(loaded.game)
    aiTurn.engineState.players = aiTurn.engineState.players.map((player) =>
      player.id === 'p2' ? { ...player, kind: 'ai', level: 'normal' } : player,
    )

    const resumed = createGameSessionFromSave(aiTurn, { speed: 'normal', storage })
    expect(resumed.isPresenting.value).toBe(false)
    expect(resumed.displayedState.value).toBe(resumed.engineState.value)
    expect(resumed.visibleJournal.value).toEqual(aiTurn.journal)
    expect(resumed.turnNumber.value).toBe(aiTurn.turnNumber)
    expect(resumed.statistics.value).toEqual(aiTurn.statistics)
    expect(resumed.thinkingPlayer.value?.id).toBe('p2')
    await vi.advanceTimersByTimeAsync(ANIMATION_DURATIONS.normal.aiAction)
    expect(resumed.engineState.value).not.toEqual(aiTurn.engineState)
  })

  it('marks the save as finished once the game is won', () => {
    const initial = attackingGame()
    for (const id of Object.keys(initial.territories)) {
      initial.territories[id] = { owner: 'p1', armies: 1 }
    }
    initial.territories.north_africa = { owner: 'p1', armies: 30 }
    initial.territories.brazil = { owner: 'p2', armies: 1 }
    initial.players = initial.players.map((player) => (player.id === 'p3' ? { ...player, eliminated: true } : player))
    const { session, storage } = savedSession(initial)
    session.dispatch(attack)
    expect(session.engineState.value.phase.kind).toBe('gameOver')
    const loaded = loadSavedGame(storage)
    expect(loaded.kind === 'saved' && loaded.game.status).toBe('finished')
  })
})
