---
name: metric-card
description: >-
  KPI/stat cards using the pre-built, protected `MetricCard`: default, icon, sparkline,
  progress and hero variants with count-up animation and hover elevation already wired
  in. Covers grid composition and variant mixing. Use on any dashboard page that
  surfaces KPI numbers.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "data, metrics, dashboard"
  stack: "nuxt4, vue3, tailwind4, lucide"
---

# Metric Card Skill

## When to use

Any dashboard page that surfaces KPI numbers — user counts, revenue, uptime, signups, goal progress, etc.

## Use the pre-built component — do NOT reconstruct it

`MetricCard.vue` already exists in the scaffold at `app/components/shared/MetricCard.vue`,
fully implemented: count-up animation, hover elevation, and all five variants below are
already wired in. **Never recreate this file or hand-roll a parallel stat-card component** —
the build system rejects any attempt to overwrite it (it's protected). This skill and the
`chart` skill both document the same file — see the [chart skill](../chart/SKILL.md) for the full prop
reference, CSS-var color strategy, and usage example. This doc covers layout composition and
variant selection only.

## Quick decision

| SPEC.md describes… | Variant |
|---|---|
| Clean number + change vs. last period | `default` |
| Number + semantic icon (users, revenue, apps…) | `icon` |
| Number + mini trend chart over time | `sparkline` |
| Number + progress toward a target or quota | `progress` |
| The one KPI that should read as more important than the rest | `hero` |

Variants can be mixed within the same grid — e.g. one `hero` + two `icon` + one `sparkline` is a good, non-uniform layout. Don't make every card in a grid the same variant by default; a grid of 4-6 identical bordered boxes is exactly the flat, generic look to avoid.

## Composition — MetricCardGrid

A page-level wrapper composes `MetricCard` instances into a responsive grid. Wrap it in `.stagger-children` (see `dashboard-motion/SKILL.md`) so cards animate in with a staggered entrance instead of appearing all at once:

```vue
<script setup lang="ts">
import MetricCard from '~/components/shared/MetricCard.vue'
import { Users, DollarSign, Building2, Activity } from 'lucide-vue-next'
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
    <MetricCard
      label="Total Users"
      value="12,847"
      variant="hero"
      class="sm:col-span-2 xl:col-span-1"
      :icon="Users"
      icon-color="primary"
      :trend="{ value: 8.2, label: 'vs last month' }"
    />
    <MetricCard label="Revenue" value="$48.2k" variant="icon" :icon="DollarSign" icon-color="secondary" :trend="{ value: 3.1, label: 'vs last month' }" />
    <MetricCard label="Properties" value="18" variant="icon" :icon="Building2" icon-color="accent" :trend="{ value: -3.1, label: 'vs last month' }" />
    <MetricCard label="Conversion" value="18.4%" variant="sparkline" :spark-data="[210, 340, 290, 480, 390, 520, 460, 610]" :trend="{ value: 14.3 }" />
  </div>
</template>
```

## Variant notes

- **`hero`** — pass `class="sm:col-span-2 xl:col-span-1"` (or similar) on the instance itself to actually span extra grid columns; the component doesn't control its own grid placement, that's a normal Vue class-fallthrough onto its root element. Use for exactly one card per grid — the point is contrast with the rest, not a second uniform treatment.
  IMPORTANT: a `sm:col-span-2` leaks into every larger breakpoint. Always pair it with
  an explicit reset at the widest breakpoint (`xl:col-span-1`) or the last card in the
  row wraps onto its own line, leaving a lopsided grid and a large empty gap.
- **`icon-color`** — on a dashboard KPI row, give EVERY card a different categorical
  token: `chart-1`, `chart-2`, `chart-3`, `chart-4`. These render as solid, saturated
  tiles with a matching coloured glow — the colourful look a dashboard needs. Reserve
  `success`/`destructive` for cards whose meaning is genuinely good or bad. A row of
  identically-coloured tiles is a failed metrics row. Never hand-write tile colour
  classes — pass the token and let the component handle light/dark contrast.
- **`sparkline`** — `sparkData` must read as realistic (7–14 points, natural variation), never `[1, 2, 3, 4, 5]`.
- **`progress`** — `progress.current`/`progress.max` drive the fill percentage; `trend` is ignored for this variant (no delta chip).

## Non-negotiables

1. **Never recreate `MetricCard.vue`** — import and use it as-is.
2. Pass `value` as the already-formatted display string (`"$48.2k"`, `"18.4%"`, `"24"`) — the component parses the numeric part and counts up to it on mount automatically. Do not also wire a separate count-up call.
3. Mix variants within a grid — do not make every card in a page's metric row identical.
4. Wrap the grid in `.stagger-children` for entrance motion.
5. Alternate `icon-color` across `icon`/`hero` cards in the same grid.
6. `sparkData` must be realistic — never trivially increasing/linear placeholder data.
