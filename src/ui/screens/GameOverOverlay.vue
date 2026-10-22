<script setup lang="ts">
import type { Player } from '../../engine'

defineProps<{
  winner: Player
}>()

const emit = defineEmits<{
  replay: []
  home: []
}>()
</script>

<template>
  <div class="absolute inset-0 z-40 flex items-center justify-center bg-ink/60">
    <div class="w-96 space-y-6 rounded-2xl bg-panel-strong p-8 text-center shadow-xl">
      <p
        class="text-3xl font-bold"
        :style="{ color: winner.color }"
      >
        {{ winner.name }} remporte la partie
      </p>
      <div class="flex flex-col gap-2">
        <button
          type="button"
          class="min-h-12 rounded-xl bg-accent font-bold text-ink"
          @click="emit('replay')"
        >
          Rejouer avec les mêmes paramètres
        </button>
        <button
          type="button"
          class="min-h-12 rounded-xl bg-ink/60"
          @click="emit('home')"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
</template>
