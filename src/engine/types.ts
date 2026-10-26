export type PlayerId = string
export type TerritoryId = string
export type ContinentId = string

export type Territory = {
  id: TerritoryId
  name: string
  continent: ContinentId
  neighbors: TerritoryId[]
}

export type Continent = {
  id: ContinentId
  name: string
  /** The name preceded by its article, as written inside a sentence (« l'Amérique du Nord »). */
  nameWithArticle: string
  bonus: number
  territories: TerritoryId[]
}

/** Identifier of a map of the catalog. */
export type MapId = 'classic' | 'france'

/** The word a map uses for its continents in texts, with its grammatical gender. */
export type ContinentTerm = {
  singular: string
  feminine: boolean
}

export type GameMap = {
  id: MapId
  territoryIds: TerritoryId[]
  continentIds: ContinentId[]
  territories: Record<TerritoryId, Territory>
  continents: Record<ContinentId, Continent>
  continentTerm: ContinentTerm
  /** The missions of the deck that ask for continents of this map, in the order of its rules. */
  continentMissions: Mission[]
}

export type AiLevel = 'easy' | 'normal' | 'hard' | 'expert'

/** The levels played by heuristics alone, without simulation. */
export type HeuristicLevel = Exclude<AiLevel, 'expert'>

export type PlayerControl = { kind: 'human' } | { kind: 'ai'; level: AiLevel }

export type PlayerKind = PlayerControl['kind']

export type PlayerConfig = {
  id: PlayerId
  name: string
  color: string
} & PlayerControl

export type Player = PlayerConfig & {
  isNeutral: boolean
  eliminated: boolean
}

export type TerritoryDistribution = 'random' | 'choice'
export type ArmyPlacement = 'random' | 'manual'
export type CardTradeScale = 'progressive' | 'fixed'
export type FortifyMode = 'connected' | 'adjacent'

export type GameSettings = {
  territoryDistribution: TerritoryDistribution
  armyPlacement: ArmyPlacement
  cardTradeScale: CardTradeScale
  attackerMaxDice: number
  defenderMaxDice: number
  fortifyMode: FortifyMode
  secretMissions: boolean
  capitals: boolean
}

export type Mission =
  | { kind: 'continents'; required: ContinentId[]; extraContinents: number }
  | { kind: 'territories'; count: number; minArmies: number }
  | { kind: 'eliminate'; target: PlayerId }

export type WinReason = 'domination' | 'mission' | 'capitals'

export type CardSymbol = 'infantry' | 'cavalry' | 'artillery'

export type TerritoryCard = {
  id: number
  symbol: CardSymbol
  territory: TerritoryId
}

export type JokerCard = {
  id: number
  symbol: 'joker'
  territory: null
}

export type Card = TerritoryCard | JokerCard

export type TerritoryState = {
  owner: PlayerId
  armies: number
}

export type Phase =
  | { kind: 'claim'; remaining: Record<PlayerId, number> }
  | { kind: 'placement'; remaining: Record<PlayerId, number> }
  | { kind: 'capitalChoice'; pending: Record<PlayerId, TerritoryId> }
  | { kind: 'reinforce'; reserve: number }
  | { kind: 'attack' }
  | { kind: 'conquestMove'; from: TerritoryId; to: TerritoryId; minArmies: number; maxArmies: number }
  | { kind: 'eliminationTrade'; reserve: number }
  | { kind: 'fortify' }
  | { kind: 'gameOver' }

export type PhaseKind = Phase['kind']

export type GameState = {
  settings: GameSettings
  mapId: MapId
  players: Player[]
  territories: Record<TerritoryId, TerritoryState>
  firstPlayerIndex: number
  currentPlayerIndex: number
  phase: Phase
  deck: Card[]
  discard: Card[]
  hands: Record<PlayerId, Card[]>
  tradeCount: number
  conqueredThisTurn: boolean
  rngState: number
  winner: PlayerId | null
  winReason: WinReason | null
  missions: Record<PlayerId, Mission> | null
  capitals: Record<PlayerId, TerritoryId> | null
}

/** The part of the game state every player can see: no deck, discard, hands, missions or generator state; capitals are only set once revealed. */
export type PublicState = Pick<
  GameState,
  | 'settings'
  | 'mapId'
  | 'players'
  | 'territories'
  | 'firstPlayerIndex'
  | 'currentPlayerIndex'
  | 'phase'
  | 'tradeCount'
  | 'conqueredThisTurn'
  | 'winner'
  | 'winReason'
  | 'capitals'
