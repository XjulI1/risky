import {
  attackOrigins,
  attackTargets,
  classicMap,
  fortifyDestinations,
  mustTrade,
  type Action,
  type GameState,
  type PlayerId,
  type TerritoryId,
} from '../engine'
import type { Highlights } from '../board/boardViewModel'

/** What the current player has started to do on the board. */
export type Interaction =
  | { kind: 'idle' }
  | { kind: 'deployAmount'; territory: TerritoryId }
  | { kind: 'attackFrom'; from: TerritoryId }
  | { kind: 'attackPanel'; from: TerritoryId; to: TerritoryId }
  | { kind: 'fortifyFrom'; from: TerritoryId }
  | { kind: 'fortifyAmount'; from: TerritoryId; to: TerritoryId }

/** A player gesture on the board or in the HUD. */
export type InteractionInput =
  | { kind: 'territory'; territory: TerritoryId }
  | { kind: 'ocean' }
  | { kind: 'confirm'; amount?: number }
  | { kind: 'cancel' }
  | { kind: 'endAttack' }
  | { kind: 'skipFortify' }

/** Panel the HUD shows for the current step. */
export type InteractionPanel =
  | { kind: 'none' }
  | { kind: 'tradeRequired' }
  | { kind: 'amount'; purpose: 'deploy' | 'conquest' | 'fortify'; min: number; max: number; initial: number }
  | { kind: 'attackConfirm'; from: TerritoryId; to: TerritoryId; fromArmies: number; toArmies: number; label: string }

/** Everything the board and the HUD need to show the current step. */
export type InteractionView = {
  interaction: Interaction
  highlights: Highlights
  panel: InteractionPanel
  buttons: { endAttack: boolean; skipFortify: boolean }
  armiesToPlace: number | null
}

/** No ongoing selection. */
export const IDLE: Interaction = { kind: 'idle' }

type Step = { interaction: Interaction; action?: Action }

const NO_PANEL: InteractionPanel = { kind: 'none' }

function currentPlayerId(state: GameState): PlayerId {
  return state.players[state.currentPlayerIndex]?.id ?? ''
}

function owns(state: GameState, territory: TerritoryId): boolean {
  return state.territories[territory]?.owner === currentPlayerId(state)
}

function armiesOn(state: GameState, territory: TerritoryId): number {
  return state.territories[territory]?.armies ?? 0
}

function ownTerritories(state: GameState): TerritoryId[] {
  return classicMap.territoryIds.filter((id) => owns(state, id))
}

function isDeploying(state: GameState): boolean {
  return state.phase.kind === 'reinforce' || state.phase.kind === 'eliminationTrade'
}

function fortifyOrigins(state: GameState): TerritoryId[] {
  return ownTerritories(state).filter((id) => fortifyDestinations(state, id).length > 0)
}

function clampAmount(amount: number | undefined, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(amount ?? max)))
}

function territoryName(territory: TerritoryId): string {
  return classicMap.territories[territory]?.name ?? territory
}

/** Drops a selection that no longer fits the state (phase over, origin exhausted, territory lost). */
function normalize(state: GameState, interaction: Interaction): Interaction {
  switch (interaction.kind) {
    case 'idle':
      return interaction
    case 'deployAmount':
      return isDeploying(state) && !mustTrade(state, currentPlayerId(state)) && owns(state, interaction.territory)
        ? interaction
        : IDLE
    case 'attackFrom':
      return state.phase.kind === 'attack' && attackOrigins(state, currentPlayerId(state)).includes(interaction.from)
        ? interaction
        : IDLE
    case 'attackPanel':
      return state.phase.kind === 'attack' && attackTargets(state, interaction.from).includes(interaction.to)
        ? interaction
        : IDLE
    case 'fortifyFrom':
      return state.phase.kind === 'fortify' && fortifyOrigins(state).includes(interaction.from) ? interaction : IDLE
    case 'fortifyAmount':
      return state.phase.kind === 'fortify' && fortifyDestinations(state, interaction.from).includes(interaction.to)
        ? interaction
        : IDLE
  }
}

