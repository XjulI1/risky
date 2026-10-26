<script setup lang="ts">
import { computed, ref } from 'vue'
import { createGame, type AiLevel, type GameSettings, type GameState } from '../../engine'
import {
  addPlayer,
  AI_LEVEL_LABELS,
  AI_LEVELS,
  applyAiLevel,
  chooseColor,
  chooseControl,
  chooseVariant,
  defaultSetup,
  isLevelAvailable,
  levelForSettings,
  MAX_FORM_PLAYERS,
  MAX_NAME_LENGTH,
  MIN_FORM_PLAYERS,
  MIN_MISSION_PLAYERS,
  nameErrors,
  PLAYER_PALETTE,
  removePlayer,
  type GameSetup,
  type Variant,
} from '../../game/gameForm'

const emit = defineEmits<{
  start: [state: GameState, setup: GameSetup]
  back: []
}>()

const setup = ref<GameSetup>(defaultSetup())
const aiLevel = ref<AiLevel>('normal')
const engineError = ref<string | null>(null)

const errors = computed(() => nameErrors(setup.value.players))
const canStart = computed(() => Object.keys(errors.value).length === 0)
const withNeutral = computed(() => setup.value.players.length === MIN_FORM_PLAYERS)
const hasAi = computed(() => setup.value.players.some((player) => player.kind === 'ai'))
const missionsAllowed = computed(() => setup.value.players.length >= MIN_MISSION_PLAYERS)
const expertAvailable = computed(() => isLevelAvailable('expert', setup.value.settings))

const diceChoices = [1, 2, 3]

function updateName(id: string, name: string) {
  setup.value.players = setup.value.players.map((player) => (player.id === id ? { ...player, name } : player))
}

function updateKind(id: string, kind: string) {
  setup.value.players = chooseControl(
    setup.value.players,
    id,
    kind === 'ai' ? { kind: 'ai', level: aiLevel.value } : { kind: 'human' },
  )
}

function updateAiLevel(level: AiLevel) {
  aiLevel.value = level
  setup.value.players = applyAiLevel(setup.value.players, level)
}

function addAiPlayer() {
  setup.value.players = applyAiLevel(addPlayer(setup.value.players), aiLevel.value)
}

function updateSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
  setup.value.settings = { ...setup.value.settings, [key]: value }
}

function updateVariant(variant: Variant, checked: boolean) {
  setup.value.settings = chooseVariant(setup.value.settings, variant, checked)
  updateAiLevel(levelForSettings(aiLevel.value, setup.value.settings))
}

function removePlayerRow(id: string) {
  setup.value.players = removePlayer(setup.value.players, id)
  if (!missionsAllowed.value) {
    updateSetting('secretMissions', false)
  }
}

