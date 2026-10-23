<script setup lang="ts">
import { computed, onUnmounted } from 'vue'
import type { Highlights } from '../../board/boardViewModel'
import GameBoard, { type BoardTransit } from '../../board/GameBoard.vue'
import { classicMap, type TerritoryId } from '../../engine'
import { ANIMATION_DURATIONS } from '../../game/animationSpeed'
import { provideGameSession, startGameSession, type GameStart } from '../../game/useGameSession'
import AmountPicker from '../hud/AmountPicker.vue'
import AttackPanel from '../hud/AttackPanel.vue'
import CardHand from '../hud/CardHand.vue'
import DiceTray from '../hud/DiceTray.vue'
import DrawnCardNotice from '../hud/DrawnCardNotice.vue'
import ErrorToast from '../hud/ErrorToast.vue'
import JournalPanel from '../hud/JournalPanel.vue'
import HandoffScreen from '../hud/HandoffScreen.vue'
import MissionConvertedNotice from '../hud/MissionConvertedNotice.vue'
import MissionPanel from '../hud/MissionPanel.vue'
import PlayersPanel from '../hud/PlayersPanel.vue'
import SpeedSelector from '../hud/SpeedSelector.vue'
import StatusBar from '../hud/StatusBar.vue'
import GameOverOverlay from './GameOverOverlay.vue'

const props = defineProps<{
  start: GameStart
}>()

const emit = defineEmits<{
  quit: []
  home: []
  replay: []
}>()

const STORAGE_WARNING = 'La partie ne peut pas être sauvegardée sur cet appareil'

const session = startGameSession(props.start)
provideGameSession(session)

const {
  displayedState,
  engineState,
  isPresenting,
  currentStep,
  view,
  speed,
  handoffTo,
  drawnCard,
  convertedMission,
  error,
  thinkingPlayer,
  aiFocus,
  storageWarning,
  visibleJournal,
  statistics,
} = session
onUnmounted(() => session.dispose())

const notice = computed(() => error.value ?? (storageWarning.value ? STORAGE_WARNING : null))

function dismissNotice() {
  if (error.value !== null) {
    session.dismissError()
  } else {
    session.dismissStorageWarning()
  }
}

const currentPlayer = computed(() => displayedState.value.players[displayedState.value.currentPlayerIndex])
const colorOf = (playerId: string) =>
  displayedState.value.players.find((player) => player.id === playerId)?.color ?? '#ffffff'
const nameOf = (territory: TerritoryId) => classicMap.territories[territory]?.name ?? territory

const presentationHighlights = computed<Highlights>(() => {
  const step = currentStep.value
  return step === null ? {} : { [step.event.from]: 'selected', [step.event.to]: 'target' }
})
const highlights = computed<Highlights>(() => {
  if (isPresenting.value) {
    return presentationHighlights.value
  }
  if (aiFocus.value !== null) {
    return { [aiFocus.value.from]: 'selected', [aiFocus.value.to]: 'target' }
  }
  return thinkingPlayer.value === null ? view.value.highlights : {}
})

const rollStep = computed(() =>
  currentStep.value?.kind === 'roll' && speed.value !== 'instant' ? currentStep.value : null,
)
const transit = computed<BoardTransit | null>(() => {
  const step = currentStep.value
  if (step?.kind !== 'armyMove') {
    return null
  }
  return {
    key: `${step.event.from}-${step.event.to}-${step.event.armies}`,
    from: step.event.from,
    to: step.event.to,
    color: colorOf(step.event.playerId),
    durationMs: ANIMATION_DURATIONS[speed.value].armyMove,
  }
})


const winner = computed(() => {
  const state = displayedState.value
  return state.phase.kind === 'gameOver' && !isPresenting.value
    ? (state.players.find((player) => player.id === state.winner) ?? null)
    : null
})

const canTrade = computed(
  () => engineState.value.phase.kind === 'reinforce' || engineState.value.phase.kind === 'eliminationTrade',
)
const forcedTrade = computed(() => view.value.panel.kind === 'tradeRequired')
const showOverlays = computed(() => !isPresenting.value)

const amountPanel = computed(() => {
  const panel = view.value.panel
  if (panel.kind !== 'amount') {
    return null
  }
  const interaction = view.value.interaction
  const phase = engineState.value.phase
  if (panel.purpose === 'deploy' && interaction.kind === 'deployAmount') {
    return { ...panel, title: `Déployer sur ${nameOf(interaction.territory)}`, confirmLabel: 'Déployer', cancellable: true }
  }
  if (panel.purpose === 'fortify' && interaction.kind === 'fortifyAmount') {
    return {
      ...panel,
      title: `Déplacer de ${nameOf(interaction.from)} vers ${nameOf(interaction.to)}`,
      confirmLabel: 'Déplacer',
      cancellable: true,
    }
  }
  if (panel.purpose === 'conquest' && phase.kind === 'conquestMove') {
    return { ...panel, title: `Armées à avancer en ${nameOf(phase.to)}`, confirmLabel: 'Avancer', cancellable: false }
  }
  return null
})
const amountKey = computed(() => JSON.stringify([view.value.interaction, view.value.panel]))

