---
name: chart
description: >-
  Data visualization with Chart.js via the pre-built, protected `ChartWrapper`: line,
  bar and doughnut charts with loading/empty/error states and CSS-variable colours via
  `cssVar()`. Use on analytics, dashboard and reporting pages whenever data needs
  visual encoding beyond a table.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "data, charts, analytics"
  stack: "nuxt4, vue3, tailwind4, chart.js, lucide"
---

# Chart Skill

## When to use
Pages that display data trends, comparisons, or KPIs — analytics dashboards, reporting pages, metric overviews, financial summaries. Use when data needs visual encoding beyond a table.

## Use the pre-built components — do NOT reconstruct them

`ChartWrapper.vue` and `MetricCard.vue` already exist in the scaffold at
`app/components/shared/`, fully implemented, tested, and theme-reactive. **Never
recreate these files or write your own chart shell/metric card component** — the
build system will reject any attempt to overwrite them (they're protected). You
almost never touch Chart.js directly. Just render the components and pass data:

```vue
<script setup lang="ts">
import type { ChartData } from 'chart.js'
import ChartWrapper from '~/components/shared/ChartWrapper.vue'
import MetricCard from '~/components/shared/MetricCard.vue'
import { DollarSign, Users } from 'lucide-vue-next'
import { cssVar, cssVarAlpha } from '~/utils/chartColors'

const revenueData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Revenue',
    data: [12000, 19000, 15000, 22000, 18000, 28000],
    borderColor: cssVar('--primary'),
    backgroundColor: cssVarAlpha('--primary', 0.15),
    fill: true,
    tension: 0.4,
    pointRadius: 0,
    pointHoverRadius: 5,
  }],
}
</script>

<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <MetricCard label="Total Revenue" value="$42,800" variant="icon" :icon="DollarSign" icon-color="primary" :trend="{ value: 12.3, label: 'vs last month' }" />
    <MetricCard label="Active Users" value="1,284" variant="icon" :icon="Users" icon-color="secondary" :trend="{ value: 8.1, label: 'vs last week' }" />
  </div>

  <!-- The wrapping card div controls height (e.g. h-72) — ChartWrapper fills it. -->
  <div class="rounded-xl border border-border bg-card p-4 h-72">
    <ChartWrapper type="line" :data="revenueData" title="Revenue Trend" />
  </div>
</template>
```

## `ChartWrapper.vue` props

| Prop | Type | Notes |
|---|---|---|
| `type` | `'line' \| 'bar' \| 'doughnut'` | required |
| `data` | `ChartData` (from `chart.js`) | required — build with `cssVar()` for colors, see below |
| `options` | `ChartOptions` | optional — merged over sensible defaults |
| `title` | `string` | optional heading above the chart |
| `loading` / `error` | `boolean` / `string \| null` | drive the 4 built-in states |

**Height rule:** the wrapping card `<div>` controls the chart's height (e.g. `h-72`). `ChartWrapper` fills it internally. Never put `h-*` on `ChartWrapper` itself, and never wrap it in anything that removes its `h-full` sizing chain — that's exactly what makes a doughnut/pie chart overflow its container, which is why this component is now pre-built and protected rather than something each project reimplements slightly differently.

## `MetricCard.vue` props

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | required |
| `value` | `string \| number` | required — pass it formatted exactly as you want it to read (`"$48,250"`, `"18.4%"`, `"24"`). The component parses out the numeric part and **counts up to it on mount automatically** — you don't need a separate count-up prop or composable call. |
| `variant` | `'default' \| 'icon' \| 'sparkline' \| 'progress' \| 'hero'` | default `'default'`. Use `hero` for the one KPI that should read as more important than the rest of the grid (larger type, tinted surface) — pair it with a `class="md:col-span-2"` on the instance to actually span extra grid columns. |
| `icon` / `iconColor` | `Component` / `'primary' \| 'secondary' \| 'accent' \| 'success' \| 'destructive'` | `icon` variant only. Alternate `iconColor` across cards in a grid — never all `primary`. |
| `trend` | `{ value: number; label?: string }` | shown on `default`/`icon`/`sparkline`/`hero` |
| `sparkData` | `number[]` | `sparkline` variant — 7–14 points with realistic variation, never `[1,2,3,4,5]` |
| `progress` | `{ current: number; max: number; label?: string }` | `progress` variant |
| `loading` | `boolean` | shows a skeleton in place of content |

## CSS variable color strategy for chart `data` (non-negotiable)

Chart.js colors passed into `ChartWrapper`'s `data` prop MUST come from CSS variables extracted at runtime. Never use hardcoded hex, rgb, or hsl values.

```ts
import { cssVar, cssVarAlpha } from '~/utils/chartColors'
```

**Color mapping (raw tokens — no `--color-` prefix):**
| Chart element | Token |
|---|---|
| Primary dataset | `--primary` |
| Secondary dataset | `--secondary` |
| Accent dataset | `--accent` |

**Line/area fill:** `cssVarAlpha('--primary', 0.15)` for `backgroundColor` on line charts with `fill: true`.

**Bar fill:** `cssVar('--primary')` for single-series; rotate `['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']` for multi-series.

**Doughnut slices:** `[cssVar('--chart-1'), cssVar('--chart-2'), cssVar('--chart-3')]`.

`ChartWrapper` already handles grid/tick/legend/tooltip colors, dark-mode re-theming, and the loading/error/empty/data state machine internally — you only need to supply `data` in the shape above.

## Page usage pattern

```vue
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="rounded-xl border border-border bg-card p-4 h-72">
      <ChartWrapper type="line" :data="revenueData" title="Revenue Trend" />
    </div>
    <div class="rounded-xl border border-border bg-card p-4 h-72">
      <ChartWrapper type="doughnut" :data="pipelineData" title="Deal Stages" />
    </div>
  </div>
</template>
```

## Non-negotiables

1. **Never recreate `ChartWrapper.vue` or `MetricCard.vue`** — import and use them as-is. If a screen needs a chart/metric card they don't support, ask for a new variant rather than hand-rolling a parallel component.
2. All chart colors come from `cssVar()` / `cssVarAlpha()` imported from `~/utils/chartColors` — never hardcoded hex/rgb/hsl, and NEVER append an alpha suffix to a color string (`cssVar('--primary') + '20'`). Tokens are `hsl()` functions, not hex — concatenation produces an invalid color and Chart.js silently renders it BLACK. Use `cssVarAlpha(token, 0.15)` instead.
3. The wrapping `<div>` around `ChartWrapper` controls height (e.g. `h-72`) — never set a height on `ChartWrapper` itself
4. `MetricCard`'s `value` is the already-formatted display string — do not also wire a separate count-up; it's built in
5. Alternate `iconColor` across `MetricCard` instances in a grid — never all `primary`
6. `sparkData` must be realistic (7–14 points with natural variation) — never `[1, 2, 3, 4, 5]`
7. Wrap a card grid or table body in `.stagger-children` (see `dashboard-motion/SKILL.md`) for entrance motion — don't build a custom per-item animation
8. When two series differ in magnitude by more than ~10×, they MUST NOT share one axis —
   the smaller series flattens to zero and becomes invisible. Either give the second series
   its own axis with `yAxisID: 'y1'` plus a matching `scales.y1` entry
   (`position: 'right'`, `grid: { drawOnChartArea: false }`), or split them into two charts.
   Never ship a legend entry for a series the user cannot see.
