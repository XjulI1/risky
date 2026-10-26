import type { GameMap, MapId } from '../types'
import { classicMap } from './classic'

/** Every map a game can be played on, by identifier. */
export const MAPS: Record<MapId, GameMap> = {
  classic: classicMap,
}

/** Whether `value` names a map of the catalog. */
export function isMapId(value: unknown): value is MapId {
  return typeof value === 'string' && Object.hasOwn(MAPS, value)
}

/** The map of the catalog named `id`. */
export function mapById(id: MapId): GameMap {
  return MAPS[id]
}
