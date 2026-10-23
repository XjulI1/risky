<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Player, PlayerId } from '../../engine'
import { groupByTurn, type JournalEntry } from '../../game/history/journal'

const props = defineProps<{
  entries: JournalEntry[]
  players: Player[]
}>()

const PAGE_SIZE = 200
const EDGE_TOLERANCE_PX = 24

const open = ref(true)
const limit = ref(PAGE_SIZE)
const list = ref<HTMLElement | null>(null)
const following = ref(true)
const hasUnread = ref(false)
const expanded = ref(new Set<JournalEntry>())

const firstShown = computed(() => Math.max(0, props.entries.length - limit.value))
const groups = computed(() => groupByTurn(props.entries.slice(firstShown.value)))

const colorOf = (playerId: PlayerId) => props.players.find((player) => player.id === playerId)?.color ?? 'currentColor'

function isAtBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= EDGE_TOLERANCE_PX
}

function scrollToBottom() {
  if (list.value !== null) {
    list.value.scrollTop = list.value.scrollHeight
  }
  following.value = true
  hasUnread.value = false
}

async function loadEarlier(element: HTMLElement) {
  const previousHeight = element.scrollHeight
  limit.value += PAGE_SIZE
  await nextTick()
  element.scrollTop += element.scrollHeight - previousHeight
}

function onScroll() {
  const element = list.value
  if (element === null) {
    return
  }
  following.value = isAtBottom(element)
  if (following.value) {
    hasUnread.value = false
  }
  if (element.scrollTop <= EDGE_TOLERANCE_PX && firstShown.value > 0) {
    void loadEarlier(element)
  }
}

function toggleDetails(entry: JournalEntry) {
  if (!expanded.value.delete(entry)) {
    expanded.value.add(entry)
  }
}

async function toggleOpen() {
  open.value = !open.value
  if (open.value) {
    await nextTick()
    scrollToBottom()
  }
}

watch(
  () => props.entries.length,
  async () => {
    if (following.value) {
      await nextTick()
      scrollToBottom()
    } else {
      hasUnread.value = true
    }
  },
)
</script>

<template>
  <section
    data-testid="journal"
    class="rounded-xl bg-ink/60"
  >
    <button
      type="button"
      class="flex min-h-11 w-full items-center justify-between px-3 font-semibold"
      :aria-expanded="open"
      @click="toggleOpen"
    >
      <span>Journal</span>
      <span>{{ open ? '−' : '+' }}</span>
    </button>
    <div
      v-if="open"
      class="relative"
    >
      <ol
        ref="list"
        data-testid="journal-list"
        class="h-56 overflow-y-auto px-3 pb-3 text-sm"
        @scroll="onScroll"
      >
        <li
          v-for="(group, index) in groups"
          :key="`${group.turn}-${index}`"
        >
          <p
            v-if="group.header"
            data-testid="journal-header"
            class="sticky top-0 bg-panel-strong py-1 font-semibold"
            :style="{ color: colorOf(group.header.playerId) }"
          >
            {{ group.header.text }}
          </p>
          <p
            v-else-if="group.turn === 0"
            data-testid="journal-header"
            class="sticky top-0 bg-panel-strong py-1 font-semibold"
          >
            Mise en place
          </p>
          <ul class="space-y-1">
            <li
              v-for="(entry, entryIndex) in group.entries"
              :key="entryIndex"
              data-testid="journal-entry"
              class="border-l-4 pl-2"
              :style="{ borderColor: colorOf(entry.playerId) }"
            >
              <button
                v-if="entry.details.length > 0"
                type="button"
                class="text-left underline decoration-dotted underline-offset-2"
                :aria-expanded="expanded.has(entry)"
                @click="toggleDetails(entry)"
              >
                {{ entry.text }}
              </button>
              <span v-else>{{ entry.text }}</span>
              <ul
                v-if="expanded.has(entry)"
                class="mt-1 space-y-0.5 text-parchment/70"
              >
                <li
                  v-for="(detail, detailIndex) in entry.details"
                  :key="detailIndex"
                  data-testid="journal-roll"
                >
                  {{ detail }}
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ol>
      <button
        v-if="hasUnread"
        type="button"
        class="absolute bottom-2 left-1/2 min-h-9 -translate-x-1/2 rounded-full bg-accent px-3 text-sm font-semibold text-ink shadow"
        @click="scrollToBottom"
      >
        Nouvelles actions
      </button>
    </div>
  </section>
</template>
