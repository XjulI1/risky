<script setup lang="ts">
import { CONQUER_24_TERRITORIES, mapById, missionText, type MapId, type Player } from '../../engine'

const props = defineProps<{
  player: Player
  mapId: MapId
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const MESSAGE = `Votre cible a été éliminée par un autre joueur : votre mission devient ${missionText(CONQUER_24_TERRITORIES, [], mapById(props.mapId))}`
</script>

<template>
  <div class="absolute inset-0 z-40 flex items-center justify-center bg-ink/50">
    <div
      data-testid="mission-converted"
      class="w-80 space-y-4 rounded-2xl bg-panel-strong p-6 text-center shadow-xl"
    >
      <p class="text-sm uppercase tracking-wider text-parchment/60">
        Mission de <span :style="{ color: player.color }">{{ player.name }}</span>
      </p>
      <p class="text-lg">
        {{ MESSAGE }}
      </p>
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
