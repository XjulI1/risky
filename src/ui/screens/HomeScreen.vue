<script setup lang="ts">
const emit = defineEmits<{
  create: []
}>()
</script>

<template>
  <main class="flex min-h-full flex-col items-center justify-center gap-10 p-6">
    <h1 class="text-6xl font-black tracking-wider">
      Risky
    </h1>
    <p class="text-parchment/70">
      Conquérez le monde, territoire par territoire.
    </p>
    <button
      type="button"
      class="min-h-12 rounded-xl bg-accent px-10 text-lg font-bold text-ink"
      @click="emit('create')"
    >
      Nouvelle partie
    </button>
  </main>
</template>
