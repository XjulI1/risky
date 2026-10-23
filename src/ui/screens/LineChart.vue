<script setup lang="ts">
import { computed } from 'vue'
import { lineChartLayout, type ChartSeries } from './lineChart'

const props = defineProps<{
  title: string
  series: ChartSeries[]
  turns: number[]
}>()

const SIZE = { width: 480, height: 220, padding: { top: 12, right: 12, bottom: 28, left: 44 } }

const layout = computed(() => lineChartLayout(props.series, props.turns, SIZE))
</script>

<template>
  <figure class="min-w-0 space-y-2">
    <figcaption class="font-semibold">
      {{ title }}
    </figcaption>
    <svg
      :viewBox="`0 0 ${SIZE.width} ${SIZE.height}`"
      class="h-auto w-full"
      role="img"
      :aria-label="title"
    >
      <g class="text-parchment/60">
        <g
          v-for="tick in layout.yTicks"
          :key="`y${tick.value}`"
        >
          <line
            :x1="layout.plot.left"
            :x2="layout.plot.right"
            :y1="tick.position"
            :y2="tick.position"
            stroke="currentColor"
            stroke-opacity="0.25"
          />
          <text
            :x="layout.plot.left - 6"
            :y="tick.position"
            text-anchor="end"
            dominant-baseline="middle"
            fill="currentColor"
            font-size="12"
          >{{ tick.value }}</text>
        </g>
        <text
          v-for="tick in layout.xTicks"
          :key="`x${tick.value}`"
          :x="tick.position"
          :y="layout.plot.bottom + 18"
          text-anchor="middle"
          fill="currentColor"
          font-size="12"
        >{{ tick.value }}</text>
      </g>
      <path
        v-for="line in layout.lines"
        :key="line.id"
        :d="line.path"
        fill="none"
        :stroke="line.color"
        stroke-width="2.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
    <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      <li
        v-for="item in layout.legend"
        :key="item.id"
        class="flex items-center gap-2"
      >
        <span
          class="h-1 w-4 rounded-full"
          :style="{ backgroundColor: item.color }"
        />
        {{ item.label }}
      </li>
    </ul>
  </figure>
</template>
