<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from '../../engine'
import type { InteractionView } from '../../game/interaction'
import { armiesLabel, PHASE_LABELS } from '../../game/labels'

const props = defineProps<{
  state: GameState
  view: InteractionView
  instantResult: string | null
}>()

const HINTS: Partial<Record<GameState['phase']['kind'], string>> = {
  claim: 'Touchez un territoire libre pour le revendiquer.',
  placement: 'Touchez un de vos territoires pour y placer une armée.',
  reinforce: 'Touchez un de vos territoires pour y déployer des renforts.',
  eliminationTrade: 'Échangez vos cartes puis déployez les armées obtenues.',
  conquestMove: "Choisissez combien d'armées avancer dans le territoire conquis.",
  fortify: 'Déplacez des armées entre deux de vos territoires, ou passez.',
}

const player = computed(() => props.state.players[props.state.currentPlayerIndex])

const reserveText = computed(() => {
  const phase = props.state.phase
  if (phase.kind === 'reinforce' || phase.kind === 'eliminationTrade') {
    return `${armiesLabel(phase.reserve)} à placer`
  }
  if (props.view.armiesToPlace !== null) {
    return `${armiesLabel(props.view.armiesToPlace)} restant à placer`
  }
  return null
})

const hint = computed(() => {
  if (player.value?.kind === 'ai' && props.state.phase.kind !== 'gameOver') {
    return `${player.value.name} réfléchit…`
  }
  if (props.state.phase.kind === 'attack') {
    return props.view.interaction.kind === 'idle' ? "Choisissez un territoire d'où attaquer." : 'Choisissez la cible.'
  }
  return HINTS[props.state.phase.kind] ?? null
})
</script>

<template>
  <header class="space-y-1 rounded-xl bg-ink/60 p-3">
    <p class="flex items-center gap-2 text-lg font-bold">
      <span
        class="size-4 shrink-0 rounded-full"
        :style="{ backgroundColor: player?.color }"
      />
      <span data-testid="status-title">{{ player?.name }} — {{ PHASE_LABELS[state.phase.kind] }}</span>
    </p>
    <p
      v-if="reserveText"
      class="font-semibold text-accent"
    >
      {{ reserveText }}
    </p>
    <p
      v-if="hint"
      data-testid="status-hint"
      class="text-sm text-parchment/80"
    >
      {{ hint }}
    </p>
    <p
      v-if="instantResult"
      class="rounded-lg bg-panel-strong p-2 text-sm"
    >
      {{ instantResult }}
    </p>
  </header>
</template>
