<script setup lang="ts">
defineProps<{
  label: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div
    data-testid="capital-panel"
    class="space-y-3 rounded-xl bg-ink/60 p-3"
  >
    <p class="font-semibold">
      {{ label }}
    </p>
    <p class="text-sm text-parchment/70">
      Ce choix est définitif et reste secret jusqu'à ce que tous les joueurs aient choisi.
    </p>
    <div class="flex gap-2">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg bg-accent font-semibold text-ink"
        @click="emit('confirm')"
      >
        Confirmer
      </button>
      <button
        type="button"
        class="min-h-11 rounded-lg px-3 text-parchment/80 hover:text-parchment"
        @click="emit('cancel')"
      >
        Annuler
      </button>
    </div>
  </div>
</template>