function start() {
  const players = setup.value.players.map((player) => ({ ...player, name: player.name.trim() }))
  const result = createGame({ players, settings: setup.value.settings, mapId: setup.value.mapId, seed: Date.now() })
  if (!result.ok) {
    engineError.value = result.error.message
    return
  }
  emit('start', result.state, { players, settings: { ...setup.value.settings }, mapId: setup.value.mapId })
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
          class="flex flex-nowrap items-center gap-2 rounded-xl bg-ink/60 p-3"
        >
          <span
            class="size-6 shrink-0 rounded-full border-2 border-parchment/70"
            :style="{ backgroundColor: player.color }"
          />
          <div class="flex min-w-0 flex-1 flex-col">
            <input
              data-testid="player-name"
              class="min-h-11 w-full min-w-0 rounded-lg bg-ink px-3 text-parchment outline-none ring-accent focus:ring-2"
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
          <select
            data-testid="player-kind"
            class="select-field min-h-11 shrink-0 rounded-lg bg-ink px-3"
            aria-label="Type du joueur"
            :value="player.kind"
            @change="updateKind(player.id, ($event.target as HTMLSelectElement).value)"
          >
            <option value="human">
              Humain
            </option>
            <option value="ai">
              IA
            </option>
          </select>
          <div class="flex shrink-0 gap-1">
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
            class="size-11 shrink-0 rounded-lg text-lg text-parchment/80 hover:bg-ink/60 hover:text-parchment disabled:opacity-30"
            :aria-label="`Retirer ${player.name}`"
            :title="`Retirer ${player.name}`"
            :disabled="setup.players.length <= MIN_FORM_PLAYERS"
            @click="removePlayerRow(player.id)"
          >
            ✕
          </button>
        </div>
        <button
          type="button"
          data-testid="add-player"
          class="min-h-11 rounded-lg border border-parchment/40 px-4 hover:bg-ink/60 disabled:opacity-30"
          :disabled="setup.players.length >= MAX_FORM_PLAYERS"
          @click="addAiPlayer"
        >
          Ajouter un joueur
        </button>
        <div
          v-if="hasAi"
          class="flex flex-col items-center gap-2 pt-2"
        >
          <span
            id="ai-level-label"
            class="text-sm text-parchment/80"
          >Niveau des IA</span>
          <div
            data-testid="ai-level"
            role="group"
            aria-labelledby="ai-level-label"
            class="flex justify-center gap-3"
          >
            <button
              v-for="level in AI_LEVELS"
              :key="level"
              type="button"
              :data-testid="`ai-level-${level}`"
              class="min-h-11 min-w-28 rounded-lg px-5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              :class="level === aiLevel ? 'bg-accent font-semibold text-ink' : 'bg-ink text-parchment/80 enabled:hover:text-parchment'"
              :aria-pressed="level === aiLevel"
              :disabled="!isLevelAvailable(level, setup.settings)"
              @click="updateAiLevel(level)"
            >
              {{ AI_LEVEL_LABELS[level] }}
            </button>
          </div>
          <p
            v-if="!expertAvailable"
            class="text-center text-sm text-parchment/70"
          >
            Mode classique uniquement pour le niveau Expert
          </p>
        </div>
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
        <label
          class="variant-card"
          :class="[
            setup.settings.secretMissions ? 'border-accent' : 'border-transparent',
            missionsAllowed ? 'cursor-pointer hover:border-parchment/30' : 'cursor-not-allowed opacity-60',
          ]"
        >
          <span class="variant-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
              />
              <circle
                cx="12"
                cy="12"
                r="5"
              />
              <circle
                cx="12"
                cy="12"
                r="1.5"
              />
            </svg>
          </span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="font-semibold">Missions secrètes</span>
            <span class="text-sm text-parchment/70">
              {{ missionsAllowed ? 'Un objectif secret par joueur' : '3 joueurs minimum' }}
            </span>
          </span>
          <input
            data-testid="setting-secretMissions"
            type="checkbox"
            class="size-5 shrink-0 accent-accent"
            :checked="setup.settings.secretMissions"
            :disabled="!missionsAllowed"
            @change="updateVariant('secretMissions', ($event.target as HTMLInputElement).checked)"
          >
        </label>
        <label
          class="variant-card cursor-pointer"
          :class="setup.settings.capitals ? 'border-accent' : 'border-transparent hover:border-parchment/30'"
        >
          <span class="variant-icon">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M3 21h18" />
              <path d="M5 21V10l2-1V5h2v2h2V5h2v2h2V5h2v4l2 1v11" />
              <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
            </svg>
          </span>
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="font-semibold">Mode capitales</span>
            <span class="text-sm text-parchment/70">Tenir toutes les capitales</span>
          </span>
          <input
            data-testid="setting-capitals"
            type="checkbox"
            class="size-5 shrink-0 accent-accent"
            :checked="setup.settings.capitals"
            @change="updateVariant('capitals', ($event.target as HTMLInputElement).checked)"
          >
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

<style scoped>
.variant-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px;
  border-width: 2px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-ink) 60%, transparent);
  transition: border-color 150ms;
}

.variant-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-ink);
  color: var(--color-accent);
}

.variant-icon svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
