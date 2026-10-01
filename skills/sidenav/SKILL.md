---
name: sidenav
description: >-
  Sidebar navigation for app layouts in four variants: collapsible (w-64/w-16), icon
  rail with Radix tooltips, floating elevated card, and always-fixed overlay. Handles
  role-based sections, `useRoute()` active state, mobile slide-in and NuxtLink routing.
  Use for any `layout: default` app shell.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "layout, navigation, sidebar"
  stack: "nuxt4, vue3, tailwind4, radix-vue, lucide"
---

# SideNav Skill

## When to use
When SPEC.md describes an application with sidebar navigation (uses `layout: 'default'`). Read the SPEC.md design brief and choose the variant that matches the product's personality. The output file is always `app/components/layout/SidebarNav.vue`, explicitly imported in `app/layouts/default.vue`.

## Quick decision

| SPEC.md describes... | Jump to |
|---|---|
| "icon-only", "compact", "minimal" | [Icon rail](references/variants.md#variant-2--icon-rail) |
| "floating", "elevated", "rounded edges" | [Floating](references/variants.md#variant-3--floating) |
| "overlay", "content-first", "no layout shift" | [Overlay](references/variants.md#variant-4--overlay) |
| Everything else (dense dashboard, power users) | [Collapsible](references/variants.md#variant-1--collapsible) |

Read [references/variants.md](references/variants.md) before writing — it carries the
complete script setup and template for the chosen variant. The props, structure and
shared patterns below apply to every variant.

## Four variants — choose based on SPEC.md

| Variant | Choose when SPEC.md describes… | Desktop behaviour | Mobile |
|---------|-------------------------------|-------------------|--------|
| **Collapsible** | Dense dashboard with many nav items, power users | `w-64` ↔ `w-16` toggle | Slide-in overlay |
| **Icon rail** | Minimalist tools, maximum content area | Permanently `w-16`, tooltips | Hamburger opens overlay |
| **Floating** | Premium / brand-forward app, elevated feel | `w-60 m-3 rounded-xl shadow-lg` | Slide-in overlay |
| **Overlay** | Content-first layout, no layout shift | Always `fixed`, slides over content on all viewports | Same as desktop |

### Sticky (when the Shell features list includes "Sticky sidebar")

When the wizard's shell features include `sidebar:sticky`, the sidebar stays pinned while the page content scrolls: on desktop give the panel its own scroll area instead of letting it scroll away with the page — e.g. `lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto` on the `<aside>` (with the collapse toggle pinned via `shrink-0`). Works with every variant in [references/variants.md](references/variants.md): a sticky Collapsible rail keeps the toggle visible and scrolls only the nav section; a sticky Overlay keeps the fixed panel; a sticky Icon rail/Floating behaves the same with their widths.

---

## Props + emits (all variants)

```ts
interface Props {
  logoPath?: string
  logomarkPath?: string
  projectName: string
  mobileOpen: boolean
  currentRole?: string | null
}
defineEmits<{ 'update:mobileOpen': [v: boolean] }>()
```

## Required imports (base)

```ts
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
// + all navigation icons for the page — validate every name against lucide-icons.txt
import { cn } from '~/utils/cn'
// Icon rail variant only: add from 'radix-vue':
// import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from 'radix-vue'
```

---

## Sidebar structure (top → bottom) — all variants

```
[Logo + collapse toggle header] shrink-0, border-b border-border
  [Logo / logomark]             left slot
  [Collapse toggle]             right slot, hidden lg:flex — Collapsible + Floating only
  [Mobile close (X)]            right slot, lg:hidden
[Nav sections]                  flex-1 overflow-y-auto py-4 space-y-0.5
  [Section label]               text-xs uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1
  [Nav items]
  [<hr class="border-border mx-4 my-2">]
  [Shared items — no v-if]      profile, settings
[userInfo card]                 shrink-0, border-t border-border — ONLY when SPEC.md requires it
```

## userInfo card (when SPEC.md requires it)

Used when the sidebar feature list includes "User info card (avatar + email) at bottom". Place it after the nav, at the bottom of the sidebar. This is a frontend-only app — use hardcoded demo values; no store or props needed.

```vue
<!-- userInfo card -->
<div class="border-t border-border p-3 shrink-0">
  <div class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors duration-150">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
      D
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-foreground leading-tight">Demo User</p>
      <p class="truncate text-xs text-muted-foreground leading-tight">demo@example.com</p>
    </div>
  </div>
</div>
```

Replace `D`, `Demo User`, and `demo@example.com` with values that fit the project (e.g. first initial of a persona name, a realistic name and email for the product's context).

If the spec's Image Prompts section includes an entry for the sidebar user (e.g.
`SidebarNav-userAvatar`), swap the initials circle for a real photo instead: replace the
`<div class="...rounded-full...">D</div>` with `<img data-media-id="{id}" decoding="async" alt="" class="h-8 w-8 rounded-full shrink-0 object-cover" />` — the pipeline injects `:src`. Otherwise the initials circle above is the correct default — do not invent a `data-media-id` that isn't in the spec.

**Collapsible variant:** hide the text block when collapsed, show only the avatar:
```vue
<div class="border-t border-border p-3 shrink-0">
  <div :class="cn('flex items-center rounded-lg hover:bg-muted transition-colors duration-150', collapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2 py-1.5')">
    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/20">
      D
    </div>
    <div v-if="!collapsed" class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-foreground leading-tight">Demo User</p>
      <p class="truncate text-xs text-muted-foreground leading-tight">demo@example.com</p>
    </div>
  </div>
</div>
```

## Active state detection

```ts
const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
```

## Nav item (standard — used in Collapsible, Floating, Overlay)

```vue
<NuxtLink
  :to="item.to"
  class="flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 my-0.5
         border-l-2 transition-colors duration-150"
  :class="isActive(item.to)
    ? 'border-primary bg-primary/5 text-primary font-medium'
    : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'"
>
  <component :is="item.icon" class="w-4 h-4 shrink-0" />
  <span class="truncate text-sm">{{ item.label }}</span>
</NuxtLink>
```

## Role-based sections

```vue
<!-- Single-role section: v-if required -->
<div v-if="currentRole === 'admin'">
  <p class="text-xs uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1">Admin</p>
  <NuxtLink v-for="item in adminNav" :key="item.to" ...>...</NuxtLink>
</div>

<!-- Shared section: no v-if (visible to all roles) -->
<div>
  <hr class="border-border mx-4 my-2" />
  <NuxtLink v-for="item in sharedNav" :key="item.to" ...>...</NuxtLink>
</div>
```

## Mobile close button (inside sidebar header — all non-Icon-Rail variants)

```vue
<button
  @click="$emit('update:mobileOpen', false)"
  class="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
  aria-label="Close navigation"
>
  <X class="w-5 h-5" />
</button>
```

---

## Non-negotiables

1. Active state MUST use `useRoute()` — never hardcode active route conditions
2. Active item: `border-l-2 border-primary bg-primary/5 text-primary font-medium` (except Icon Rail which uses `bg-primary text-primary-foreground`)
3. Inactive: `border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground`
4. ALL nav links use `<NuxtLink>` — never `<a href>`
5. Every icon imported from `lucide-vue-next` — validate ALL names against `app/assets/lucide-icons.txt`
6. Role-specific sections: `v-if="currentRole === 'slug'"`. Shared sections: no `v-if`
7. Mobile open: sidebar is `fixed inset-y-0 left-0 z-30` — above the backdrop (`z-20`) in `default.vue`
8. Sidebar background: `bg-sidebar` — matches the palette's `sidebar` token (SPEC.md → Palette → sidebar). NEVER `bg-background`
9. Nav list container: `flex-1 overflow-y-auto` — long nav lists scroll, never overflow
10. `cn()` for all class assembly — never raw string concatenation
11. Icon Rail MUST use Radix-Vue `TooltipRoot/TooltipContent` for labels — never title attributes or bare spans
12. Floating variant mobile: strip `m-3` and `rounded-xl` when `mobileOpen=true`
13. Overlay variant: the `default.vue` backdrop `lg:hidden` class MUST be removed so it shows on desktop too
14. SFC block order: `<script setup>` → `<template>` → `<style scoped>`
15. Always `aria-label="Main navigation"` on the `<nav>` element
16. `aria-label="Collapse sidebar"` / `"Expand sidebar"` on the collapse toggle — which lives in the **header row**, right-aligned next to the logo, never at the bottom of the sidebar.
17. Collapsed mode (w-16): remove `border-l-2` and `mx-2` from nav items. Icons must be centered via `justify-center px-0`. Active state becomes `bg-primary/10` background highlight instead of a left border.
18. **userInfo card**: when SPEC.md requires it, use hardcoded demo values (no store, no props). Use the Collapsible variant of the card when the sidebar has a collapse toggle. Place it after the nav, at the bottom of the sidebar.
19. **Logo header — logo and project name are mutually exclusive, NEVER both.** If `logoPath` (or `logomarkPath` when collapsed) is present, render ONLY the image — do not also render a `{{ projectName }}` text label next to it. Only fall back to the `{{ projectName }}` text label when no logo path is provided at all. Do not implement this as two independent `v-if`s (`v-if="logo && collapsed"` next to a separate `v-if="!collapsed"` text span) — that renders both at once. Use a single `v-if / v-else` (or `v-if / v-else-if / v-else`) chain so exactly one of image-or-text ever renders per state.
20. **Nav items are TOP-LEVEL routes only** — never dynamic `[id]` routes (e.g. `/projects/[id]`). Detail pages are reached from within pages, never from the sidebar. Build the nav EXACTLY from the "Sidebar nav" list in SPEC.md → Creative Direction — the labels and routes there are authoritative. Never invent, paraphrase, or derive routes from the page list.

## Colour & polish

- Active item uses the shell treatment's own `navActive` classes — never `bg-primary`.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Hover and active transitions at `--duration-fast`.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
