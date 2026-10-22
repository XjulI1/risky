<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { onBeforeUnmount } from 'vue'
import { MAP_WORLD_DEPTH, MAP_WORLD_WIDTH } from './geometry/mapGeometry'
import { createOceanMaterial } from './oceanMaterial'

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
    <TresPlaneGeometry :args="[MAP_WORLD_WIDTH * OCEAN_MARGIN, MAP_WORLD_DEPTH * OCEAN_MARGIN]" />
  </TresMesh>
</template>
