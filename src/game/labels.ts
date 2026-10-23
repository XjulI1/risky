import type { PhaseKind } from '../engine'

/** French name of each phase. */
export const PHASE_LABELS: Record<PhaseKind, string> = {
  claim: 'Revendication',
  placement: 'Placement',
  reinforce: 'Renforts',
  attack: 'Attaque',
  conquestMove: 'Déplacement après conquête',
  eliminationTrade: 'Échange obligatoire',
  fortify: 'Fortification',
  gameOver: 'Fin de partie',
}

/** « 1 armée », « 7 armées ». */
export function armiesLabel(count: number): string {
  return `${count} ${count > 1 ? 'armées' : 'armée'}`
}
