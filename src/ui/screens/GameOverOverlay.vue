<script setup lang="ts">
import { ref } from 'vue'
import type { Player } from '../../engine'
import type { GameStatistics } from '../../game/history/statistics'
import StatisticsTab from './StatisticsTab.vue'

defineProps<{
  winner: Player
  players: Player[]
  statistics: GameStatistics
}>()

const emit = defineEmits<{
  replay: []
  home: []
}>()

type Tab = 'result' | 'statistics'

const tab = ref<Tab>('result')
const TABS: { id: Tab; label: string }[] = [
  { id: 'result', label: 'Résultat' },
  { id: 'statistics', label: 'Statistiques' },
]
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-center justify-center bg-ink/60 p-4">
    <div
      class="max-h-full space-y-6 overflow-y-auto rounded-2xl bg-panel-strong p-6 shadow-xl"
      :class="tab === 'statistics' ? 'w-full max-w-5xl' : 'w-96 text-center'"
    >
      <p
        class="text-3xl font-bold"
        :style="{ color: winner.color }"
      >
        {{ winner.name }} remporte la partie
      </p>
      <div
        role="tablist"
        class="flex gap-2"
        :class="tab === 'statistics' ? '' : 'justify-center'"
      >
        <button
          v-for="item in TABS"
          :key="item.id"
          type="button"
          role="tab"
          :aria-selected="tab === item.id"
          class="min-h-11 rounded-lg px-4 font-semibold"
          :class="tab === item.id ? 'bg-ink/60' : 'text-parchment/70 hover:text-parchment'"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </div>
      <StatisticsTab
        v-if="tab === 'statistics'"
        :statistics="statistics"
        :players="players"
        :winner="winner.id"
      />
      <div
        class="flex flex-col gap-2"
        :class="tab === 'statistics' ? 'sm:flex-row sm:justify-end' : ''"
      >
        <button
          type="button"
          class="min-h-12 rounded-xl bg-accent px-6 font-bold text-ink"
          @click="emit('replay')"
        >
          Rejouer avec les mêmes paramètres
        </button>
        <button
          type="button"
          class="min-h-12 rounded-xl bg-ink/60 px-6"
          @click="emit('home')"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  </div>
</template>
