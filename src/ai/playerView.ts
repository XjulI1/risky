import {
  classicMap,
  type Card,
  type GameState,
  type Mission,
  type PlayerId,
  type PublicState,
  type TerritoryId,
  type TerritoryState,
} from '../engine'

/** Everything a player may know: the public state, its own hand and mission, and the size of every hand. */
export type PlayerView = PublicState & {
  viewer: PlayerId
  hand: Card[]
  handSizes: Record<PlayerId, number>
  ownMission: Mission | null
}

function territoriesInMapOrder(state: GameState): Record<TerritoryId, TerritoryState> {
  return Object.fromEntries(
    classicMap.territoryIds.flatMap((id) => {
      const territory = state.territories[id]
      return territory === undefined ? [] : [[id, territory]]
    }),
  )
}

/** Projects `state` on what `viewer` is allowed to see; two states differing only by hidden information give the same view. */
export function playerView(state: GameState, viewer: PlayerId): PlayerView {
  return {
    settings: state.settings,
    mapId: state.mapId,
    players: state.players,
    territories: territoriesInMapOrder(state),
    firstPlayerIndex: state.firstPlayerIndex,
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    tradeCount: state.tradeCount,
    conqueredThisTurn: state.conqueredThisTurn,
    winner: state.winner,
    winReason: state.winReason,
    viewer,
    hand: state.hands[viewer] ?? [],
    handSizes: Object.fromEntries(state.players.map((player) => [player.id, state.hands[player.id]?.length ?? 0])),
    ownMission: state.missions?.[viewer] ?? null,
  }
}
