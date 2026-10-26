<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mapOf, type Card, type CardSymbol, type GameState, type PlayerId } from '../../engine'
import { bestTrade, tradeOffer } from '../../game/cardAdvice'

const props = defineProps<{
  state: GameState
  playerId: PlayerId
  canTrade: boolean
  forced: boolean
}>()

const emit = defineEmits<{
  trade: [cardIds: [number, number, number]]
}>()

const SYMBOL_LABELS: Record<CardSymbol | 'joker', string> = {
  infantry: 'Fantassin',
  cavalry: 'Cavalier',
  artillery: 'Artillerie',
  joker: 'Joker',
}

const SET_SIZE = 3

const hand = computed(() => props.state.hands[props.playerId] ?? [])
const handKey = computed(() => hand.value.map((card) => card.id).join(','))
const selected = ref<number[]>([])
const open = ref(true)

watch(
  handKey,
  () => {
    selected.value = bestTrade(props.state, props.playerId)?.cardIds ?? []
  },
  { immediate: true },
)

const offer = computed(() =>
  selected.value.length === SET_SIZE ? tradeOffer(props.state, props.playerId, selected.value) : null,
)

function territoryName(card: Card): string {
  return card.territory === null ? '' : (mapOf(props.state).territories[card.territory]?.name ?? card.territory)
}

function ownsTerritoryOf(card: Card): boolean {
  return card.territory !== null && props.state.territories[card.territory]?.owner === props.playerId
}

function toggle(card: Card) {
  if (selected.value.includes(card.id)) {
    selected.value = selected.value.filter((id) => id !== card.id)
  } else if (selected.value.length < SET_SIZE) {
    selected.value = [...selected.value, card.id]
  }
}

function trade() {
  if (offer.value !== null && props.canTrade) {
    emit('trade', offer.value.cardIds)
  }
}
</script>

<template>
  <section class="rounded-xl bg-ink/60 p-3">
    <button
      type="button"
      class="flex min-h-11 w-full items-center justify-between font-semibold"
      :disabled="forced"
      @click="open = !open"
    >
      <span>Mes cartes ({{ hand.length }})</span>
      <span v-if="!forced">{{ open ? '−' : '+' }}</span>
    </button>
    <div
      v-if="open || forced"
      class="mt-2 space-y-2"
    >
      <p
        v-if="forced"
        class="rounded-lg bg-danger/20 p-2 text-sm"
      >
        Vous devez échanger une série
      </p>
      <p
        v-if="hand.length === 0"
        class="text-sm text-parchment/70"
      >
        Aucune carte. Conquérez un territoire pour en piocher une en fin de tour.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="card in hand"
          :key="card.id"
          type="button"
          data-testid="card"
          class="flex min-h-14 flex-col items-start rounded-lg border-2 bg-panel-strong px-2 py-1 text-left"
          :class="selected.includes(card.id) ? 'border-accent' : 'border-transparent'"
          :aria-pressed="selected.includes(card.id) ? 'true' : 'false'"
          @click="toggle(card)"
        >
          <span class="text-sm font-semibold">{{ SYMBOL_LABELS[card.symbol] }}</span>
          <span class="text-xs text-parchment/80">{{ territoryName(card) }}</span>
          <span
            v-if="ownsTerritoryOf(card)"
            data-testid="bonus"
            class="text-xs text-accent"
          >+2 sur ce territoire</span>
        </button>
      </div>
      <button
        type="button"
        data-testid="trade"
        class="min-h-11 w-full rounded-lg bg-accent font-semibold text-ink disabled:opacity-40"
        :disabled="offer === null || !canTrade"
        @click="trade"
      >
        {{ offer === null ? 'Échanger' : `Échanger (+${offer.total})` }}
      </button>
    </div>
  </section>
</template>
