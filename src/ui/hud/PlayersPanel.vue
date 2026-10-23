<script setup lang="ts">
import { computed } from 'vue'
import { heldCapitals, type GameState } from '../../engine'

const props = defineProps<{
  state: GameState
}>()

const capitalCount = computed(() => Object.keys(props.state.capitals ?? {}).length)

const rows = computed(() =>
  props.state.players.map((player, index) => {
    const territories = Object.values(props.state.territories).filter((territory) => territory.owner === player.id)
    return {
      player,
      current: index === props.state.currentPlayerIndex,
      territories: territories.length,
      armies: territories.reduce((sum, territory) => sum + territory.armies, 0),
      cards: props.state.hands[player.id]?.length ?? 0,
      capitals: capitalCount.value === 0 || player.isNeutral ? null : heldCapitals(props.state, player.id),
    }
  }),
)
</script>

<template>
  <table class="w-full text-sm">
    <thead class="text-xs uppercase tracking-wider text-parchment/60">
      <tr>
        <th class="py-1 text-left font-normal">
          Joueur
        </th>
        <th class="font-normal">
          Terr.
        </th>
        <th class="font-normal">
          Armées
        </th>
        <th class="font-normal">
          Cartes
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="row in rows"
        :key="row.player.id"
        :class="[row.player.eliminated ? 'line-through opacity-50' : '', row.current ? 'font-bold' : '']"
      >
        <td class="flex items-center gap-2 py-1">
          <span
            class="size-3 shrink-0 rounded-full"
            :style="{ backgroundColor: row.player.color }"
          />
          <span class="flex min-w-0 flex-col">
            <span class="truncate">{{ row.player.name }}</span>
            <span
              v-if="row.capitals !== null"
              data-testid="capital-count"
              class="text-xs font-normal text-parchment/70"
            >Capitales : {{ row.capitals }}/{{ capitalCount }}</span>
          </span>
        </td>
        <td class="text-center tabular-nums">
          {{ row.territories }}
        </td>
        <td class="text-center tabular-nums">
          {{ row.armies }}
        </td>
        <td class="text-center tabular-nums">
          {{ row.player.isNeutral ? '—' : row.cards }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
