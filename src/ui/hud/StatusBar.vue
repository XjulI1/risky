<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from '../../engine'
import type { InteractionView } from '../../game/interaction'
import { PHASE_LABELS } from '../../game/labels'

const props = defineProps<{
  state: GameState
  view: InteractionView
}>()

const HINTS: Partial<Record<GameState['phase']['kind'], string>> = {
  claim: 'Touchez un territoire libre pour le revendiquer.',
  placement: 'Touchez un de vos territoires pour y placer une armée.',
  capitalChoice: 'Touchez un de vos territoires pour en faire votre capitale, en secret.',
  reinforce: 'Touchez un de vos territoires pour y déployer des renforts.',
  eliminationTrade: 'Échangez vos cartes puis déployez les armées obtenues.',
  conquestMove: "Choisissez combien d'armées avancer dans le territoire conquis.",
  fortify: 'Déplacez des armées entre deux de vos territoires, ou passez.',
}

const player = computed(() => props.state.players[props.state.currentPlayerIndex])

const reserveText = computed(() => {
  const phase = props.state.phase
  if (phase.kind === 'reinforce' || phase.kind === 'eliminationTrade') {
    return `${phase.reserve} à placer`
  }
  if (props.view.armiesToPlace !== null) {
    return `${props.view.armiesToPlace} à placer`
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
      <span
        data-testid="status-title"
        class="truncate"
      >{{ player?.name }}</span>
    </p>
    <p class="flex items-baseline gap-2 font-semibold">
      <span
        data-testid="status-phase"
        class="min-w-0 flex-1 truncate"
      >{{ PHASE_LABELS[state.phase.kind] }}</span>
      <span
        v-if="reserveText"
        data-testid="status-reserve"
        class="shrink-0 text-accent"
      >{{ reserveText }}</span>
    </p>
    <p
      data-testid="status-hint"
      class="line-clamp-2 h-10 text-sm text-parchment/80"
    >
      {{ hint }}
    </p>
  </header>
</template>
