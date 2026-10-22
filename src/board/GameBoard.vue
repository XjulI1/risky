<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { DirectionalLight, PCFSoftShadowMap } from 'three'
import { computed, ref } from 'vue'
import continentLabels from '../../data/maps/classic/continent-labels.json'
import { classicMap, type GameState, type TerritoryId } from '../engine'
import ArmyPawn from './ArmyPawn.vue'
import BoardControls, { type HoveredTerritory } from './BoardControls.vue'
import { boardViewModel, HIGHLIGHT_STYLES, type Highlights } from './boardViewModel'
import { CAMERA_FOV } from './cameraFraming'
import ContinentLabel from './ContinentLabel.vue'
import { territoryAnchor } from './geometry/anchors'
import { mapGeometry, svgToWorld } from './geometry/mapGeometry'
import { seaRouteSegments, wrapStubs } from './geometry/seaRoutes'
import { HOVER_LIFT } from './boardLayout'
import OceanPlane from './OceanPlane.vue'
import SeaLink from './SeaLink.vue'
import TerritoryMesh from './TerritoryMesh.vue'

const props = defineProps<{
  state: GameState
  highlights?: Highlights
}>()

const emit = defineEmits<{
  select: [territory: TerritoryId | null]
}>()

const SHADOW_MAP_SIZE = window.matchMedia('(pointer: coarse)').matches ? 1024 : 2048
const SHADOW_EXTENT = 60

const light = new DirectionalLight('#fff3dc', 1.8)
light.position.set(-30, 60, 25)
light.castShadow = true
light.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE)
light.shadow.camera.left = -SHADOW_EXTENT
light.shadow.camera.right = SHADOW_EXTENT
light.shadow.camera.top = SHADOW_EXTENT
light.shadow.camera.bottom = -SHADOW_EXTENT
light.shadow.bias = -0.0005

const view = computed(() => boardViewModel(props.state, props.highlights ?? {}))
const hovered = ref<HoveredTerritory | null>(null)
const controls = ref<InstanceType<typeof BoardControls> | null>(null)

const territories = computed(() =>
  classicMap.territoryIds.flatMap((id) => {
    const geometry = mapGeometry[id]
    const territoryView = view.value[id]
    if (geometry === undefined || territoryView === undefined) {
      return []
    }
    const hoverLift = hovered.value?.id === id ? HOVER_LIFT : 0
    return [
      {
        id,
        geometry,
        view: territoryView,
        anchor: territoryAnchor(id),
        lift: HIGHLIGHT_STYLES[territoryView.highlight].lift + hoverLift,
      },
    ]
  }),
)

const labelPositions: Record<string, number[]> = continentLabels

const continents = classicMap.continentIds.flatMap((id) => {
  const continent = classicMap.continents[id]
  const [x, y] = labelPositions[id] ?? []
  return continent === undefined || x === undefined || y === undefined
    ? []
    : [{ id, name: continent.name, bonus: continent.bonus, position: svgToWorld(x, y) }]
})

const hoveredName = computed(() =>
  hovered.value === null ? null : (classicMap.territories[hovered.value.id]?.name ?? null),
)
</script>

<template>
  <div class="game-board">
    <TresCanvas
      :dpr="[1, 2]"
      antialias
      shadows
      :shadow-map-type="PCFSoftShadowMap"
      clear-color="#163b52"
    >
      <TresPerspectiveCamera
        :fov="CAMERA_FOV"
        :near="0.5"
        :far="1000"
      />
      <TresHemisphereLight :args="['#fff6e5', '#24485f', 1.1]" />
      <primitive :object="light" />

      <OceanPlane />

      <TerritoryMesh
        v-for="territory in territories"
        :key="territory.id"
        :geometry="territory.geometry"
        :view="territory.view"
        :hovered="hovered?.id === territory.id"
      />

      <template
        v-for="territory in territories"
        :key="`pawn-${territory.id}`"
      >
        <ArmyPawn
          v-if="territory.view.armies > 0"
          :position="territory.anchor"
          :color="territory.view.color"
          :armies="territory.view.armies"
          :lift="territory.lift"
        />
      </template>

      <SeaLink
        v-for="link in seaRouteSegments"
        :key="`${link.a}-${link.b}`"
        :from="link.from"
        :to="link.to"
      />
      <SeaLink
        v-for="stub in wrapStubs"
        :key="`wrap-${stub.territory}`"
        :from="stub.from"
        :to="stub.to"
      />

      <ContinentLabel
        v-for="continent in continents"
        :key="continent.id"
        :position="continent.position"
        :name="continent.name"
        :bonus="continent.bonus"
      />

      <BoardControls
        ref="controls"
        @select="emit('select', $event)"
        @hover="hovered = $event"
      />
    </TresCanvas>

    <div
      v-if="hovered !== null && hoveredName !== null"
      class="territory-tooltip"
      :style="{ left: `${hovered.x}px`, top: `${hovered.y}px` }"
    >
      {{ hoveredName }}
    </div>

    <button
      type="button"
      class="recenter"
      @click="controls?.recenter()"
    >
      Recentrer
    </button>
  </div>
</template>

<style scoped>
.game-board {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
}

.territory-tooltip {
  position: absolute;
  transform: translate(12px, -130%);
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(20, 24, 32, 0.9);
  color: #fff;
  font: 500 13px/1.3 system-ui, sans-serif;
  pointer-events: none;
  white-space: nowrap;
}

.recenter {
  position: absolute;
  right: 16px;
  bottom: 16px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: rgba(20, 24, 32, 0.85);
  color: #fff;
  font: 600 14px/1 system-ui, sans-serif;
  cursor: pointer;
}
</style>
