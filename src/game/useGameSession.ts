import { computed, inject, provide, ref, shallowRef, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue'
import { NEW_TURN, nextAiAction, progressAfter, type TurnProgress } from '../ai'
import {
  applyAction,
  type Action,
  type Card,
  type GameEvent,
  type GameState,
  type Player,
  type PlayerId,
  type TerritoryId,
} from '../engine'
import { ANIMATION_DURATIONS, readSpeedPreference, writeSpeedPreference, type AnimationSpeed } from './animationSpeed'
import type { GameSetup } from './gameForm'
import { journalBatch, openingJournal, type JournalEntry } from './history/journal'
import { initialStatistics, recordStatistics, type GameStatistics } from './history/statistics'
import { initialTurnNumber, nextTurnNumber } from './history/turnCounter'
import { IDLE, reduceInteraction, viewOf, type Interaction, type InteractionInput, type InteractionView } from './interaction'
import { SAVE_FORMAT_VERSION, writeSavedGame, type SavedGame, type SaveStorage } from './persistence'
import { presentationSteps, projectStep, stepDuration, type PresentationStep } from './presentation'

/** The attack an AI is about to launch, shown on the board before the dice are rolled. */
export type AiFocus = {
  from: TerritoryId
  to: TerritoryId
}

/** A capital a human has just lost. */
export type LostCapital = {
  player: Player
  territory: TerritoryId
}

/** A running game as seen by the interface: engine truth, what is on screen and what the player is doing. */
export type GameSession = {
  engineState: ShallowRef<GameState>
  displayedState: ShallowRef<GameState>
  isPresenting: Ref<boolean>
  currentStep: ShallowRef<PresentationStep | null>
  lastEvents: ShallowRef<GameEvent[]>
  interaction: Ref<Interaction>
  view: ComputedRef<InteractionView>
  error: Ref<string | null>
  speed: Ref<AnimationSpeed>
  handoffTo: ShallowRef<Player | null>
  drawnCard: ShallowRef<Card | null>
  convertedMission: ShallowRef<Player | null>
  revealedCapitals: ShallowRef<Record<PlayerId, TerritoryId> | null>
  capitalLost: ShallowRef<LostCapital | null>
  thinkingPlayer: ComputedRef<Player | null>
  aiFocus: ShallowRef<AiFocus | null>
  journal: ShallowRef<JournalEntry[]>
  visibleJournal: ComputedRef<JournalEntry[]>
  statistics: ShallowRef<GameStatistics>
  turnNumber: Ref<number>
  storageWarning: Ref<boolean>
  dispatch: (action: Action) => void
  input: (input: InteractionInput) => void
  skipAnimation: () => void
  dismissError: () => void
  acknowledgeHandoff: () => void
  acknowledgeDrawnCard: () => void
  acknowledgeConvertedMission: () => void
  acknowledgeRevealedCapitals: () => void
  acknowledgeCapitalLost: () => void
  setSpeed: (speed: AnimationSpeed) => void
  dismissStorageWarning: () => void
  dispose: () => void
}

/** Journal, statistics and turn number of a game, restored from a save. */
export type GameHistory = {
  journal: JournalEntry[]
  statistics: GameStatistics
  turnNumber: number
}

type SessionOptions = {
  speed?: AnimationSpeed
  persistence?: {
    setup: GameSetup
    storage?: SaveStorage | null
  }
  history?: GameHistory
}

const SETUP_PHASES = new Set(['claim', 'placement'])

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function currentPlayerOf(state: GameState): Player | undefined {
  return state.players[state.currentPlayerIndex]
}

function aiPlayerOf(state: GameState): Player | null {
  const player = currentPlayerOf(state)
  return player?.kind === 'ai' && state.phase.kind !== 'gameOver' ? player : null
}

function needsHandoff(before: GameState, after: GameState): Player | null {
  const previous = currentPlayerOf(before)
  const next = currentPlayerOf(after)
  const humans = after.players.filter((player) => player.kind === 'human' && !player.isNeutral)
  const isHandoff =
    previous !== undefined &&
    next !== undefined &&
    previous.id !== next.id &&
    previous.kind === 'human' &&
    next.kind === 'human' &&
    humans.length >= 2 &&
    !SETUP_PHASES.has(after.phase.kind) &&
    after.phase.kind !== 'gameOver'
  return isHandoff ? next : null
}

function drawnCardOf(state: GameState, events: GameEvent[]): Card | null {
  const drawn = events.find((event) => event.type === 'cardDrawn')
  if (drawn === undefined || drawn.type !== 'cardDrawn') {
    return null
  }
  const player = state.players.find((candidate) => candidate.id === drawn.playerId)
  if (player?.kind !== 'human') {
    return null
  }
  return state.hands[drawn.playerId]?.find((card) => card.id === drawn.cardId) ?? null
}

function convertedHumans(state: GameState, events: GameEvent[]): PlayerId[] {
  return events.flatMap((event) =>
    event.type === 'missionConverted' && state.players.some((player) => player.id === event.playerId && player.kind === 'human')
      ? [event.playerId]
      : [],
  )
}

function revealedCapitalsOf(events: GameEvent[]): Record<PlayerId, TerritoryId> | null {
  const revealed = events.find((event) => event.type === 'capitalsRevealed')
  return revealed?.type === 'capitalsRevealed' ? revealed.capitals : null
}

function capitalLostByHuman(state: GameState, events: GameEvent[]): LostCapital | null {
  const lost = events.findLast((event, index) => {
    const conquest = events[index - 1]
    return (
      event.type === 'capitalCaptured' &&
      conquest?.type === 'territoryConquered' &&
      conquest.previousOwner === event.from &&
      event.by !== event.from
    )
  })
  if (lost?.type !== 'capitalCaptured') {
    return null
  }
  const player = state.players.find((candidate) => candidate.id === lost.from)
  return player?.kind === 'human' ? { player, territory: lost.territory } : null
}

function startedTurnOf(state: GameState, events: GameEvent[]): Player | null {
  const started = events.findLast((event) => event.type === 'turnStarted')
  return started === undefined ? null : (state.players.find((player) => player.id === started.playerId) ?? null)
}

function warnOnDivergence(projected: GameState, actual: GameState): void {
  if (import.meta.env.DEV && JSON.stringify(projected.territories) !== JSON.stringify(actual.territories)) {
    console.warn('Presentation diverged from the engine state', { projected, actual })
  }
}

/** Starts a session on `initial`: dispatches actions to the engine and plays their events at the chosen speed. */
export function createGameSession(initial: GameState, options: SessionOptions = {}): GameSession {
  const engineState = shallowRef(initial)
  const displayedState = shallowRef(initial)
  const isPresenting = ref(false)
  const currentStep = shallowRef<PresentationStep | null>(null)
  const lastEvents = shallowRef<GameEvent[]>([])
  const interaction = ref<Interaction>(IDLE)
  const error = ref<string | null>(null)
  const speed = ref<AnimationSpeed>(options.speed ?? readSpeedPreference())
  const handoffTo = shallowRef<Player | null>(null)
  const drawnCard = shallowRef<Card | null>(null)
  const convertedMission = shallowRef<Player | null>(null)
  const pendingConversions = new Set<PlayerId>()
  const revealedCapitals = shallowRef<Record<PlayerId, TerritoryId> | null>(null)
  const capitalLost = shallowRef<LostCapital | null>(null)
  const aiFocus = shallowRef<AiFocus | null>(null)
  const turnNumber = ref(options.history?.turnNumber ?? initialTurnNumber(initial))
  const journal = shallowRef<JournalEntry[]>(options.history?.journal ?? openingJournal(initial, turnNumber.value))
  const visibleCount = ref(journal.value.length)
  const statistics = shallowRef<GameStatistics>(options.history?.statistics ?? initialStatistics(initial, turnNumber.value))
  const storageWarning = ref(false)
  let storageWarned = false
  let revealBase = journal.value.length
  let revealSteps: number[] = []
  let presentationRun = 0
  let turnProgress: TurnProgress = NEW_TURN
  let aiTimer: ReturnType<typeof setTimeout> | null = null
  let disposed = false

  const scheduleAiAction = () => {
    if (disposed || aiTimer !== null || isPresenting.value || drawnCard.value !== null || revealedCapitals.value !== null) {
      return
    }
    const action = nextAiAction(engineState.value, turnProgress)
    if (action === null) {
      return
    }
    aiFocus.value = action.type === 'attack' && speed.value !== 'instant' ? { from: action.from, to: action.to } : null
    aiTimer = setTimeout(() => {
      aiTimer = null
      aiFocus.value = null
      dispatch(action)
    }, ANIMATION_DURATIONS[speed.value].aiAction)
  }

  const revealJournal = (completedSteps: number) => {
    visibleCount.value = revealBase + revealSteps.filter((steps) => steps <= completedSteps).length
  }

  const save = () => {
    if (options.persistence === undefined) {
      return
    }
    const game: SavedGame = {
      formatVersion: SAVE_FORMAT_VERSION,
      savedAt: new Date().toISOString(),
      status: engineState.value.phase.kind === 'gameOver' ? 'finished' : 'inProgress',
      creation: options.persistence.setup,
      engineState: engineState.value,
      journal: journal.value,
      statistics: statistics.value,
      turnNumber: turnNumber.value,
    }
    if (!writeSavedGame(game, options.persistence.storage) && !storageWarned) {
      storageWarned = true
      storageWarning.value = true
    }
  }

  const finishPresentation = () => {
    presentationRun += 1
    currentStep.value = null
    isPresenting.value = false
    displayedState.value = engineState.value
    visibleCount.value = journal.value.length
    scheduleAiAction()
  }

  const present = async (steps: PresentationStep[]) => {
    const run = ++presentationRun
    const durations = ANIMATION_DURATIONS[speed.value]
    let projected = displayedState.value
    isPresenting.value = steps.length > 0 && speed.value !== 'instant'
    if (isPresenting.value) {
      for (const [index, step] of steps.entries()) {
        currentStep.value = step
        await wait(stepDuration(step, durations))
        if (run !== presentationRun) {
          return
        }
        projected = projectStep(projected, step)
        displayedState.value = projected
        revealJournal(index + 1)
      }
    } else {
      projected = steps.reduce(projectStep, projected)
    }
    warnOnDivergence(projected, engineState.value)
    finishPresentation()
  }

  const notifyConversion = (state: GameState, events: GameEvent[]) => {
    convertedHumans(state, events).forEach((playerId) => pendingConversions.add(playerId))
    const started = startedTurnOf(state, events)
    if (started !== null && pendingConversions.delete(started.id)) {
      convertedMission.value = started
    }
  }

  const dispatch = (action: Action) => {
    const before = engineState.value
    const result = applyAction(before, action)
    if (!result.ok) {
      error.value = result.error.message
      return
    }
    error.value = null
    turnProgress = progressAfter(turnProgress, action, result.events)
    const batch = journalBatch(result.events, result.state.players, turnNumber.value)
    statistics.value = recordStatistics(statistics.value, result.events, result.state, turnNumber.value)
    turnNumber.value = nextTurnNumber(turnNumber.value, result.events)
    revealBase = journal.value.length
    revealSteps = batch.revealSteps
    journal.value = [...journal.value, ...batch.entries]
    revealJournal(0)
    engineState.value = result.state
    lastEvents.value = result.events
    drawnCard.value = drawnCardOf(result.state, result.events)
    revealedCapitals.value = revealedCapitalsOf(result.events) ?? revealedCapitals.value
    capitalLost.value = capitalLostByHuman(result.state, result.events) ?? capitalLost.value
    handoffTo.value = needsHandoff(before, result.state)
    notifyConversion(result.state, result.events)
    save()
    void present(presentationSteps(result.events))
  }

  const thinkingPlayer = computed(() => aiPlayerOf(engineState.value))

  const input = (gesture: InteractionInput) => {
    if (isPresenting.value || handoffTo.value !== null || thinkingPlayer.value !== null) {
      return
    }
    const step = reduceInteraction(engineState.value, interaction.value, gesture)
    interaction.value = step.interaction
    if (step.action !== undefined) {
      dispatch(step.action)
    }
  }

  save()
  scheduleAiAction()

  return {
    engineState,
    displayedState,
    isPresenting,
    currentStep,
    lastEvents,
    interaction,
    view: computed(() => viewOf(engineState.value, interaction.value)),
    error,
    speed,
    handoffTo,
    drawnCard,
    convertedMission,
    revealedCapitals,
    capitalLost,
    thinkingPlayer,
    aiFocus,
    journal,
    visibleJournal: computed(() => journal.value.slice(0, visibleCount.value)),
    statistics,
    turnNumber,
    storageWarning,
    dispatch,
    input,
    skipAnimation: () => {
      if (isPresenting.value) {
        finishPresentation()
      }
    },
    dismissError: () => {
      error.value = null
    },
    acknowledgeHandoff: () => {
      handoffTo.value = null
    },
    acknowledgeDrawnCard: () => {
      drawnCard.value = null
      scheduleAiAction()
    },
    acknowledgeConvertedMission: () => {
      convertedMission.value = null
    },
    acknowledgeCapitalLost: () => {
      capitalLost.value = null
    },
    acknowledgeRevealedCapitals: () => {
      revealedCapitals.value = null
      scheduleAiAction()
    },
    setSpeed: (next: AnimationSpeed) => {
      speed.value = next
      writeSpeedPreference(next)
    },
    dismissStorageWarning: () => {
      storageWarning.value = false
    },
    dispose: () => {
      disposed = true
      presentationRun += 1
      if (aiTimer !== null) {
        clearTimeout(aiTimer)
        aiTimer = null
      }
    },
  }
}

type ResumeOptions = {
  speed?: AnimationSpeed
  storage?: SaveStorage | null
}

/** Resumes a saved game as it was: no animation is replayed and the whole journal shows; an AI goes on with its turn. */
export function createGameSessionFromSave(saved: SavedGame, options: ResumeOptions = {}): GameSession {
  return createGameSession(saved.engineState, {
    speed: options.speed,
    persistence: { setup: saved.creation, storage: options.storage },
    history: { journal: saved.journal, statistics: saved.statistics, turnNumber: saved.turnNumber },
  })
}

/** How a game screen opens: a new game, or a saved one resumed. */
export type GameStart = { kind: 'new'; state: GameState; setup: GameSetup } | { kind: 'saved'; game: SavedGame }

/** Players and rules a game was created with, to start it again. */
export function setupOf(start: GameStart): GameSetup {
  return start.kind === 'new' ? start.setup : start.game.creation
}

/** A saving session for a new game, or one resumed from its save. */
export function startGameSession(start: GameStart): GameSession {
  return start.kind === 'new'
    ? createGameSession(start.state, { persistence: { setup: start.setup } })
    : createGameSessionFromSave(start.game)
}

const SESSION_KEY: InjectionKey<GameSession> = Symbol('game-session')

/** Makes `session` available to the HUD components below the caller. */
export function provideGameSession(session: GameSession): void {
  provide(SESSION_KEY, session)
}

/** The session provided by the game screen. */
export function useGameSession(): GameSession {
  const session = inject(SESSION_KEY)
  if (session === undefined) {
    throw new Error('useGameSession must be used below the game screen')
  }
  return session
}
