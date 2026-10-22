<script setup lang="ts">
import { computed, ref } from 'vue'
import { createGame, type GameSettings, type GameState } from '../../engine'
import {
  addPlayer,
  chooseColor,
  defaultSetup,
  MAX_FORM_PLAYERS,
  MAX_NAME_LENGTH,
  MIN_FORM_PLAYERS,
  nameErrors,
  PLAYER_PALETTE,
  removePlayer,
  type GameSetup,
} from '../../game/gameForm'

const emit = defineEmits<{
  start: [state: GameState, setup: GameSetup]
  back: []
}>()

const setup = ref<GameSetup>(defaultSetup())
const engineError = ref<string | null>(null)

const errors = computed(() => nameErrors(setup.value.players))
const canStart = computed(() => Object.keys(errors.value).length === 0)
const withNeutral = computed(() => setup.value.players.length === MIN_FORM_PLAYERS)

const diceChoices = [1, 2, 3]

function updateName(id: string, name: string) {
  setup.value.players = setup.value.players.map((player) => (player.id === id ? { ...player, name } : player))
}

function updateSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
  setup.value.settings = { ...setup.value.settings, [key]: value }
}

function start() {
  const players = setup.value.players.map((player) => ({ ...player, name: player.name.trim() }))
  const result = createGame({ players, settings: setup.value.settings, seed: Date.now() })
  if (!result.ok) {
    engineError.value = result.error.message
    return
  }
  emit('start', result.state, { players, settings: { ...setup.value.settings } })
}
</script>

<template>
  <main class="flex min-h-full items-center justify-center p-6">
    <div class="w-full max-w-3xl space-y-6 rounded-2xl bg-panel p-6 shadow-xl">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">
          Nouvelle partie
        </h1>
        <button
          type="button"
          class="min-h-11 rounded-lg px-4 text-parchment/80 hover:text-parchment"
          @click="emit('back')"
        >
          Retour
        </button>
      </header>

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">
          Joueurs
        </h2>
        <div
          v-for="player in setup.players"
          :key="player.id"
          data-testid="player-row"
          :data-color="player.color"
          class="flex flex-wrap items-center gap-3 rounded-xl bg-ink/60 p-3"
        >
          <span
            class="size-6 shrink-0 rounded-full border-2 border-parchment/70"
            :style="{ backgroundColor: player.color }"
          />
          <div class="flex min-w-48 flex-1 flex-col">
            <input
              data-testid="player-name"
              class="min-h-11 rounded-lg bg-ink px-3 text-parchment outline-none ring-accent focus:ring-2"
              :value="player.name"
              :maxlength="MAX_NAME_LENGTH + 5"
              :aria-label="`Nom du joueur`"
              @input="updateName(player.id, ($event.target as HTMLInputElement).value)"
            >
            <span
              v-if="errors[player.id]"
              class="mt-1 text-sm text-danger"
            >{{ errors[player.id] }}</span>
          </div>
          <div class="flex gap-1">
            <button
              v-for="color in PLAYER_PALETTE"
              :key="color"
              type="button"
              :data-testid="`color-${color}`"
              class="size-11 rounded-lg border-2"
              :class="color === player.color ? 'border-parchment' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              :aria-label="`Couleur ${color}`"
              @click="setup.players = chooseColor(setup.players, player.id, color)"
            />
          </div>
          <button
            type="button"
            data-testid="remove-player"
            class="min-h-11 rounded-lg px-3 text-parchment/80 hover:text-parchment disabled:opacity-30"
            :disabled="setup.players.length <= MIN_FORM_PLAYERS"
            @click="setup.players = removePlayer(setup.players, player.id)"
          >
            Retirer
          </button>
        </div>
        <button
          type="button"
          data-testid="add-player"
          class="min-h-11 rounded-lg border border-parchment/40 px-4 hover:bg-ink/60 disabled:opacity-30"
          :disabled="setup.players.length >= MAX_FORM_PLAYERS"
          @click="setup.players = addPlayer(setup.players)"
        >
          Ajouter un joueur
        </button>
        <p
          v-if="withNeutral"
          class="text-sm text-parchment/80"
        >
          À 2 joueurs, une armée neutre est ajoutée : elle occupe 14 territoires et se défend, sans jouer.
        </p>
      </section>

      <section class="grid gap-4 sm:grid-cols-2">
        <h2 class="text-lg font-semibold sm:col-span-2">
          Règles
        </h2>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-parchment/80">Répartition des territoires</span>
          <select
            data-testid="setting-territoryDistribution"
            class="select-field min-h-11 rounded-lg bg-ink px-3"
            :value="setup.settings.territoryDistribution"
            @change="updateSetting('territoryDistribution', ($event.target as HTMLSelectElement).value as GameSettings['territoryDistribution'])"
          >
            <option value="random">Aléatoire</option>
            <option value="choice">Au choix des joueurs</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-parchment/80">Placement des armées</span>
          <select
            data-testid="setting-armyPlacement"
            class="select-field min-h-11 rounded-lg bg-ink px-3"
            :value="setup.settings.armyPlacement"
            @change="updateSetting('armyPlacement', ($event.target as HTMLSelectElement).value as GameSettings['armyPlacement'])"
          >
            <option value="random">Aléatoire pour tous les joueurs</option>
            <option value="manual">Un par un, à tour de rôle</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-parchment/80">Barème d'échange des cartes</span>
          <select
            data-testid="setting-cardTradeScale"
            class="select-field min-h-11 rounded-lg bg-ink px-3"
            :value="setup.settings.cardTradeScale"
            @change="updateSetting('cardTradeScale', ($event.target as HTMLSelectElement).value as GameSettings['cardTradeScale'])"
          >
            <option value="progressive">Progressif (4, 6, 8, 10, 12, 15, +5)</option>
            <option value="fixed">Fixe (4, 6, 8, 10)</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-parchment/80">Dés maximum en attaque</span>
          <select
            data-testid="setting-attackerMaxDice"
            class="select-field min-h-11 rounded-lg bg-ink px-3"
            :value="setup.settings.attackerMaxDice"
            @change="updateSetting('attackerMaxDice', Number(($event.target as HTMLSelectElement).value))"
          >
            <option
              v-for="count in diceChoices"
              :key="count"
              :value="count"
            >
              {{ count }}
            </option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-parchment/80">Dés maximum en défense</span>
          <select
            data-testid="setting-defenderMaxDice"
            class="select-field min-h-11 rounded-lg bg-ink px-3"
            :value="setup.settings.defenderMaxDice"
            @change="updateSetting('defenderMaxDice', Number(($event.target as HTMLSelectElement).value))"
          >
            <option
              v-for="count in diceChoices"
              :key="count"
              :value="count"
            >
              {{ count }}
            </option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm text-parchment/80">Fortification</span>
          <select
            data-testid="setting-fortifyMode"
            class="select-field min-h-11 rounded-lg bg-ink px-3"
            :value="setup.settings.fortifyMode"
            @change="updateSetting('fortifyMode', ($event.target as HTMLSelectElement).value as GameSettings['fortifyMode'])"
          >
            <option value="connected">Par chemin de territoires possédés</option>
            <option value="adjacent">Vers un territoire voisin</option>
          </select>
        </label>
      </section>

      <p
        v-if="engineError"
        class="text-danger"
      >
        {{ engineError }}
      </p>

      <button
        type="button"
        data-testid="start-game"
        class="min-h-12 w-full rounded-xl bg-accent text-lg font-bold text-ink disabled:opacity-40"
        :disabled="!canStart"
        @click="start"
      >
        Lancer la partie
      </button>
    </div>
  </main>
</template>
