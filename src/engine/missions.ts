import { classicMap } from './maps/classic'
import { mapOf, playerById } from './state'
import type { ContinentId, Mission, Player, PlayerId, PublicState } from './types'

/** The mission given instead of an elimination that can no longer be carried out. */
export const CONQUER_24_TERRITORIES: Mission = { kind: 'territories', count: 24, minArmies: 1 }

/** The 8 missions of the deck that do not depend on the players, in the order of the rules. */
export const GENERAL_MISSIONS: readonly Mission[] = [
  { kind: 'continents', required: ['northAmerica', 'africa'], extraContinents: 0 },
  { kind: 'continents', required: ['northAmerica', 'australia'], extraContinents: 0 },
  { kind: 'continents', required: ['asia', 'southAmerica'], extraContinents: 0 },
  { kind: 'continents', required: ['asia', 'africa'], extraContinents: 0 },
  { kind: 'continents', required: ['europe', 'southAmerica'], extraContinents: 1 },
  { kind: 'continents', required: ['europe', 'australia'], extraContinents: 1 },
  CONQUER_24_TERRITORIES,
  { kind: 'territories', count: 18, minArmies: 2 },
]

/** Territories of a required continent held by the player. */
export type ContinentProgress = {
  continent: ContinentId
  held: number
  total: number
}

/** How far a player is from accomplishing its mission. */
export type MissionProgress =
  | {
      kind: 'continents'
      required: ContinentProgress[]
      extraContinents: number
      extraHeld: number
      accomplished: boolean
    }
  | { kind: 'territories'; count: number; minArmies: number; owned: number; qualifying: number; accomplished: boolean }
  | { kind: 'eliminate'; target: PlayerId; remaining: number; accomplished: boolean }

/** The general missions followed by one elimination mission per player, before shuffling. */
export function missionDeck(playerIds: readonly PlayerId[]): Mission[] {
  return [...GENERAL_MISSIONS, ...playerIds.map((target): Mission => ({ kind: 'eliminate', target }))]
}

function listed(items: string[]): string {
  const last = items.at(-1) ?? ''
  return items.length < 2 ? last : `${items.slice(0, -1).join(', ')} et ${last}`
}

function continentLabel(continent: ContinentId): string {
  return `l'${classicMap.continents[continent]?.name ?? continent}`
}

/** French wording of a mission, as shown to its holder, in the journal and on the end screen. */
export function missionText(mission: Mission, players: readonly Pick<Player, 'id' | 'name'>[]): string {
  switch (mission.kind) {
    case 'continents': {
      const continents = mission.required.map(continentLabel)
      const extras = Array.from({ length: mission.extraContinents }, () => 'un troisième continent au choix')
      return `Conquérir ${listed([...continents, ...extras])}`
    }
    case 'territories':
      return mission.minArmies > 1
        ? `Occuper ${mission.count} territoires avec au moins ${mission.minArmies} armées sur chacun`
        : `Conquérir ${mission.count} territoires`
    case 'eliminate':
      return `Éliminer ${players.find((player) => player.id === mission.target)?.name ?? mission.target}`
  }
}

function continentProgress(state: PublicState, playerId: PlayerId, continent: ContinentId): ContinentProgress {
  const territories = mapOf(state).continents[continent]?.territories ?? []
  return {
    continent,
    held: territories.filter((id) => state.territories[id]?.owner === playerId).length,
    total: territories.length,
  }
}

const isComplete = (progress: ContinentProgress) => progress.total > 0 && progress.held === progress.total

/** Progress of `playerId` toward `mission` in `state`; `accomplished` tells whether the mission is fulfilled. */
export function missionProgress(mission: Mission, state: PublicState, playerId: PlayerId): MissionProgress {
  switch (mission.kind) {
    case 'continents': {
      const required = mission.required.map((continent) => continentProgress(state, playerId, continent))
      const extraHeld = mapOf(state)
        .continentIds.filter((continent) => !mission.required.includes(continent))
        .filter((continent) => isComplete(continentProgress(state, playerId, continent))).length
      return {
        kind: 'continents',
        required,
        extraContinents: mission.extraContinents,
        extraHeld,
        accomplished: required.every(isComplete) && extraHeld >= mission.extraContinents,
      }
    }
    case 'territories': {
      const owned = Object.values(state.territories).filter((territory) => territory.owner === playerId)
      const qualifying = owned.filter((territory) => territory.armies >= mission.minArmies).length
      return {
        kind: 'territories',
        count: mission.count,
        minArmies: mission.minArmies,
        owned: owned.length,
        qualifying,
        accomplished: qualifying >= mission.count,
      }
    }
    case 'eliminate': {
      const remaining = Object.values(state.territories).filter((territory) => territory.owner === mission.target).length
      return {
        kind: 'eliminate',
        target: mission.target,
        remaining,
        accomplished: playerById(state, mission.target)?.eliminated === true,
      }
    }
  }
}
