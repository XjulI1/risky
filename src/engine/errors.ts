import { ruleError } from './state'
import type { RuleError } from './types'

export const wrongPhase = (): RuleError =>
  ruleError('WRONG_PHASE', "Cette action n'est pas possible dans la phase en cours.")

export const unknownTerritory = (): RuleError => ruleError('UNKNOWN_TERRITORY', "Ce territoire n'existe pas.")

export const unknownMap = (mapId: string): RuleError => ruleError('UNKNOWN_MAP', `Carte inconnue : ${mapId}`)

export const notOwner = (): RuleError => ruleError('NOT_OWNER', 'Ce territoire ne vous appartient pas.')

export const invalidArmyCount = (): RuleError =>
  ruleError('INVALID_ARMY_COUNT', "Ce nombre d'armées n'est pas autorisé.")

export const tradeRequired = (): RuleError =>
  ruleError('TRADE_REQUIRED', "Vous devez d'abord échanger une série de cartes.")
