/** One line of the chart, with a value per turn. */
export type ChartSeries = {
  id: string
  label: string
  color: string
  values: number[]
}

export type ChartSize = {
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
}

export type ChartTick = {
  value: number
  position: number
}

export type ChartLine = {
  id: string
  color: string
  points: [number, number][]
  path: string
}

/** Everything an SVG line chart needs, in the coordinates of its `viewBox`. */
export type ChartLayout = {
  plot: { left: number; top: number; right: number; bottom: number }
  xTicks: ChartTick[]
  yTicks: ChartTick[]
  lines: ChartLine[]
  legend: { id: string; label: string; color: string }[]
}

const TARGET_TICKS = 5
const NICE_STEPS = [1, 2, 5]

function niceStep(max: number): number {
  const rough = max / TARGET_TICKS
  for (let magnitude = 1; ; magnitude *= 10) {
    const step = NICE_STEPS.map((factor) => factor * magnitude).find((candidate) => candidate >= rough)
    if (step !== undefined) {
      return step
    }
  }
}

/** Whole, evenly spaced ticks from 0 up to `max` or the first multiple of the step above it. */
export function integerTicks(max: number): number[] {
  if (max <= 0) {
    return [0, 1]
  }
  const step = niceStep(max)
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step)
}

function turnTicks(turns: number[]): number[] {
  const first = turns[0] ?? 0
  const last = turns.at(-1) ?? first
  if (last - first < TARGET_TICKS) {
    return turns
  }
  const inner = integerTicks(last).filter((value) => value > first && value <= last)
  return [first, ...inner]
}

/** Lays out one line per series over `turns`, with the values from 0 at the bottom to the top tick at the top. */
export function lineChartLayout(series: ChartSeries[], turns: number[], size: ChartSize): ChartLayout {
  const plot = {
    left: size.padding.left,
    top: size.padding.top,
    right: size.width - size.padding.right,
    bottom: size.height - size.padding.bottom,
  }
  const first = turns[0] ?? 0
  const span = (turns.at(-1) ?? first) - first
  const yTickValues = integerTicks(Math.max(0, ...series.flatMap((line) => line.values)))
  const top = yTickValues.at(-1) ?? 1
  const x = (turn: number) =>
    span === 0 ? (plot.left + plot.right) / 2 : plot.left + ((turn - first) / span) * (plot.right - plot.left)
  const y = (value: number) => plot.bottom - (value / top) * (plot.bottom - plot.top)
  const round = (value: number) => Math.round(value * 100) / 100

  return {
    plot,
    xTicks: turnTicks(turns).map((value) => ({ value, position: round(x(value)) })),
    yTicks: yTickValues.map((value) => ({ value, position: round(y(value)) })),
    lines: series.map((line) => {
      const points = line.values.map((value, index): [number, number] => [round(x(turns[index] ?? first)), round(y(value))])
      return {
        id: line.id,
        color: line.color,
        points,
        path: points.map(([px, py], index) => `${index === 0 ? 'M' : 'L'}${px},${py}`).join(' '),
      }
    }),
    legend: series.map(({ id, label, color }) => ({ id, label, color })),
  }
}
