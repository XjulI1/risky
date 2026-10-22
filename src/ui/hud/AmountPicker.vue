<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title: string
  min: number
  max: number
  initial: number
  confirmLabel: string
  cancellable: boolean
}>()

const emit = defineEmits<{
  confirm: [amount: number]
  cancel: []
}>()

const amount = ref(Math.min(props.max, Math.max(props.min, props.initial)))

function change(delta: number) {
  amount.value = Math.min(props.max, Math.max(props.min, amount.value + delta))
}
</script>

<template>
  <div class="space-y-3 rounded-xl bg-ink/60 p-3">
    <p class="font-semibold">
      {{ title }}
    </p>
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="size-11 rounded-lg bg-panel-strong text-xl disabled:opacity-30"
        :disabled="amount <= min"
        aria-label="Moins"
        @click="change(-1)"
      >
        −
      </button>
      <span
        data-testid="amount"
        class="min-w-12 text-center text-2xl font-bold tabular-nums"
      >{{ amount }}</span>
      <button
        type="button"
        class="size-11 rounded-lg bg-panel-strong text-xl disabled:opacity-30"
        :disabled="amount >= max"
        aria-label="Plus"
        @click="change(1)"
      >
        +
      </button>
      <button
        type="button"
        class="min-h-11 rounded-lg bg-panel-strong px-3 disabled:opacity-30"
        :disabled="amount === max"
        @click="amount = max"
      >
        Tout ({{ max }})
      </button>
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg bg-accent font-semibold text-ink"
        @click="emit('confirm', amount)"
      >
        {{ confirmLabel }}
      </button>
      <button
        v-if="cancellable"
        type="button"
        class="min-h-11 rounded-lg px-3 text-parchment/80 hover:text-parchment"
        @click="emit('cancel')"
      >
        Annuler
      </button>
    </div>
  </div>
</template>
