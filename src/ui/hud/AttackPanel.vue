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
  <div class="space-y-3 rounded-xl bg-ink/60 p-3">
    <p class="font-semibold">
      {{ label }}
    </p>
    <p class="text-sm text-parchment/70">
      L'attaque se poursuit jusqu'à la conquête ou jusqu'à ce qu'il ne vous reste qu'une armée.
    </p>
    <div class="flex gap-2">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg bg-danger font-semibold text-parchment"
        @click="emit('confirm')"
      >
        Attaquer
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
