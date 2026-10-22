<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import type { MapPoint } from './geometry/polygon'

const props = defineProps<{
  position: MapPoint
  name: string
  bonus: number
}>()
</script>

<template>
  <Html
    center
    pointer-events="none"
    :position="[props.position.x, 0.2, props.position.z]"
    :z-index-range="[5, 0]"
  >
    <span class="continent-label">{{ props.name }} +{{ props.bonus }}</span>
  </Html>
</template>

<style scoped>
.continent-label {
  white-space: nowrap;
  color: rgba(244, 236, 216, 0.9);
  font: 700 12px/1 system-ui, sans-serif;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  user-select: none;
}
</style>
