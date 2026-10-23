<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SavedGame } from '../../game/persistence'
import ConfirmDialog from '../ConfirmDialog.vue'

const props = defineProps<{
  saved: SavedGame | null
  loadError: boolean
}>()

const emit = defineEmits<{
  create: []
  resume: []
}>()

const confirmingReplace = ref(false)

const DATE_FORMAT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' })

const inProgress = computed(() => props.saved?.status === 'inProgress')

const summary = computed(() => {
  const game = props.saved
  if (game === null) {
    return null
  }
  const names = game.engineState.players.filter((player) => !player.isNeutral).map((player) => player.name)
  return `${names.join(', ')} — tour ${game.turnNumber} — sauvegardée le ${DATE_FORMAT.format(new Date(game.savedAt))}`
})

function create() {
  if (inProgress.value) {
    confirmingReplace.value = true
  } else {
    emit('create')
  }
}
</script>

<template>
  <main class="flex min-h-full flex-col items-center justify-center gap-10 p-6">
    <h1 class="text-6xl font-black tracking-wider">
      Risky
    </h1>
    <p class="text-parchment/70">
      Conquérez le monde, territoire par territoire.
    </p>
    <p
      v-if="loadError"
      role="alert"
      class="rounded-xl bg-danger px-4 py-2"
    >
      La sauvegarde précédente n'a pas pu être chargée
    </p>
    <div class="flex flex-col items-center gap-3">
      <template v-if="saved">
        <button
          type="button"
          class="min-h-12 rounded-xl bg-accent px-10 text-lg font-bold text-ink"
          @click="emit('resume')"
        >
          {{ inProgress ? 'Reprendre la partie' : 'Voir la dernière partie' }}
        </button>
        <p
          data-testid="saved-summary"
          class="text-sm text-parchment/70"
        >
          {{ summary }}
        </p>
      </template>
      <button
        type="button"
        class="min-h-12 rounded-xl px-10 text-lg font-bold"
        :class="saved ? 'border border-parchment/40 hover:bg-ink/60' : 'bg-accent text-ink'"
        @click="create"
      >
        Nouvelle partie
      </button>
    </div>
    <ConfirmDialog
      v-if="confirmingReplace"
      message="Une partie est en cours. La remplacer par une nouvelle partie ?"
      confirm-label="Remplacer"
      @confirm="confirmingReplace = false; emit('create')"
      @cancel="confirmingReplace = false"
    />
  </main>
</template>
