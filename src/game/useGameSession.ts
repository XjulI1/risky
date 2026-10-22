import { computed, inject, provide, ref, shallowRef, type ComputedRef, type InjectionKey, type Ref, type ShallowRef } from 'vue'
import { applyAction, type Action, type Card, type GameEvent, type GameState, type Player } from '../engine'
import { ANIMATION_DURATIONS, readSpeedPreference, writeSpeedPreference, type AnimationSpeed } from './animationSpeed'
import { IDLE, reduceInteraction, viewOf, type Interaction, type InteractionInput, type InteractionView } from './interaction'
import { presentationSteps, projectStep, stepDuration, type PresentationStep } from './presentation'

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
  dispatch: (action: Action) => void
  input: (input: InteractionInput) => void
  skipAnimation: () => void
  dismissError: () => void
  acknowledgeHandoff: () => void
  acknowledgeDrawnCard: () => void
  setSpeed: (speed: AnimationSpeed) => void
}

type SessionOptions = {
  speed?: AnimationSpeed
}

const SETUP_PHASES = new Set(['claim', 'placement'])

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function currentPlayerOf(state: GameState): Player | undefined {
  return state.players[state.currentPlayerIndex]
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
  let presentationRun = 0

  const finishPresentation = () => {
    presentationRun += 1
    currentStep.value = null
    isPresenting.value = false
    displayedState.value = engineState.value
  }

  const present = async (steps: PresentationStep[]) => {
    const run = ++presentationRun
    const durations = ANIMATION_DURATIONS[speed.value]
    let projected = displayedState.value
    isPresenting.value = steps.length > 0 && speed.value !== 'instant'
    if (isPresenting.value) {
      for (const step of steps) {
        currentStep.value = step
        await wait(stepDuration(step, durations))
        if (run !== presentationRun) {
          return
        }
        projected = projectStep(projected, step)
        displayedState.value = projected
      }
    } else {
      projected = steps.reduce(projectStep, projected)
    }
    warnOnDivergence(projected, engineState.value)
    finishPresentation()
  }

  const dispatch = (action: Action) => {
    const before = engineState.value
    const result = applyAction(before, action)
    if (!result.ok) {
      error.value = result.error.message
      return
    }
    error.value = null
    engineState.value = result.state
    lastEvents.value = result.events
    drawnCard.value = drawnCardOf(result.state, result.events)
    handoffTo.value = needsHandoff(before, result.state)
    void present(presentationSteps(result.events))
  }

  const input = (gesture: InteractionInput) => {
    if (isPresenting.value || handoffTo.value !== null) {
      return
    }
    const step = reduceInteraction(engineState.value, interaction.value, gesture)
    interaction.value = step.interaction
    if (step.action !== undefined) {
      dispatch(step.action)
    }
  }

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
    },
    setSpeed: (next: AnimationSpeed) => {
      speed.value = next
      writeSpeedPreference(next)
    },
  }
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
