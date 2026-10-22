<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import type { Highlights } from './board/boardViewModel'
import GameBoard from './board/GameBoard.vue'
import { applyAction, classicMap, createGame, type GameState, type PlayerConfig, type TerritoryId } from './engine'

const DEMO_PLAYERS: PlayerConfig[] = [
  { id: 'red', name: 'Rouge', color: '#d64541', kind: 'human' },
  { id: 'blue', name: 'Bleu', color: '#3a7bd5', kind: 'human' },
  { id: 'green', name: 'Vert', color: '#3fa34d', kind: 'human' },
  { id: 'yellow', name: 'Jaune', color: '#e3b23c', kind: 'human' },
]

function demoGame(seed: number): GameState {
  const created = createGame({ players: DEMO_PLAYERS, seed })
  if (!created.ok) {
    throw new Error(created.error.message)
  }
  let state = created.state
  let turn = 0
  while (state.phase.kind === 'placement') {
    const playerId = state.players[state.currentPlayerIndex]?.id ?? ''
    const owned = classicMap.territoryIds.filter((id) => state.territories[id]?.owner === playerId)
    const territory = owned[(turn * 7) % owned.length] ?? ''
    const result = applyAction(state, { type: 'placeInitialArmy', playerId, territory })
    if (!result.ok) {
      throw new Error(result.error.message)
    }
    state = result.state
    turn += 1
  }
  return state
}

const seed = ref(Date.now())
const state = shallowRef(demoGame(seed.value))
const selected = ref<TerritoryId | null>(null)

const highlights = computed<Highlights>(() => {
  if (selected.value === null) {
    return {}
  }
  const neighbors = classicMap.territories[selected.value]?.neighbors ?? []
  return Object.fromEntries([[selected.value, 'selected'], ...neighbors.map((id) => [id, 'target'])])
})

const selectedName = computed(() =>
  selected.value === null ? 'Aucun territoire sélectionné' : classicMap.territories[selected.value]?.name,
)

function reshuffle() {
  seed.value += 1
  state.value = demoGame(seed.value)
}
</script>

<template>
  <main class="demo">
    <GameBoard
      :state="state"
      :highlights="highlights"
      @select="selected = $event"
    />
    <aside class="demo-panel">
      <strong>Démonstration du plateau</strong>
      <span>{{ selectedName }}</span>
      <button
        type="button"
        @click="reshuffle"
      >
        Nouvelle répartition
      </button>
    </aside>
  </main>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  background: #163b52;
}
</style>

<style scoped>
.demo {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.demo-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(20, 24, 32, 0.85);
  color: #fff;
  font: 14px/1.4 system-ui, sans-serif;
}

.demo-panel button {
  min-height: 44px;
  border: none;
  border-radius: 8px;
  background: #f4ecd8;
  color: #1d2733;
  font-weight: 600;
  cursor: pointer;
}
</style>
