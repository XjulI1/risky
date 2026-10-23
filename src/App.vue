<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { createGame, type GameState } from './engine'
import type { GameSetup } from './game/gameForm'
import { deleteSavedGame, loadSavedGame, type SavedGame } from './game/persistence'
import { setupOf, type GameStart } from './game/useGameSession'
import OffTargetBanner from './ui/OffTargetBanner.vue'
import CreateGameScreen from './ui/screens/CreateGameScreen.vue'
import GameScreen from './ui/screens/GameScreen.vue'
import HomeScreen from './ui/screens/HomeScreen.vue'

type Screen =
  | { kind: 'home' }
  | { kind: 'create' }
  | { kind: 'game'; id: number; start: GameStart }

const screen = shallowRef<Screen>({ kind: 'home' })
const savedGame = shallowRef<SavedGame | null>(null)
const loadError = ref(false)
let gameCount = 0

function readSave() {
  const loaded = loadSavedGame()
  savedGame.value = loaded.kind === 'saved' ? loaded.game : null
  loadError.value = loaded.kind === 'unreadable'
}

function goHome() {
  readSave()
  screen.value = { kind: 'home' }
}

function openGame(start: GameStart) {
  gameCount += 1
  loadError.value = false
  screen.value = { kind: 'game', id: gameCount, start }
}

function startGame(state: GameState, setup: GameSetup) {
  openGame({ kind: 'new', state, setup })
}

function resume() {
  if (savedGame.value !== null) {
    openGame({ kind: 'saved', game: savedGame.value })
  }
}

function leaveEndScreen() {
  deleteSavedGame()
  goHome()
}

function replay(setup: GameSetup) {
  const result = createGame({ ...setup, seed: Date.now() })
  if (result.ok) {
    startGame(result.state, setup)
  }
}

readSave()
</script>

<template>
  <OffTargetBanner />
  <HomeScreen
    v-if="screen.kind === 'home'"
    :saved="savedGame"
    :load-error="loadError"
    @create="loadError = false; screen = { kind: 'create' }"
    @resume="resume"
  />
  <CreateGameScreen
    v-else-if="screen.kind === 'create'"
    @start="startGame"
    @back="goHome"
  />
  <GameScreen
    v-else
    :key="screen.id"
    :start="screen.start"
    @quit="goHome"
    @home="leaveEndScreen"
    @replay="replay(setupOf(screen.start))"
  />
</template>
