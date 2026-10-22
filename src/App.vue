<script setup lang="ts">
import { shallowRef } from 'vue'
import { createGame, type GameState } from './engine'
import type { GameSetup } from './game/gameForm'
import OffTargetBanner from './ui/OffTargetBanner.vue'
import CreateGameScreen from './ui/screens/CreateGameScreen.vue'
import GameScreen from './ui/screens/GameScreen.vue'
import HomeScreen from './ui/screens/HomeScreen.vue'

type Screen =
  | { kind: 'home' }
  | { kind: 'create' }
  | { kind: 'game'; id: number; state: GameState; setup: GameSetup }

const screen = shallowRef<Screen>({ kind: 'home' })
let gameCount = 0

function startGame(state: GameState, setup: GameSetup) {
  gameCount += 1
  screen.value = { kind: 'game', id: gameCount, state, setup }
}

function replay(setup: GameSetup) {
  const result = createGame({ ...setup, seed: Date.now() })
  if (result.ok) {
    startGame(result.state, setup)
  }
}
</script>

<template>
  <OffTargetBanner />
  <HomeScreen
    v-if="screen.kind === 'home'"
    @create="screen = { kind: 'create' }"
  />
  <CreateGameScreen
    v-else-if="screen.kind === 'create'"
    @start="startGame"
    @back="screen = { kind: 'home' }"
  />
  <GameScreen
    v-else
    :key="screen.id"
    :initial-state="screen.state"
    :setup="screen.setup"
    @home="screen = { kind: 'home' }"
    @replay="replay(screen.setup)"
  />
</template>
