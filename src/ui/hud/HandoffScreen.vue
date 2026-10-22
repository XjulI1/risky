<script setup lang="ts">
import type { Player } from '../../engine'

defineProps<{
  player: Player
}>()

const emit = defineEmits<{
  ready: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/10">
    <div class="flex w-96 flex-col items-center gap-6 rounded-2xl bg-panel-strong p-8 text-center shadow-xl">
      <p class="text-3xl font-bold">
        Au tour de <span :style="{ color: player.color }">{{ player.name }}</span>
      </p>
      <p class="text-parchment/70">
        Passez l'appareil à {{ player.name }}.
      </p>
      <button
        type="button"
        class="min-h-12 rounded-xl bg-accent px-8 text-lg font-bold text-ink"
        @click="emit('ready')"
      >
        Je suis prêt
      </button>
    </div>
  </div>
</template>
