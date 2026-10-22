<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps<{
  message: string | null
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const DISPLAY_MS = 4000
let timer: ReturnType<typeof setTimeout> | undefined

watch(
  () => props.message,
  (message) => {
    clearTimeout(timer)
    if (message !== null) {
      timer = setTimeout(() => emit('dismiss'), DISPLAY_MS)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    v-if="message"
    role="alert"
    class="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-danger px-4 py-2 text-parchment shadow-lg"
  >
    <span>{{ message }}</span>
    <button
      type="button"
      class="size-11 rounded-lg"
      aria-label="Fermer"
      @click="emit('dismiss')"
    >
      ✕
    </button>
  </div>
</template>
