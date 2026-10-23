/** Speed at which rolls, conquests and army moves are animated. */
export type AnimationSpeed = 'normal' | 'fast' | 'instant'

/** Duration, in milliseconds, of each kind of animation step. */
export type AnimationDurations = {
  firstRoll: number
  nextRoll: number
  conquest: number
  armyMove: number
  aiAction: number
}

type SpeedStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

/** Available speeds, slowest first. */
export const ANIMATION_SPEEDS: AnimationSpeed[] = ['normal', 'fast', 'instant']

/** French labels of the speeds. */
export const SPEED_LABELS: Record<AnimationSpeed, string> = {
  normal: 'Normale',
  fast: 'Rapide',
  instant: 'Instantanée',
}

/** Durations of every animation step for each speed. */
export const ANIMATION_DURATIONS: Record<AnimationSpeed, AnimationDurations> = {
  normal: { firstRoll: 1100, nextRoll: 550, conquest: 450, armyMove: 600, aiAction: 700 },
  fast: { firstRoll: 600, nextRoll: 250, conquest: 250, armyMove: 300, aiAction: 300 },
  instant: { firstRoll: 0, nextRoll: 0, conquest: 0, armyMove: 0, aiAction: 0 },
}

/** Key under which the chosen speed is remembered on the device. */
export const SPEED_STORAGE_KEY = 'risky.animationSpeed'

const DEFAULT_SPEED: AnimationSpeed = 'normal'

function isSpeed(value: string | null): value is AnimationSpeed {
  return ANIMATION_SPEEDS.some((speed) => speed === value)
}

/** The browser storage, or `null` when the browser refuses access to it. */
export function browserStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Whether the system asks for reduced motion. */
export function systemPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Remembered speed, else instant under reduced motion, else normal; never throws. */
export function readSpeedPreference(
  storage: Pick<SpeedStorage, 'getItem'> | null = browserStorage(),
  prefersReducedMotion = systemPrefersReducedMotion(),
): AnimationSpeed {
  const stored = storedValue(storage)
  if (isSpeed(stored)) {
    return stored
  }
  return prefersReducedMotion ? 'instant' : DEFAULT_SPEED
}

function storedValue(storage: Pick<SpeedStorage, 'getItem'> | null): string | null {
  try {
    return storage?.getItem(SPEED_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

/** Remembers the chosen speed on the device, silently ignoring a storage that refuses it. */
export function writeSpeedPreference(
  speed: AnimationSpeed,
  storage: Pick<SpeedStorage, 'setItem'> | null = browserStorage(),
): void {
  try {
    storage?.setItem(SPEED_STORAGE_KEY, speed)
  } catch {
    return
  }
}