>

export type Action =
  | { type: 'claimTerritory'; playerId: PlayerId; territory: TerritoryId }
  | { type: 'placeInitialArmy'; playerId: PlayerId; territory: TerritoryId }
  | { type: 'chooseCapital'; playerId: PlayerId; territory: TerritoryId }
  | { type: 'tradeCards'; playerId: PlayerId; cardIds: [number, number, number] }
  | { type: 'deploy'; playerId: PlayerId; territory: TerritoryId; armies: number }
  | { type: 'attack'; playerId: PlayerId; from: TerritoryId; to: TerritoryId }
  | { type: 'moveAfterConquest'; playerId: PlayerId; armies: number }
  | { type: 'endAttack'; playerId: PlayerId }
  | { type: 'fortify'; playerId: PlayerId; from: TerritoryId; to: TerritoryId; armies: number }
  | { type: 'skipFortify'; playerId: PlayerId }

export type ActionType = Action['type']

export type GameEvent =
  | { type: 'territoryClaimed'; playerId: PlayerId; territory: TerritoryId }
  | { type: 'initialArmyPlaced'; playerId: PlayerId; territory: TerritoryId }
  | { type: 'capitalChosen'; playerId: PlayerId }
  | { type: 'capitalsRevealed'; capitals: Record<PlayerId, TerritoryId> }
  | { type: 'turnStarted'; playerId: PlayerId; reserve: number }
  | {
      type: 'cardsTraded'
      playerId: PlayerId
      cardIds: number[]
      armies: number
      bonusTerritory: TerritoryId | null
    }
  | { type: 'armiesDeployed'; playerId: PlayerId; territory: TerritoryId; armies: number }
  | {
      type: 'diceRolled'
      attacker: PlayerId
      defender: PlayerId
      from: TerritoryId
      to: TerritoryId
      attackerDice: number[]
      defenderDice: number[]
      defenderBonus: number
      attackerLosses: number
      defenderLosses: number
    }
  | {
      type: 'territoryConquered'
      playerId: PlayerId
      previousOwner: PlayerId
      from: TerritoryId
      to: TerritoryId
    }
  | { type: 'capitalCaptured'; by: PlayerId; from: PlayerId; territory: TerritoryId }
  | { type: 'conquestMoved'; playerId: PlayerId; from: TerritoryId; to: TerritoryId; armies: number }
  | { type: 'fortified'; playerId: PlayerId; from: TerritoryId; to: TerritoryId; armies: number }
  | { type: 'cardDrawn'; playerId: PlayerId; cardId: number }
  | { type: 'playerEliminated'; playerId: PlayerId; by: PlayerId; cardsTaken: number }
  | { type: 'missionConverted'; playerId: PlayerId }
  | { type: 'missionAccomplished'; playerId: PlayerId; mission: Mission }
  | { type: 'gameWon'; playerId: PlayerId }

export type RuleErrorCode =
  | 'INVALID_PLAYER_COUNT'
  | 'INVALID_PLAYER'
  | 'DUPLICATE_PLAYER'
  | 'INVALID_SETTING'
  | 'GAME_OVER'
  | 'NOT_YOUR_TURN'
  | 'WRONG_PHASE'
  | 'UNKNOWN_TERRITORY'
  | 'TERRITORY_TAKEN'
  | 'NOT_OWNER'
  | 'OWN_TERRITORY'
  | 'NOT_ADJACENT'
  | 'NOT_CONNECTED'
  | 'NOT_ENOUGH_ARMIES'
  | 'INVALID_ARMY_COUNT'
  | 'CARD_NOT_IN_HAND'
  | 'INVALID_CARD_SET'
  | 'TRADE_REQUIRED'
  | 'UNKNOWN_MAP'

export type RuleError = {
  code: RuleErrorCode
  message: string
}

export type ActionResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: RuleError }

export type GameConfig = {
  players: PlayerConfig[]
  seed: number
  settings?: Partial<GameSettings>
  /** The map of the game, the classic map when absent. */
  mapId?: MapId
}

export type CreateGameResult =
  | { ok: true; state: GameState }
  | { ok: false; error: RuleError }
