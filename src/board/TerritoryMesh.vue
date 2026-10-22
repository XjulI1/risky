<script setup lang="ts">
import { Color, ExtrudeGeometry } from 'three'
import { computed, onBeforeUnmount } from 'vue'
import { TILE_HEIGHT, HOVER_LIFT } from './boardLayout'
import { DIMMED_BRIGHTNESS, HIGHLIGHT_STYLES, type TerritoryView } from './boardViewModel'
import type { TerritoryGeometry } from './geometry/mapGeometry'
import { createTerritoryBorders, disposeTerritoryBorders } from './territoryBorders'

const props = defineProps<{
  geometry: TerritoryGeometry
  view: TerritoryView
  hovered: boolean
}>()

const extrusion = new ExtrudeGeometry(props.geometry.shapes, {
  depth: TILE_HEIGHT,
  bevelEnabled: false,
  curveSegments: 6,
})
const borders = createTerritoryBorders(props.geometry.shapes)

const style = computed(() => HIGHLIGHT_STYLES[props.view.highlight])
const lift = computed(() => style.value.lift + (props.hovered ? HOVER_LIFT : 0))
const color = computed(() => {
  const base = new Color(props.view.color)
  return props.view.dimmed ? base.multiplyScalar(DIMMED_BRIGHTNESS) : base
})

onBeforeUnmount(() => {
  extrusion.dispose()
  disposeTerritoryBorders(borders)
})
</script>

<template>
  <TresMesh
    :geometry="extrusion"
    :rotation-x="-Math.PI / 2"
    :position-y="lift"
    cast-shadow
    receive-shadow
  >
    <TresMeshStandardMaterial
      :color="color"
      :emissive="color"
      :emissive-intensity="style.emissiveIntensity"
      :roughness="0.85"
      :metalness="0"
    />
    <primitive :object="borders" />
  </TresMesh>
</template>
