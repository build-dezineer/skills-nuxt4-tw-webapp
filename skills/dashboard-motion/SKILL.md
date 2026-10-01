---
name: dashboard-motion
description: >-
  The webapp motion toolkit: count-up numbers through `useCounter` (already wired into
  MetricCard) and the `.stagger-children` CSS utility for card-grid and table-row
  entrances. Dependency-free and reduced-motion safe. Use on dashboard, analytics and
  list screens.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "motion, dashboard"
  stack: "nuxt4, vue3, tailwind4"
---

# Dashboard Motion Skill

## When to use
Any webapp screen with numbers to count up (metric cards, KPIs) or a list/grid of cards/rows that should animate in on load (a metric row, a table body, a card grid). This is the ENTIRE motion toolkit for webapp screens — there is no GSAP, ScrollTrigger, Lenis, or scroll-driven animation here. A data-dense tool is not a scroll narrative; motion is a small, tasteful enhancement, not a centerpiece.


> **Never call `context.selector()`.** It only exists on a *scoped* context and is `undefined` on `gsap.matchMedia()` / `gsap.context(fn)`, where calling it throws. Query through the section’s template ref instead: `sectionRef.value?.querySelectorAll('.item') ?? []`.
> **Guard your refs before animating.** `sectionRef.value` can be null when `onMounted` runs; a tween with no targets fails silently and the section never animates. Start motion setup with `if (!sectionRef.value) return`.

## Use the pre-built primitives — do NOT reimplement them

`~/composables/useDashboardMotion.ts` already exists in the scaffold, fully implemented and
guarded. Do not hand-roll a count-up loop, a `requestAnimationFrame` tween, or your own
`IntersectionObserver`-based reveal — import what's there:

```ts
import { useCounter } from '~/composables/useDashboardMotion'
```

In practice you rarely call this directly — `MetricCard.vue` already wires it in internally
(see the [metric-card skill](../metric-card/SKILL.md)). Only reach for `useCounter` yourself if you're building a
one-off numeric display outside of `MetricCard`.

## Entrance stagger — `.stagger-children`

Put the class on the PARENT of a card grid, table `<tbody>`, or list — every direct child
animates in with an increasing delay automatically. One class is the whole API:

```vue
<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
  <MetricCard ... />
</div>
```

```vue
<tbody class="stagger-children">
  <tr v-for="row in rows" :key="row.id">...</tr>
</tbody>
```

Do NOT wire per-item `animation-delay` by hand, and do NOT add a template ref per row to
stagger manually — that's exactly the kind of per-item wiring `.stagger-children` exists to
replace. It caps automatically at 10 children (later ones share the last delay) so long lists
don't get a multi-second entrance.

## Count-up numbers

`MetricCard`'s `value` prop already counts up to itself on mount — pass the formatted string
you want (`"$48.2k"`, `"18.4%"`, `"24"`) and it animates automatically (see
the [metric-card skill](../metric-card/SKILL.md)). If you need a standalone counter outside `MetricCard`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useCounter } from '~/composables/useDashboardMotion'

const valueEl = ref<HTMLElement | null>(null)
useCounter(() => valueEl.value, 12847, { formatter: (v) => Math.round(v).toLocaleString() })
</script>

<template>
  <p ref="valueEl" class="text-2xl font-bold tabular-nums">0</p>
</template>
```

## Reduced motion

Both primitives already handle `prefers-reduced-motion` — `useCounter` writes the final
formatted value immediately with no animation, and `.stagger-children`'s keyframe is
neutralized by the global reduced-motion rule in `main.css`. You never need to check
`prefers-reduced-motion` yourself in webapp code.

## Do NOT

- Do NOT add `gsap`, `lenis`, `split-type`, `@vueuse/motion`, `swiper`, `three`, or `@tresjs/*`
  to `package.json` — this is a data tool, not a marketing site. None of these belong here.
- Do NOT use `ScrollTrigger`/scroll-pinning, parallax, a marquee/ticker, a custom cursor, or a
  full-page GSAP timeline — all of that is website-skill territory, not webapp.
- Do NOT build a custom entrance animation per component — use `.stagger-children`.
- Do NOT render a metric value as a static string — see `metric-card/SKILL.md`'s count-up rule.

## Non-negotiables

1. Never reimplement `useCounter` or hand-roll a count-up loop — import it.
2. Use `.stagger-children` on the parent, never per-item delays.
3. No motion library dependency beyond what's already in `package.json` (`@vueuse/core`).
4. No scroll-driven, pinned, or parallax effects anywhere in webapp code.

## Colour & polish

- `.stagger-children` on card grids and table bodies.
