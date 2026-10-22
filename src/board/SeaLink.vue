<script setup lang="ts">
import { BufferGeometry, Line, LineDashedMaterial, Vector3 } from 'three'
import { onBeforeUnmount } from 'vue'
import { SEA_LINK_HEIGHT } from './boardLayout'
import type { MapPoint } from './geometry/polygon'

const props = defineProps<{
  from: MapPoint
  to: MapPoint
}>()

const geometry = new BufferGeometry().setFromPoints([
  new Vector3(props.from.x, SEA_LINK_HEIGHT, props.from.z),
  new Vector3(props.to.x, SEA_LINK_HEIGHT, props.to.z),
])
const material = new LineDashedMaterial({ color: '#f4ecd8', dashSize: 0.6, gapSize: 0.4, transparent: true, opacity: 0.85 })
const line = new Line(geometry, material)
line.computeLineDistances()

onBeforeUnmount(() => {
  geometry.dispose()
  material.dispose()
})
</script>

<template>
  <primitive :object="line" />
</template>
