import { describe, expect, it } from 'vitest'
import { createGame, NEUTRAL_PLAYER_ID, type GameState } from '../engine'
import { boardViewModel, capitalColors, HIGHLIGHT_STYLES, UNCLAIMED_COLOR } from './boardViewModel'

function game(playerCount: number, territoryDistribution: 'random' | 'choice' = 'random'): GameState {
  const colors = ['#e53935', '#1e88e5', '#43a047', '#fdd835']
  const result = createGame({
    seed: 3,
    settings: { territoryDistribution },
    players: Array.from({ length: playerCount }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur ${i + 1}`,
      color: colors[i] ?? '#000000',
      kind: 'human' as const,
    })),
  })
  if (!result.ok) throw new Error(result.error.message)
  return result.state
}

describe('boardViewModel', () => {
  it('paints each territory in the color of its owner with its army count', () => {
    const state = game(3)
    state.territories.brazil = { owner: 'p1', armies: 12 }
    const view = boardViewModel(state, {})
    expect(view.brazil).toMatchObject({ color: '#e53935', armies: 12, highlight: 'none', dimmed: false })
  })

  it('paints the territories of the neutral army in grey', () => {
    const state = game(2)
    const neutral = state.players.find((player) => player.id === NEUTRAL_PLAYER_ID)
    const neutralTerritory = Object.keys(state.territories).find(
      (id) => state.territories[id]?.owner === NEUTRAL_PLAYER_ID,
    )
    expect(boardViewModel(state, {})[neutralTerritory ?? '']?.color).toBe(neutral?.color)
    expect(neutral?.color).toBe('#9e9e9e')
  })

  it('shows unclaimed territories with a parchment color and no army', () => {
    const view = boardViewModel(game(3, 'choice'), {})
    expect(view.egypt).toMatchObject({ color: UNCLAIMED_COLOR, armies: 0 })
  })

  it('covers the 42 territories', () => {
    expect(Object.keys(boardViewModel(game(3), {}))).toHaveLength(42)
  })

  it('applies the highlight given for each territory', () => {
    const view = boardViewModel(game(3), { egypt: 'selected', congo: 'target', brazil: 'selectable' })
    expect(view.egypt?.highlight).toBe('selected')
    expect(view.congo?.highlight).toBe('target')
    expect(view.brazil?.highlight).toBe('selectable')
    expect(view.peru?.highlight).toBe('none')
  })

  it('dims the other territories only when some territory is selectable', () => {
    const withSelectable = boardViewModel(game(3), { brazil: 'selectable', egypt: 'selected' })
    expect(withSelectable.peru?.dimmed).toBe(true)
    expect(withSelectable.brazil?.dimmed).toBe(false)
    expect(withSelectable.egypt?.dimmed).toBe(false)

    const withoutSelectable = boardViewModel(game(3), { egypt: 'selected', congo: 'target' })
    expect(withoutSelectable.peru?.dimmed).toBe(false)
  })

  it('gives distinct visual styles to every highlight state', () => {
    const styles = Object.values(HIGHLIGHT_STYLES).map((style) => JSON.stringify(style))
    expect(new Set(styles).size).toBe(styles.length)
  })
})

describe('capitalColors', () => {
  it('shows no capital before the reveal', () => {
    expect(capitalColors(game(3))).toEqual({})
  })

  it("keeps the color of the capital's player on a captured capital", () => {
    const state = game(3)
    state.capitals = { p1: 'egypt', p2: 'brazil', p3: 'peru' }
    state.territories.brazil = { owner: 'p1', armies: 3 }
    expect(capitalColors(state)).toEqual({ egypt: '#e53935', brazil: '#1e88e5', peru: '#43a047' })
    expect(boardViewModel(state, {}).brazil?.color).toBe('#e53935')
  })
})