function reduceDeployment(state: GameState, interaction: Interaction, input: InteractionInput): Step {
  const playerId = currentPlayerId(state)
  if (mustTrade(state, playerId)) {
    return { interaction: IDLE }
  }
  if (input.kind === 'territory') {
    return owns(state, input.territory) ? { interaction: { kind: 'deployAmount', territory: input.territory } } : { interaction }
  }
  if (input.kind === 'confirm' && interaction.kind === 'deployAmount') {
    const reserve = state.phase.kind === 'reinforce' || state.phase.kind === 'eliminationTrade' ? state.phase.reserve : 0
    return {
      interaction: IDLE,
      action: { type: 'deploy', playerId, territory: interaction.territory, armies: clampAmount(input.amount, 1, reserve) },
    }
  }
  return input.kind === 'ocean' || input.kind === 'cancel' ? { interaction: IDLE } : { interaction }
}

function reduceAttack(state: GameState, interaction: Interaction, input: InteractionInput): Step {
  const playerId = currentPlayerId(state)
  if (input.kind === 'endAttack') {
    return { interaction: IDLE, action: { type: 'endAttack', playerId } }
  }
  if (input.kind === 'ocean' || input.kind === 'cancel') {
    return { interaction: interaction.kind === 'attackPanel' ? { kind: 'attackFrom', from: interaction.from } : IDLE }
  }
  if (input.kind === 'confirm' && interaction.kind === 'attackPanel') {
    return { interaction: IDLE, action: { type: 'attack', playerId, from: interaction.from, to: interaction.to } }
  }
  if (input.kind !== 'territory') {
    return { interaction }
  }
  const origins = attackOrigins(state, playerId)
  if (interaction.kind === 'attackFrom' || interaction.kind === 'attackPanel') {
    if (input.territory === interaction.from) {
      return { interaction: IDLE }
    }
    if (attackTargets(state, interaction.from).includes(input.territory)) {
      return { interaction: { kind: 'attackPanel', from: interaction.from, to: input.territory } }
    }
  }
  return origins.includes(input.territory) ? { interaction: { kind: 'attackFrom', from: input.territory } } : { interaction }
}

function reduceFortification(state: GameState, interaction: Interaction, input: InteractionInput): Step {
  const playerId = currentPlayerId(state)
  if (input.kind === 'skipFortify') {
    return { interaction: IDLE, action: { type: 'skipFortify', playerId } }
  }
  if (input.kind === 'ocean' || input.kind === 'cancel') {
    return { interaction: IDLE }
  }
  if (input.kind === 'confirm' && interaction.kind === 'fortifyAmount') {
    const max = armiesOn(state, interaction.from) - 1
    return {
      interaction: IDLE,
      action: { type: 'fortify', playerId, from: interaction.from, to: interaction.to, armies: clampAmount(input.amount, 1, max) },
    }
  }
  if (input.kind !== 'territory') {
    return { interaction }
  }
  if (interaction.kind === 'fortifyFrom' || interaction.kind === 'fortifyAmount') {
    if (fortifyDestinations(state, interaction.from).includes(input.territory)) {
      return { interaction: { kind: 'fortifyAmount', from: interaction.from, to: input.territory } }
    }
    if (input.territory === interaction.from) {
      return { interaction: IDLE }
    }
  }
  return fortifyOrigins(state).includes(input.territory)
    ? { interaction: { kind: 'fortifyFrom', from: input.territory } }
    : { interaction }
}

/** Applies a player gesture to the ongoing selection; returns the next selection and the engine action it triggers. */
export function reduceInteraction(state: GameState, current: Interaction, input: InteractionInput): Step {
  const interaction = normalize(state, current)
  const playerId = currentPlayerId(state)
  switch (state.phase.kind) {
    case 'claim':
      return input.kind === 'territory' && state.territories[input.territory] === undefined
        ? { interaction: IDLE, action: { type: 'claimTerritory', playerId, territory: input.territory } }
        : { interaction: IDLE }
    case 'placement':
      return input.kind === 'territory' && owns(state, input.territory)
        ? { interaction: IDLE, action: { type: 'placeInitialArmy', playerId, territory: input.territory } }
        : { interaction: IDLE }
    case 'reinforce':
    case 'eliminationTrade':
      return reduceDeployment(state, interaction, input)
    case 'attack':
      return reduceAttack(state, interaction, input)
    case 'conquestMove':
      return input.kind === 'confirm'
        ? {
            interaction: IDLE,
            action: {
              type: 'moveAfterConquest',
              playerId,
              armies: clampAmount(input.amount, state.phase.minArmies, state.phase.maxArmies),
            },
          }
        : { interaction: IDLE }
    case 'fortify':
      return reduceFortification(state, interaction, input)
    case 'gameOver':
      return { interaction: IDLE }
  }
}

