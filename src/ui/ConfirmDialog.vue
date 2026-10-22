<script setup lang="ts">
defineProps<{
  message: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70">
    <div
      role="dialog"
      class="w-80 space-y-5 rounded-2xl bg-panel-strong p-6 shadow-xl"
    >
      <p class="text-lg">
        {{ message }}
      </p>
      <div class="flex gap-2">
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg bg-danger font-semibold"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
        <button
          type="button"
          class="min-h-11 flex-1 rounded-lg bg-ink/60"
          @click="emit('cancel')"
        >
          Annuler
        </button>
      </div>
    </div>
  </div>
</template>
