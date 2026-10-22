<script setup lang="ts">
import { ANIMATION_SPEEDS, SPEED_LABELS, type AnimationSpeed } from '../../game/animationSpeed'

defineProps<{
  speed: AnimationSpeed
}>()

const emit = defineEmits<{
  change: [speed: AnimationSpeed]
}>()
</script>

<template>
  <div class="space-y-1">
    <p class="text-xs uppercase tracking-wider text-parchment/60">
      Vitesse des animations
    </p>
    <div class="grid grid-cols-3 gap-1">
      <button
        v-for="option in ANIMATION_SPEEDS"
        :key="option"
        type="button"
        class="min-h-11 rounded-lg text-sm"
        :class="option === speed ? 'bg-accent font-semibold text-ink' : 'bg-ink/60 text-parchment/80'"
        :aria-pressed="option === speed"
        @click="emit('change', option)"
      >
        {{ SPEED_LABELS[option] }}
      </button>
    </div>
  </div>
</template>
