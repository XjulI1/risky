<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { onBeforeUnmount } from 'vue'
import type { WorldSize } from './geometry/mapGeometry'
import { createOceanMaterial } from './oceanMaterial'

defineProps<{
  size: WorldSize
}>()

const OCEAN_MARGIN = 1.6

const material = createOceanMaterial()
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  const time = material.uniforms.uTime
  if (time !== undefined) {
    time.value = elapsed
  }
})

onBeforeUnmount(() => material.dispose())
</script>

<template>
  <TresMesh
    :rotation-x="-Math.PI / 2"
    :material="material"
  >
    <TresPlaneGeometry :args="[size.width * OCEAN_MARGIN, size.depth * OCEAN_MARGIN]" />
  </TresMesh>
</template>
