<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import type { Group } from 'three'
import { shallowRef } from 'vue'
import { TILE_HEIGHT } from './boardLayout'
import type { MapPoint } from './geometry/polygon'

const ARC_HEIGHT = 2.5

const props = defineProps<{
  from: MapPoint
  to: MapPoint
  color: string
  durationMs: number
}>()

const group = shallowRef<Group | null>(null)
const startedAt = performance.now()

const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  const progress = props.durationMs <= 0 ? 1 : Math.min(1, (performance.now() - startedAt) / props.durationMs)
  const eased = progress * progress * (3 - 2 * progress)
  group.value?.position.set(
    props.from.x + (props.to.x - props.from.x) * eased,
    TILE_HEIGHT + Math.sin(eased * Math.PI) * ARC_HEIGHT,
    props.from.z + (props.to.z - props.from.z) * eased,
  )
})
</script>

<template>
  <TresGroup
    ref="group"
    :position="[props.from.x, TILE_HEIGHT, props.from.z]"
  >
    <TresMesh :position-y="0.12">
      <TresCylinderGeometry :args="[0.45, 0.55, 0.24, 8]" />
      <TresMeshStandardMaterial :color="props.color" />
    </TresMesh>
    <TresMesh :position-y="0.5">
      <TresConeGeometry :args="[0.28, 0.55, 6]" />
      <TresMeshStandardMaterial :color="props.color" />
    </TresMesh>
  </TresGroup>
</template>
