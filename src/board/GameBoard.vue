<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { DirectionalLight, PCFSoftShadowMap } from 'three'
import { computed, ref } from 'vue'
import { mapOf, type GameState, type TerritoryId } from '../engine'
import ArmyPawn from './ArmyPawn.vue'
import ArmyTransit from './ArmyTransit.vue'
import BoardControls, { type HoveredTerritory } from './BoardControls.vue'
import CapitalMarker from './CapitalMarker.vue'
import { boardViewModel, HIGHLIGHT_STYLES, type Highlights } from './boardViewModel'
import { CAMERA_FOV } from './cameraFraming'
import ContinentLabel from './ContinentLabel.vue'
import { HOVER_LIFT } from './boardLayout'
import { boardMapFor } from './maps'
import OceanPlane from './OceanPlane.vue'
import SeaLink from './SeaLink.vue'
import TerritoryMesh from './TerritoryMesh.vue'

export type BoardTransit = {
  key: string
  from: TerritoryId
  to: TerritoryId
  color: string
  durationMs: number
}

const props = defineProps<{
  state: GameState
  highlights?: Highlights
  transit?: BoardTransit | null
  capitals?: Partial<Record<TerritoryId, string>>
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

const map = computed(() => mapOf(props.state))
const board = computed(() => boardMapFor(props.state.mapId))
const view = computed(() => boardViewModel(props.state, props.highlights ?? {}))
const hovered = ref<HoveredTerritory | null>(null)
const controls = ref<InstanceType<typeof BoardControls> | null>(null)

function pawnPosition(id: TerritoryId) {
  return props.capitals?.[id] === undefined ? board.value.anchor(id) : board.value.capitalLayout(id).pawn
}

const territories = computed(() =>
  map.value.territoryIds.flatMap((id) => {
    const geometry = board.value.geometry[id]
    const territoryView = view.value[id]
    if (geometry === undefined || territoryView === undefined) {
      return []
    }
    const hoverLift = hovered.value?.id === id ? HOVER_LIFT : 0
    const capitalColor = props.capitals?.[id]
    return [
      {
        id,
        geometry,
        view: territoryView,
        anchor: pawnPosition(id),
        capital: capitalColor === undefined ? null : { color: capitalColor, position: board.value.capitalLayout(id).marker },
        lift: HIGHLIGHT_STYLES[territoryView.highlight].lift + hoverLift,
      },
    ]
  }),
)

const continents = computed(() =>
  map.value.continentIds.flatMap((id) => {
    const continent = map.value.continents[id]
    const position = board.value.continentLabels[id]
    return continent === undefined || position === undefined
      ? []
      : [{ id, name: continent.name, bonus: continent.bonus, position }]
  }),
)

const hoveredName = computed(() =>
  hovered.value === null ? null : (map.value.territories[hovered.value.id]?.name ?? null),
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

      <OceanPlane :size="board.size" />

      <TerritoryMesh
        v-for="territory in territories"
        :key="territory.id"
        :geometry="territory.geometry"
        :view="territory.view"
        :hovered="hovered?.id === territory.id"
        :region-borders="board.regionBorders[territory.id] ?? []"
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
        <CapitalMarker
          v-if="territory.capital"
          :position="territory.capital.position"
          :color="territory.capital.color"
          :lift="territory.lift"
        />
      </template>

      <SeaLink
        v-for="link in board.seaRoutes"
        :key="`${link.a}-${link.b}`"
        :from="link.from"
        :to="link.to"
      />
      <SeaLink
        v-for="stub in board.wrapStubs"
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

      <ArmyTransit
        v-if="props.transit"
        :key="props.transit.key"
        :from="pawnPosition(props.transit.from)"
        :to="pawnPosition(props.transit.to)"
        :color="props.transit.color"
        :duration-ms="props.transit.durationMs"
      />

      <BoardControls
        :key="board.id"
        ref="controls"
        :board="board"
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
