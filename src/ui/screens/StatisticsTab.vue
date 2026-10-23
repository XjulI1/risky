<script setup lang="ts">
import { computed } from 'vue'
import type { Player, PlayerId } from '../../engine'
import { finalRanking, type GameStatistics, type PlayerCounters, type PlayerSnapshot } from '../../game/history/statistics'
import LineChart from './LineChart.vue'
import type { ChartSeries } from './lineChart'

const props = defineProps<{
  statistics: GameStatistics
  players: Player[]
  winner: PlayerId | null
}>()

type CountedColumn = Exclude<keyof PlayerCounters, 'eliminatedAtTurn'>

const COLUMNS: { key: CountedColumn; label: string }[] = [
  { key: 'conquests', label: 'Conquêtes' },
  { key: 'attacks', label: 'Attaques' },
  { key: 'armiesDestroyed', label: 'Armées détruites' },
  { key: 'armiesLost', label: 'Armées perdues' },
  { key: 'bestDieRolls', label: 'Meilleur dé' },
  { key: 'trades', label: 'Séries échangées' },
  { key: 'armiesFromTrades', label: 'Armées des échanges' },
]

const ranking = computed(() =>
  finalRanking(props.statistics, props.winner).flatMap((id) => {
    const player = props.players.find((candidate) => candidate.id === id)
    const counters = props.statistics.counters[id]
    return player === undefined || counters === undefined ? [] : [{ player, counters }]
  }),
)

const turns = computed(() => props.statistics.snapshots.map((snapshot) => snapshot.turn))

function seriesOf(measure: keyof PlayerSnapshot): ChartSeries[] {
  return ranking.value.map(({ player }) => ({
    id: player.id,
    label: player.name,
    color: player.color,
    values: props.statistics.snapshots.map((snapshot) => snapshot.players[player.id]?.[measure] ?? 0),
  }))
}

function outcome(id: PlayerId, counters: PlayerCounters): string {
  if (id === props.winner) {
    return 'Vainqueur'
  }
  return counters.eliminatedAtTurn === null ? '—' : `Éliminé au tour ${counters.eliminatedAtTurn}`
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-6 md:grid-cols-2">
      <LineChart
        title="Territoires par tour"
        :series="seriesOf('territories')"
        :turns="turns"
      />
      <LineChart
        title="Armées par tour"
        :series="seriesOf('armies')"
        :turns="turns"
      />
    </div>
    <table
      data-testid="statistics-table"
      class="w-full table-fixed text-sm"
    >
      <thead>
        <tr class="text-left text-parchment/70">
          <th class="w-32 py-1 font-semibold">
            Joueur
          </th>
          <th
            v-for="column in COLUMNS"
            :key="column.key"
            class="py-1 text-right font-semibold"
          >
            {{ column.label }}
          </th>
          <th class="w-36 py-1 pl-3 font-semibold">
            Résultat
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="{ player, counters } in ranking"
          :key="player.id"
          data-testid="statistics-row"
          class="border-t border-parchment/15"
        >
          <td class="truncate py-1.5 font-semibold">
            <span
              class="mr-2 inline-block size-3 rounded-full align-middle"
              :style="{ backgroundColor: player.color }"
            />{{ player.name }}
          </td>
          <td
            v-for="column in COLUMNS"
            :key="column.key"
            class="py-1.5 text-right tabular-nums"
          >
            {{ counters[column.key] }}
          </td>
          <td class="py-1.5 pl-3">
            {{ outcome(player.id, counters) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
