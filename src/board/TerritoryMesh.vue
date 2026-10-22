<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { Color, ExtrudeGeometry, MeshStandardMaterial } from 'three'
import { computed, onBeforeUnmount } from 'vue'
import { HOVER_LIFT, TILE_HEIGHT } from './boardLayout'
import { DIMMED_BRIGHTNESS, HIGHLIGHT_STYLES, type TerritoryView } from './boardViewModel'
import type { TerritoryGeometry } from './geometry/mapGeometry'
import { createTerritoryBorders, disposeTerritoryBorders } from './territoryBorders'

const COLOR_EASING_PER_SECOND = 9

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
const targetColor = computed(() => {
  const base = new Color(props.view.color)
  return props.view.dimmed ? base.multiplyScalar(DIMMED_BRIGHTNESS) : base
})

const material = new MeshStandardMaterial({ roughness: 0.85, metalness: 0, color: targetColor.value })
material.emissive.copy(targetColor.value)

const { onBeforeRender } = useLoop()
onBeforeRender(({ delta }) => {
  const blend = 1 - Math.exp(-COLOR_EASING_PER_SECOND * delta)
  material.color.lerp(targetColor.value, blend)
  material.emissive.copy(material.color)
  material.emissiveIntensity = style.value.emissiveIntensity
})

onBeforeUnmount(() => {
  extrusion.dispose()
  material.dispose()
  disposeTerritoryBorders(borders)
})
</script>

<template>
  <TresMesh
    :geometry="extrusion"
    :material="material"
    :rotation-x="-Math.PI / 2"
    :position-y="lift"
    cast-shadow
    receive-shadow
  >
    <primitive :object="borders" />
  </TresMesh>
</template>
