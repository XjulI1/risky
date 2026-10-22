<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const OFF_TARGET_QUERY = '(max-width: 1023px), (orientation: portrait)'

const media = window.matchMedia(OFF_TARGET_QUERY)
const offTarget = ref(media.matches)
const dismissed = ref(false)

const update = (event: MediaQueryListEvent) => {
  offTarget.value = event.matches
}
media.addEventListener('change', update)
onBeforeUnmount(() => media.removeEventListener('change', update))
</script>

<template>
  <div
    v-if="offTarget && !dismissed"
    data-testid="off-target-banner"
    class="fixed inset-x-0 top-0 z-60 flex items-center justify-between gap-3 bg-accent px-4 py-2 text-ink"
  >
    <span>Risky est conçu pour un écran d'au moins 1024 px de large en mode paysage</span>
    <button
      type="button"
      class="size-11 shrink-0 rounded-lg font-bold"
      aria-label="Fermer"
      @click="dismissed = true"
    >
      ✕
    </button>
  </div>
</template>
