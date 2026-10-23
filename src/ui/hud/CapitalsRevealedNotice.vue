<script setup lang="ts">
import { computed } from 'vue'
import { classicMap, type Player, type PlayerId, type TerritoryId } from '../../engine'

const props = defineProps<{
  capitals: Record<PlayerId, TerritoryId>
  players: Player[]
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const rows = computed(() =>
  props.players.flatMap((player) => {
    const territory = props.capitals[player.id]
    return territory === undefined ? [] : [{ player, territory: classicMap.territories[territory]?.name ?? territory }]
  }),
)
</script>

<template>
  <div class="absolute inset-0 z-40 flex items-center justify-center bg-ink/50">
    <div
      data-testid="capitals-revealed"
      class="w-80 space-y-4 rounded-2xl bg-panel-strong p-6 text-center shadow-xl"
    >
      <p class="text-sm uppercase tracking-wider text-parchment/60">
        Capitales révélées
      </p>
      <ul class="space-y-2 text-left">
        <li
          v-for="{ player, territory } in rows"
          :key="player.id"
          class="flex items-center gap-2 rounded-lg bg-ink/60 p-2"
        >
          <span
            class="size-3 shrink-0 rounded-full"
            :style="{ backgroundColor: player.color }"
          />
          <span class="font-semibold">{{ player.name }}</span>
          <span class="ml-auto text-parchment/80">{{ territory }}</span>
        </li>
      </ul>
      <button
        type="button"
        class="min-h-11 w-full rounded-lg bg-accent font-semibold text-ink"
        @click="emit('dismiss')"
      >
        OK
      </button>
    </div>
  </div>
</template>
