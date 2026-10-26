<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { mapById, type Card, type MapId } from '../../engine'

const props = defineProps<{
  card: Card
  mapId: MapId
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const DISPLAY_MS = 3500
const SYMBOL_LABELS = { infantry: 'Fantassin', cavalry: 'Cavalier', artillery: 'Artillerie', joker: 'Joker' }

const territory = computed(() =>
  props.card.territory === null ? '' : (mapById(props.mapId).territories[props.card.territory]?.name ?? ''),
)

let timer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  timer = setTimeout(() => emit('dismiss'), DISPLAY_MS)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="absolute inset-0 z-40 flex items-center justify-center bg-ink/50">
    <div class="w-64 space-y-4 rounded-2xl bg-panel-strong p-6 text-center shadow-xl">
      <p class="text-sm uppercase tracking-wider text-parchment/60">
        Carte piochée
      </p>
      <p class="text-2xl font-bold">
        {{ SYMBOL_LABELS[card.symbol] }}
      </p>
      <p class="text-parchment/80">
        {{ territory }}
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
