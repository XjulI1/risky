<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { GameState } from '../../engine'
import { missionSummary } from '../../game/missionDisplay'

const props = defineProps<{
  state: GameState
}>()

const summary = computed(() => missionSummary(props.state))
const open = ref(false)

watch(
  () => summary.value?.holder.id,
  () => {
    open.value = false
  },
)
</script>

<template>
  <section
    v-if="summary"
    class="space-y-2"
  >
    <button
      type="button"
      data-testid="mission-button"
      class="min-h-11 w-full rounded-lg border border-parchment/40 font-semibold hover:bg-ink/60"
      :aria-expanded="open"
      @click="open = !open"
    >
      Ma mission
    </button>
    <div
      v-if="open"
      data-testid="mission-details"
      class="space-y-2 rounded-xl bg-ink/60 p-3"
    >
      <p class="font-semibold">
        {{ summary.text }}
      </p>
      <ul class="space-y-1 text-sm text-parchment/80">
        <li
          v-for="line in summary.progress"
          :key="line"
          class="tabular-nums"
        >
          {{ line }}
        </li>
      </ul>
    </div>
  </section>
</template>
