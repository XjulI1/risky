import { mapOf, type GameState, type PlayerId, type TerritoryId } from '../engine'

/** Highlight state of a territory, decided by the caller of the board. */
export type Highlight = 'none' | 'selectable' | 'selected' | 'target'

/** Highlights by territory; territories left out are not highlighted. */
export type Highlights = Partial<Record<TerritoryId, Highlight>>

/** What the board needs to draw one territory. */
export type TerritoryView = {
  id: TerritoryId
  owner: PlayerId | null
  color: string
  armies: number
  highlight: Highlight
  dimmed: boolean
}

/** Visual treatment of each highlight: how high the tile rises and how much it glows. */
export type HighlightStyle = {
  lift: number
  emissiveIntensity: number
}

/** Color of a territory nobody has claimed yet. */
export const UNCLAIMED_COLOR = '#d8cbb0'

/** Brightness factor applied to territories dimmed behind a selection. */
export const DIMMED_BRIGHTNESS = 0.45

/** Lift and glow of each highlight state. */
export const HIGHLIGHT_STYLES: Record<Highlight, HighlightStyle> = {
  none: { lift: 0, emissiveIntensity: 0 },
  selectable: { lift: 0.25, emissiveIntensity: 0.12 },
  target: { lift: 0.45, emissiveIntensity: 0.3 },
  selected: { lift: 0.8, emissiveIntensity: 0.5 },
}

/** Color of the player whose capital each revealed capital is, by territory; empty before the reveal. */
export function capitalColors(state: GameState): Partial<Record<TerritoryId, string>> {
  return Object.fromEntries(
    Object.entries(state.capitals ?? {}).flatMap(([playerId, territory]) => {
      const color = state.players.find((player) => player.id === playerId)?.color
      return color === undefined ? [] : [[territory, color]]
    }),
  )
}

/** Turns a game state and the caller's highlights into the display data of every territory of its map. */
export function boardViewModel(state: GameState, highlights: Highlights): Record<TerritoryId, TerritoryView> {
  const colors = new Map(state.players.map((player) => [player.id, player.color]))
  const anySelectable = Object.values(highlights).includes('selectable')

  return Object.fromEntries(
    mapOf(state).territoryIds.map((id) => {
      const territory = state.territories[id]
      const highlight = highlights[id] ?? 'none'
      const view: TerritoryView = {
        id,
        owner: territory?.owner ?? null,
        color: territory === undefined ? UNCLAIMED_COLOR : (colors.get(territory.owner) ?? UNCLAIMED_COLOR),
        armies: territory?.armies ?? 0,
        highlight,
        dimmed: anySelectable && highlight === 'none',
      }
      return [id, view]
    }),
  )
}
