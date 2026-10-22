<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import { computed } from 'vue'
import { TILE_HEIGHT } from './boardLayout'
import type { MapPoint } from './geometry/polygon'

const props = defineProps<{
  position: MapPoint
  color: string
  armies: number
  lift: number
}>()

const base = computed(() => TILE_HEIGHT + props.lift)
</script>

<template>
  <TresGroup :position="[props.position.x, base, props.position.z]">
    <TresMesh
      :position-y="0.12"
      cast-shadow
    >
      <TresCylinderGeometry :args="[0.55, 0.65, 0.24, 8]" />
      <TresMeshStandardMaterial
        :color="props.color"
        :roughness="0.6"
      />
    </TresMesh>
    <TresMesh
      :position-y="0.55"
      cast-shadow
    >
      <TresConeGeometry :args="[0.32, 0.65, 6]" />
      <TresMeshStandardMaterial
        :color="props.color"
        :roughness="0.6"
      />
    </TresMesh>
    <TresMesh
      :position-y="0.95"
      cast-shadow
    >
      <TresSphereGeometry :args="[0.22, 8, 6]" />
      <TresMeshStandardMaterial
        :color="props.color"
        :roughness="0.6"
      />
    </TresMesh>
    <Html
      center
      pointer-events="none"
      :position="[0, 1.6, 0]"
      :z-index-range="[10, 0]"
    >
      <span class="army-count">{{ props.armies }}</span>
    </Html>
  </TresGroup>
</template>

<style scoped>
.army-count {
  display: inline-block;
  min-width: 1.6em;
  padding: 0.05em 0.35em;
  border-radius: 999px;
  background: rgba(20, 24, 32, 0.85);
  color: #fff;
  font: 600 13px/1.4 system-ui, sans-serif;
  text-align: center;
  user-select: none;
}
</style>
