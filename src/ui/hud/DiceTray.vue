<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { GameEvent } from '../../engine'

type DiceRolled = Extract<GameEvent, { type: 'diceRolled' }>

const props = defineProps<{
  event: DiceRolled
  attackerColor: string
  defenderColor: string
  durationMs: number
}>()

const emit = defineEmits<{
  skip: []
}>()

const ROLLING_SHARE = 0.6
const PIP_CELLS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}
const CUBE_FACES = [1, 2, 3, 4, 5, 6]

const settled = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => {
    settled.value = true
  }, props.durationMs * ROLLING_SHARE)
})
onBeforeUnmount(() => clearTimeout(timer))

const pairs = computed(() => Math.min(props.event.attackerDice.length, props.event.defenderDice.length))

function bonusOf(index: number): number {
  return index === 0 ? props.event.defenderBonus : 0
}

function attackerLost(index: number): boolean {
  return index < pairs.value && (props.event.attackerDice[index] ?? 0) <= (props.event.defenderDice[index] ?? 0) + bonusOf(index)
}

function defenderLost(index: number): boolean {
  return index < pairs.value && !attackerLost(index)
}

const columns = computed(() =>
  Array.from({ length: Math.max(props.event.attackerDice.length, props.event.defenderDice.length) }, (_, index) => ({
    index,
    attacker: props.event.attackerDice[index],
    defender: props.event.defenderDice[index],
  })),
)
</script>

<template>
  <button
    type="button"
    class="absolute top-6 left-1/2 z-30 flex -translate-x-1/2 gap-4 rounded-2xl bg-panel px-6 py-4 shadow-xl"
    aria-label="Passer l'animation"
    @click="emit('skip')"
  >
    <div
      v-for="column in columns"
      :key="column.index"
      class="flex flex-col items-center gap-3"
    >
      <template
        v-for="side in (['attacker', 'defender'] as const)"
        :key="side"
      >
        <div
          v-if="column[side] !== undefined"
          class="die-slot"
          :class="{
            lost: settled && (side === 'attacker' ? attackerLost(column.index) : defenderLost(column.index)),
            unpaired: settled && column.index >= pairs,
          }"
        >
          <div
            v-if="!settled"
            class="cube"
            :style="{ animationDelay: `${column.index * 60}ms` }"
          >
            <div
              v-for="face in CUBE_FACES"
              :key="face"
              :class="['face', `face-${face}`]"
              :style="{ backgroundColor: side === 'attacker' ? attackerColor : defenderColor }"
            >
              <span
                v-for="cell in 9"
                :key="cell"
                class="pip"
                :class="{ visible: PIP_CELLS[face]?.includes(cell - 1) }"
              />
            </div>
          </div>
          <div
            v-else
            class="face flat"
            :data-testid="`die-${side}`"
            :data-value="column[side]"
            :style="{ backgroundColor: side === 'attacker' ? attackerColor : defenderColor }"
          >
            <span
              v-for="cell in 9"
              :key="cell"
              class="pip"
              :class="{ visible: PIP_CELLS[column[side] ?? 0]?.includes(cell - 1) }"
            />
          </div>
          <span
            v-if="settled && side === 'defender' && bonusOf(column.index) > 0"
            data-testid="die-bonus"
            class="bonus"
          >+{{ bonusOf(column.index) }}</span>
        </div>
      </template>
    </div>
  </button>
</template>

<style scoped>
.die-slot {
  position: relative;
  width: 48px;
  height: 48px;
  perspective: 300px;
  transition: opacity 200ms;
}

.bonus {
  position: absolute;
  top: -8px;
  right: -10px;
  z-index: 1;
  padding: 1px 6px;
  border-radius: 999px;
  background: #f4ead5;
  color: #1b2430;
  font: 800 13px/1.3 system-ui, sans-serif;
  box-shadow: 0 2px 6px rgb(0 0 0 / 0.4);
}

.die-slot.unpaired {
  opacity: 0.35;
}

.die-slot.lost::after {
  content: '✕';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 34px;
  font-weight: 900;
  text-shadow: 0 0 6px #000;
}

.cube {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  animation: tumble 420ms linear infinite;
}

.face {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 7px;
  border-radius: 9px;
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.35);
  backface-visibility: hidden;
}

.face.flat {
  box-shadow:
    inset 0 0 0 2px rgb(255 255 255 / 0.35),
    0 6px 14px rgb(0 0 0 / 0.4);
}

.face-1 {
  transform: translateZ(24px);
}
.face-6 {
  transform: rotateY(180deg) translateZ(24px);
}
.face-2 {
  transform: rotateY(90deg) translateZ(24px);
}
.face-5 {
  transform: rotateY(-90deg) translateZ(24px);
}
.face-3 {
  transform: rotateX(90deg) translateZ(24px);
}
.face-4 {
  transform: rotateX(-90deg) translateZ(24px);
}

.pip {
  width: 8px;
  height: 8px;
  place-self: center;
  border-radius: 999px;
}

.pip.visible {
  background: #fff;
}

@keyframes tumble {
  from {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(360deg) rotateY(720deg) rotateZ(180deg);
  }
}
</style>