function mark(ids: TerritoryId[], highlight: 'selectable' | 'target'): Highlights {
  return Object.fromEntries(ids.map((id) => [id, highlight]))
}

function deploymentView(state: GameState, interaction: Interaction): Pick<InteractionView, 'highlights' | 'panel'> {
  if (mustTrade(state, currentPlayerId(state))) {
    return { highlights: {}, panel: { kind: 'tradeRequired' } }
  }
  const highlights = mark(ownTerritories(state), 'selectable')
  if (interaction.kind !== 'deployAmount') {
    return { highlights, panel: NO_PANEL }
  }
  const reserve = state.phase.kind === 'reinforce' || state.phase.kind === 'eliminationTrade' ? state.phase.reserve : 0
  return {
    highlights: { ...highlights, [interaction.territory]: 'selected' },
    panel: { kind: 'amount', purpose: 'deploy', min: 1, max: reserve, initial: 1 },
  }
}

function attackView(state: GameState, interaction: Interaction): Pick<InteractionView, 'highlights' | 'panel'> {
  if (interaction.kind !== 'attackFrom' && interaction.kind !== 'attackPanel') {
    return { highlights: mark(attackOrigins(state, currentPlayerId(state)), 'selectable'), panel: NO_PANEL }
  }
  const highlights: Highlights = { ...mark(attackTargets(state, interaction.from), 'target'), [interaction.from]: 'selected' }
  if (interaction.kind === 'attackFrom') {
    return { highlights, panel: NO_PANEL }
  }
  const fromArmies = armiesOn(state, interaction.from)
  const toArmies = armiesOn(state, interaction.to)
  return {
    highlights,
    panel: {
      kind: 'attackConfirm',
      from: interaction.from,
      to: interaction.to,
      fromArmies,
      toArmies,
      label: `Attaquer ${territoryName(interaction.to)} (${toArmies}) depuis ${territoryName(interaction.from)} (${fromArmies})`,
    },
  }
}

function fortificationView(state: GameState, interaction: Interaction): Pick<InteractionView, 'highlights' | 'panel'> {
  if (interaction.kind !== 'fortifyFrom' && interaction.kind !== 'fortifyAmount') {
    return { highlights: mark(fortifyOrigins(state), 'selectable'), panel: NO_PANEL }
  }
  const highlights: Highlights = {
    ...mark(fortifyDestinations(state, interaction.from), 'target'),
    [interaction.from]: 'selected',
  }
  if (interaction.kind === 'fortifyFrom') {
    return { highlights, panel: NO_PANEL }
  }
  const max = armiesOn(state, interaction.from) - 1
  return { highlights, panel: { kind: 'amount', purpose: 'fortify', min: 1, max, initial: max } }
}

/** What the board highlights and which panel and buttons the HUD shows for the current step. */
export function viewOf(state: GameState, current: Interaction): InteractionView {
  const interaction = normalize(state, current)
  const buttons = { endAttack: state.phase.kind === 'attack', skipFortify: state.phase.kind === 'fortify' }
  const base = { interaction, buttons, armiesToPlace: null }
  const phase = state.phase
  switch (phase.kind) {
    case 'claim':
      return {
        ...base,
        highlights: mark(classicMap.territoryIds.filter((id) => state.territories[id] === undefined), 'selectable'),
        panel: NO_PANEL,
        armiesToPlace: phase.remaining[currentPlayerId(state)] ?? 0,
      }
    case 'placement':
      return {
        ...base,
        highlights: mark(ownTerritories(state), 'selectable'),
        panel: NO_PANEL,
        armiesToPlace: phase.remaining[currentPlayerId(state)] ?? 0,
      }
    case 'reinforce':
    case 'eliminationTrade':
      return { ...base, ...deploymentView(state, interaction) }
    case 'attack':
      return { ...base, ...attackView(state, interaction) }
    case 'conquestMove':
      return {
        ...base,
        highlights: { [phase.from]: 'selected', [phase.to]: 'target' },
        panel: { kind: 'amount', purpose: 'conquest', min: phase.minArmies, max: phase.maxArmies, initial: phase.maxArmies },
      }
    case 'fortify':
      return { ...base, ...fortificationView(state, interaction) }
    case 'gameOver':
      return { ...base, highlights: {}, panel: NO_PANEL }
  }
}
