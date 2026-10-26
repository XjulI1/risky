<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { onBeforeUnmount, watch } from 'vue'
import type { TerritoryId } from '../engine'
import { TILE_HEIGHT } from './boardLayout'
import type { MapPoint } from './geometry/polygon'
import type { BoardMap } from './maps'
import { isTap, nearestTerritory, TOUCH_TOLERANCE, type PointerSample } from './tapDetector'
import { useBoardCamera, type BoardCamera } from './useBoardCamera'

export type HoveredTerritory = {
  id: TerritoryId
  x: number
  y: number
}

const props = defineProps<{
  board: BoardMap
}>()

const emit = defineEmits<{
  select: [territory: TerritoryId | null]
  hover: [hovered: HoveredTerritory | null]
}>()

const { camera, renderer } = useTres()
const { onBeforeRender } = useLoop()
const element = renderer.domElement
const raycaster = new Raycaster()
const tilePlane = new Plane(new Vector3(0, 1, 0), -TILE_HEIGHT)
const pressed = new Map<number, PointerSample>()
let gestureHadSeveralPointers = false
let boardCamera: BoardCamera | null = null

function mapPointAt(event: PointerEvent): MapPoint | null {
  const active = camera.value
  if (active === undefined) {
    return null
  }
  const rect = element.getBoundingClientRect()
  const ndc = new Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  )
  raycaster.setFromCamera(ndc, active)
  const hit = raycaster.ray.intersectPlane(tilePlane, new Vector3())
  return hit === null ? null : { x: hit.x, z: hit.z }
}

function sample(event: PointerEvent): PointerSample {
  return { x: event.clientX, y: event.clientY, time: event.timeStamp }
}

function onPointerDown(event: PointerEvent) {
  pressed.set(event.pointerId, sample(event))
  if (pressed.size > 1) {
    gestureHadSeveralPointers = true
  }
}

function onPointerUp(event: PointerEvent) {
  const down = pressed.get(event.pointerId)
  pressed.delete(event.pointerId)
  const singlePointerTap = !gestureHadSeveralPointers && down !== undefined && isTap(down, sample(event))
  if (pressed.size === 0) {
    gestureHadSeveralPointers = false
  }
  if (!singlePointerTap) {
    return
  }
  const point = mapPointAt(event)
  const tolerance = event.pointerType === 'mouse' ? 0 : TOUCH_TOLERANCE
  emit('select', point === null ? null : nearestTerritory(point, props.board.geometry, tolerance))
}

function onPointerCancel(event: PointerEvent) {
  pressed.delete(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || pressed.size > 0) {
    return
  }
  const point = mapPointAt(event)
  const id = point === null ? null : nearestTerritory(point, props.board.geometry, 0)
  const rect = element.getBoundingClientRect()
  emit('hover', id === null ? null : { id, x: event.clientX - rect.left, y: event.clientY - rect.top })
}

function onPointerLeave() {
  emit('hover', null)
}

const resizeObserver = new ResizeObserver(() => boardCamera?.updateBounds())

watch(
  camera,
  (active) => {
    if (boardCamera === null && active instanceof PerspectiveCamera) {
      boardCamera = useBoardCamera(active, element, props.board)
    }
  },
  { immediate: true },
)

element.addEventListener('pointerdown', onPointerDown)
element.addEventListener('pointerup', onPointerUp)
element.addEventListener('pointercancel', onPointerCancel)
element.addEventListener('pointermove', onPointerMove)
element.addEventListener('pointerleave', onPointerLeave)
resizeObserver.observe(element)

onBeforeRender(() => {
  boardCamera?.controls.update()
})

onBeforeUnmount(() => {
  element.removeEventListener('pointerdown', onPointerDown)
  element.removeEventListener('pointerup', onPointerUp)
  element.removeEventListener('pointercancel', onPointerCancel)
  element.removeEventListener('pointermove', onPointerMove)
  element.removeEventListener('pointerleave', onPointerLeave)
  resizeObserver.disconnect()
  boardCamera?.dispose()
})

defineExpose({
  recenter: () => boardCamera?.recenter(),
})
</script>

<template>
  <TresGroup />
</template>
