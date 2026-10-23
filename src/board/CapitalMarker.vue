<script setup lang="ts">
import { Html } from '@tresjs/cientos'
import { computed } from 'vue'
import { CAPITAL_MARKER_RADIUS, TILE_HEIGHT } from './boardLayout'
import type { MapPoint } from './geometry/polygon'

const props = defineProps<{
  position: MapPoint
  color: string
  lift: number
}>()

const BAND_COLOR = '#f4ead5'
const SIDES = 6

const base = computed(() => TILE_HEIGHT + props.lift)
</script>

<template>
  <TresGroup :position="[props.position.x, base, props.position.z]">
    <TresMesh
      :position-y="0.4"
      cast-shadow
    >
      <TresCylinderGeometry :args="[CAPITAL_MARKER_RADIUS * 0.8, CAPITAL_MARKER_RADIUS, 0.8, SIDES]" />
      <TresMeshStandardMaterial
        :color="props.color"
        :roughness="0.6"
      />
    </TresMesh>
    <TresMesh
      :position-y="0.86"
      cast-shadow
    >
      <TresCylinderGeometry :args="[CAPITAL_MARKER_RADIUS * 0.95, CAPITAL_MARKER_RADIUS * 0.95, 0.14, SIDES]" />
      <TresMeshStandardMaterial
        :color="BAND_COLOR"
        :roughness="0.5"
      />
    </TresMesh>
    <TresMesh
      :position-y="1.13"
      cast-shadow
    >
      <TresConeGeometry :args="[CAPITAL_MARKER_RADIUS, 0.4, SIDES]" />
      <TresMeshStandardMaterial
        :color="props.color"
        :roughness="0.6"
      />
    </TresMesh>
    <TresMesh :position-y="1.42">
      <TresOctahedronGeometry :args="[0.12]" />
      <TresMeshStandardMaterial
        :color="BAND_COLOR"
        :emissive="BAND_COLOR"
        :emissive-intensity="0.4"
      />
    </TresMesh>
    <Html
      center
      pointer-events="none"
      :position="[0, 1.95, 0]"
      :z-index-range="[10, 0]"
    >
      <span
        class="capital-badge"
        :style="{ backgroundColor: props.color }"
      >★</span>
    </Html>
  </TresGroup>
</template>

<style scoped>
.capital-badge {
  display: inline-grid;
  place-items: center;
  width: 1.5em;
  height: 1.5em;
  border: 2px solid #f4ead5;
  border-radius: 999px;
  color: #f4ead5;
  font: 700 12px/1 system-ui, sans-serif;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.6);
  user-select: none;
}
</style>
