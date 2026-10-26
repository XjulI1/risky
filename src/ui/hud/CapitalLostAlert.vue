<script setup lang="ts">
import { computed } from 'vue'
import { mapById, type MapId, type Player, type TerritoryId } from '../../engine'

const props = defineProps<{
  player: Player
  territory: TerritoryId
  mapId: MapId
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const territoryName = computed(() => mapById(props.mapId).territories[props.territory]?.name ?? props.territory)
</script>

<template>
  <div
    role="alert"
    class="absolute top-6 left-1/2 z-30 flex w-96 max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border-2 border-danger bg-panel-strong p-3 shadow-xl"
  >
    <span
      class="size-4 shrink-0 rounded-full"
      :style="{ backgroundColor: player.color }"
    />
    <p class="min-w-0 flex-1">
      <span class="block text-sm text-parchment/70">{{ player.name }}</span>
      <span class="font-semibold">Votre capitale {{ territoryName }} est tombée</span>
    </p>
    <button
      type="button"
      class="min-h-11 shrink-0 rounded-lg px-3 font-semibold hover:bg-ink/60"
      @click="emit('dismiss')"
    >
      OK
    </button>
  </div>
</template>
