import { fortifyDestinations, type PlayerId, type TerritoryId } from '../../engine'
import type { AiRandom } from '../aiRandom'
import { armiesOn, borderTerritories, interiorTerritories, isBorder, territoriesOwnedBy } from '../evaluation'
import type { PlayerView } from '../playerView'
import { attackOptions, freeTerritories, maxBy, type DecisionContext, type Strategy } from '../strategy'

const MIN_ATTACKING_ARMIES = 4
const REQUIRED_ADVANTAGE = 2
const MAX_CONQUESTS_PER_TURN = 3

function randomBorder({ view, me, random }: DecisionContext): TerritoryId {
  const borders = borderTerritories(view, me)
  return random.pick(borders.length > 0 ? borders : territoriesOwnedBy(view, me)) ?? ''
}

function randomFortification(view: PlayerView, me: PlayerId, random: AiRandom) {
  const origins = interiorTerritories(view, me).filter((id) =>
    fortifyDestinations(view, id).some((destination) => isBorder(view, destination)),
  )
  const from = random.pick(origins)
  if (from === undefined) {
    return null
  }
  const to = random.pick(fortifyDestinations(view, from).filter((destination) => isBorder(view, destination)))
  return to === undefined ? null : { from, to, armies: armiesOn(view, from) - 1 }
}

/** Spreads its armies at random along its borders and attacks only with a clear advantage, without any plan; its capital is its largest army. */
export const easy: Strategy = {
  claim: ({ view, random }) => random.pick(freeTerritories(view)) ?? '',
  place: randomBorder,
  capital: ({ view, me }) => maxBy(territoriesOwnedBy(view, me), (territory) => armiesOn(view, territory)) ?? '',
  trade: () => null,
  deploy: (context, reserve) => ({
    territory: randomBorder(context),
    armies: context.random.int(1, Math.ceil(reserve / 2)),
  }),
  attack: ({ view, me, random, turn }) => {
    if (turn.conquests >= MAX_CONQUESTS_PER_TURN) {
      return null
    }
    const options = attackOptions(view, me).filter((option) => {
      const attackers = armiesOn(view, option.from)
      return attackers >= MIN_ATTACKING_ARMIES && attackers >= REQUIRED_ADVANTAGE * armiesOn(view, option.to)
    })
    return random.pick(options) ?? null
  },
  conquestMove: ({ random }, move) => random.int(move.minArmies, move.maxArmies),
  fortify: ({ view, me, random }) => randomFortification(view, me, random),
}