function onBoardSelect(territory: TerritoryId | null) {
  if (isPresenting.value) {
    session.skipAnimation()
    return
  }
  session.input(territory === null ? { kind: 'ocean' } : { kind: 'territory', territory })
}

function trade(cardIds: [number, number, number]) {
  session.dispatch({ type: 'tradeCards', playerId: engineState.value.players[engineState.value.currentPlayerIndex]?.id ?? '', cardIds })
}
</script>

<template>
  <div class="flex h-full">
    <div class="relative min-w-0 flex-1">
      <GameBoard
        :state="displayedState"
        :highlights="highlights"
        :transit="transit"
        @select="onBoardSelect"
      />
      <DiceTray
        v-if="rollStep"
        :key="`${rollStep.event.from}-${rollStep.rollIndex}-${rollStep.event.attackerDice.join('')}${rollStep.event.defenderDice.join('')}`"
        :event="rollStep.event"
        :attacker-color="colorOf(rollStep.event.attacker)"
        :defender-color="colorOf(rollStep.event.defender)"
        :duration-ms="rollStep.rollIndex === 0 ? ANIMATION_DURATIONS[speed].firstRoll : ANIMATION_DURATIONS[speed].nextRoll"
        @skip="session.skipAnimation()"
      />
      <ErrorToast
        :message="notice"
        @dismiss="dismissNotice"
      />
      <DrawnCardNotice
        v-if="showOverlays && drawnCard"
        :key="drawnCard.id"
        :card="drawnCard"
        @dismiss="session.acknowledgeDrawnCard()"
      />
      <MissionConvertedNotice
        v-if="showOverlays && convertedMission && !handoffTo && !drawnCard"
        :player="convertedMission"
        @dismiss="session.acknowledgeConvertedMission()"
      />
      <GameOverOverlay
        v-if="winner"
        :winner="winner"
        :state="displayedState"
        :statistics="statistics"
        @replay="emit('replay')"
        @home="emit('home')"
      />
    </div>

    <aside class="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto bg-panel p-3">
      <StatusBar
        :state="displayedState"
        :view="view"
      />
      <PlayersPanel :state="displayedState" />
      <MissionPanel
        v-if="!handoffTo"
        :state="displayedState"
      />

      <template v-if="!isPresenting && !winner && !thinkingPlayer">
        <AmountPicker
          v-if="amountPanel"
          :key="amountKey"
          :title="amountPanel.title"
          :min="amountPanel.min"
          :max="amountPanel.max"
          :initial="amountPanel.initial"
          :confirm-label="amountPanel.confirmLabel"
          :cancellable="amountPanel.cancellable"
          @confirm="session.input({ kind: 'confirm', amount: $event })"
          @cancel="session.input({ kind: 'cancel' })"
        />
        <AttackPanel
          v-if="view.panel.kind === 'attackConfirm'"
          :label="view.panel.label"
          @confirm="session.input({ kind: 'confirm' })"
          @cancel="session.input({ kind: 'cancel' })"
        />
        <button
          v-if="view.buttons.endAttack"
          type="button"
          class="min-h-11 rounded-lg border border-parchment/40 font-semibold hover:bg-ink/60"
          @click="session.input({ kind: 'endAttack' })"
        >
          Terminer les attaques
        </button>
        <button
          v-if="view.buttons.skipFortify"
          type="button"
          class="min-h-11 rounded-lg border border-parchment/40 font-semibold hover:bg-ink/60"
          @click="session.input({ kind: 'skipFortify' })"
        >
          Passer
        </button>
      </template>
      <p
        v-else-if="isPresenting || (thinkingPlayer && !winner)"
        class="text-sm text-parchment/70"
        :class="isPresenting ? '' : 'invisible'"
      >
        Touchez le plateau pour passer l'animation.
      </p>

      <CardHand
        v-if="currentPlayer && currentPlayer.kind === 'human' && !currentPlayer.isNeutral && !handoffTo"
        :state="engineState"
        :player-id="currentPlayer.id"
        :can-trade="canTrade && !isPresenting"
        :forced="forcedTrade"
        @trade="trade"
      />

      <JournalPanel
        :entries="visibleJournal"
        :players="displayedState.players"
      />

      <div class="mt-auto space-y-3">
        <SpeedSelector
          :speed="speed"
          @change="session.setSpeed($event)"
        />
        <button
          type="button"
          class="min-h-11 w-full rounded-lg text-parchment/70 hover:text-parchment"
          @click="winner ? emit('home') : emit('quit')"
        >
          Quitter la partie
        </button>
      </div>
    </aside>

    <HandoffScreen
      v-if="showOverlays && handoffTo && !drawnCard"
      :player="handoffTo"
      @ready="session.acknowledgeHandoff()"
    />
  </div>
</template>
