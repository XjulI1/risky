import { mapOf, missionProgress, missionText, type GameState, type Mission, type Player } from '../engine'

/** A mission revealed on the end screen. */
export type RevealedMission = {
  player: Player
  text: string
}

/** What a player sees of its own mission: its wording and one line per measure of progress. */
export type MissionSummary = {
  holder: Player
  text: string
  progress: string[]
}

function isHuman(player: Player): boolean {
  return player.kind === 'human' && !player.isNeutral
}

/**
 * The player whose mission may be shown on screen: the current player when human, else the only
 * human of the game; nobody when several humans share the device or the game has no missions.
 */
export function missionHolder(state: GameState): Player | null {
  if (state.missions === null || state.phase.kind === 'gameOver') {
    return null
  }
  const current = state.players[state.currentPlayerIndex]
  if (current !== undefined && isHuman(current)) {
    return current
  }
  const humans = state.players.filter(isHuman)
  return humans.length === 1 ? (humans[0] ?? null) : null
}

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function progressLines(mission: Mission, state: GameState, holder: Player): string[] {
  const map = mapOf(state)
  const progress = missionProgress(mission, state, holder.id)
  switch (progress.kind) {
    case 'continents':
      return [
        ...progress.required.map(
          ({ continent, held, total }) => `${map.continents[continent]?.name ?? continent} ${held}/${total}`,
        ),
        ...(progress.extraContinents > 0 ? [`${capitalized(map.continentTerm.singular)} au choix ${progress.extraHeld}/${progress.extraContinents}`] : []),
      ]
    case 'territories':
      return progress.minArmies > 1
        ? [`Territoires ${progress.owned}`, `À ${progress.minArmies} armées ou plus ${progress.qualifying}/${progress.count}`]
        : [`Territoires ${progress.owned}/${progress.count}`]
    case 'eliminate': {
      const target = state.players.find((player) => player.id === progress.target)?.name ?? progress.target
      return [`Territoires de ${target} ${progress.remaining}`]
    }
  }
}

/** The mission the screen may show, with its progress, or `null` when none may be shown. */
export function missionSummary(state: GameState): MissionSummary | null {
  const holder = missionHolder(state)
  const mission = holder === null ? undefined : state.missions?.[holder.id]
  if (holder === null || mission === undefined) {
    return null
  }
  return { holder, text: missionText(mission, state.players, mapOf(state)), progress: progressLines(mission, state, holder) }
}

/** How the winner won, completing « <winner> remporte la partie », or `null` in a game without missions nor capitals. */
export function winReasonText(state: GameState): string | null {
  if (state.missions === null && state.capitals === null) {
    return null
  }
  const mission = state.winner === null ? undefined : state.missions?.[state.winner]
  if (state.winReason === 'mission' && mission !== undefined) {
    return `en accomplissant sa mission : ${missionText(mission, state.players, mapOf(state))}`
  }
  return state.winReason === 'capitals' ? 'en contrôlant toutes les capitales' : 'en éliminant tous ses adversaires'
}

/** The mission of every player, in the order of play, for the end screen. */
export function revealedMissions(state: GameState): RevealedMission[] {
  return state.players.flatMap((player) => {
    const mission = state.missions?.[player.id]
    return mission === undefined ? [] : [{ player, text: missionText(mission, state.players, mapOf(state)) }]
  })
}
