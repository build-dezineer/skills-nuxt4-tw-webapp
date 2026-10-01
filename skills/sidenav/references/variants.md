# SideNav — Layout Variants

Read the section for the chosen variant before writing
`app/components/layout/SidebarNav.vue`. Each section carries the complete script
setup and template for that variant.

- Collapsible — `w-64` ↔ `w-16` toggle
- Icon rail — permanent `w-16` with Radix tooltips
- Floating — rounded, elevated card
- Overlay — always fixed, never pushes content

## Variant 1 — Collapsible

Most common. Desktop expands to show icon + label, collapses to icon-only. Mobile is a slide-in overlay.

### Script setup

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft, ChevronRight, X, LayoutDashboard, Users, Settings, User } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface Props {
  logoPath?: string
  logomarkPath?: string
  projectName: string
  mobileOpen: boolean
  currentRole?: string | null
}
const props = defineProps<Props>()
defineEmits<{ 'update:mobileOpen': [v: boolean] }>()

const route = useRoute()
const collapsed = ref(false)
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')

const sidebarClass = computed(() => cn(
  'flex flex-col bg-sidebar border-r border-border',
  'transition-all duration-200 ease-in-out z-30',
  // Desktop width
  collapsed.value ? 'lg:w-16' : 'lg:w-64',
  // Desktop: always visible via relative positioning
  'hidden lg:flex',
  // Mobile: fixed overlay, shown via mobileOpen
  'fixed lg:relative inset-y-0 left-0 w-64',
  props.mobileOpen ? 'flex translate-x-0' : '-translate-x-full lg:translate-x-0',
))
</script>
```

### Template

```vue
<template>
  <aside :class="sidebarClass">
    <!-- Header: logo + collapse toggle + mobile close -->
    <div :class="cn('flex items-center px-4 py-4 border-b border-border shrink-0',
                    collapsed ? 'lg:flex-col lg:gap-2 lg:px-0' : 'justify-between')">
      <div class="flex items-center gap-3 min-w-0">
        <!-- EXACTLY ONE of these two blocks renders. Do not merge them into one v-if. -->
        <!-- Expanded: show full logo or project name -->
        <template v-if="!collapsed">
          <img v-if="logoPath" :src="logoPath" class="h-7 w-auto shrink-0" :alt="projectName" />
          <span v-else class="font-semibold text-foreground truncate text-sm">{{ projectName }}</span>
        </template>
        <!-- Collapsed: show logomark or project initial -->
        <template v-else>
          <img v-if="logomarkPath" :src="logomarkPath" class="h-6 w-auto shrink-0" :alt="projectName" />
          <span v-else class="font-semibold text-foreground text-sm mx-auto">{{ projectName.charAt(0).toUpperCase() }}</span>
        </template>
      </div>
      <!-- Collapse toggle (desktop only) — sits in the header, not the footer -->
      <button
        @click="collapsed = !collapsed"
        class="hidden lg:flex items-center justify-center p-1.5 rounded-lg shrink-0
               text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <ChevronLeft v-if="!collapsed" class="w-4 h-4" />
        <ChevronRight v-else class="w-4 h-4" />
      </button>
      <button
        @click="$emit('update:mobileOpen', false)"
        class="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Close navigation"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3" aria-label="Main navigation">
      <!-- Role: Admin -->
      <div v-if="currentRole === 'admin'">
        <p :class="cn('text-xs uppercase tracking-wider text-muted-foreground px-4 pt-3 pb-1 transition-all duration-200', collapsed && 'lg:opacity-0 lg:h-0 lg:overflow-hidden lg:py-0')">
          Admin
        </p>
        <NuxtLink
          v-for="item in adminNav" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 border-l-2 transition-colors duration-150"
          :class="isActive(item.to) ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'"
        >
          <component :is="item.icon" class="w-4 h-4 shrink-0" />
          <span :class="cn('truncate text-sm transition-all duration-200', collapsed && 'lg:opacity-0 lg:w-0 lg:overflow-hidden')">
            {{ item.label }}
          </span>
        </NuxtLink>
      </div>

      <!-- Shared items -->
      <hr class="border-border mx-4 my-2" />
      <NuxtLink
        v-for="item in sharedNav" :key="item.to" :to="item.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg mx-2 border-l-2 transition-colors duration-150"
        :class="isActive(item.to) ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'"
      >
        <component :is="item.icon" class="w-4 h-4 shrink-0" />
        <span :class="cn('truncate text-sm transition-all duration-200', collapsed && 'lg:opacity-0 lg:w-0 lg:overflow-hidden')">
          {{ item.label }}
        </span>
      </NuxtLink>
    </nav>
  </aside>
</template>
```

---

## Variant 2 — Icon rail

Permanently narrow (`w-16`). No collapse toggle. Labels revealed via Radix-Vue Tooltip on hover.

### Additional import

```ts
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from 'radix-vue'
// Remove ChevronLeft, ChevronRight — not needed
```

### Script setup

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from 'radix-vue'
import { X, LayoutDashboard, Users, Settings, User } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface Props {
  logoPath?: string
  logomarkPath?: string
  projectName: string
  mobileOpen: boolean
  currentRole?: string | null
}
const props = defineProps<Props>()
defineEmits<{ 'update:mobileOpen': [v: boolean] }>()

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>
```

### Template

```vue
<template>
  <aside :class="cn(
    'w-16 flex flex-col bg-sidebar border-r border-border z-30',
    'hidden lg:flex',
    'fixed lg:relative inset-y-0 left-0',
    mobileOpen ? 'flex w-64' : '-translate-x-full lg:translate-x-0 lg:w-16',
    'transition-all duration-200',
  )">
    <!-- Logo -->
    <div class="flex items-center justify-center py-4 border-b border-border shrink-0">
      <img v-if="logomarkPath" :src="logomarkPath" class="h-6 w-auto shrink-0" :alt="projectName" />
      <span v-else-if="logoPath" class="font-semibold text-foreground text-xs">{{ projectName.charAt(0).toUpperCase() }}</span>
    </div>

    <!-- Nav with tooltips -->
    <nav class="flex-1 overflow-y-auto py-3 flex flex-col items-center gap-1" aria-label="Main navigation">
      <TooltipProvider :delay-duration="200">

        <!-- Role: Admin -->
        <template v-if="currentRole === 'admin'">
          <TooltipRoot v-for="item in adminNav" :key="item.to">
            <TooltipTrigger as-child>
              <NuxtLink
                :to="item.to"
                class="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:scale-[1.05] active:scale-[0.95]"
                :class="isActive(item.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
                :aria-label="item.label"
              >
                <component :is="item.icon" class="w-4 h-4" />
              </NuxtLink>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              class="z-50 px-2.5 py-1.5 text-sm font-medium bg-popover text-popover-foreground rounded-lg shadow-md border border-border"
            >
              {{ item.label }}
            </TooltipContent>
          </TooltipRoot>
        </template>

        <hr class="w-8 border-border my-1" />

        <!-- Shared items -->
        <TooltipRoot v-for="item in sharedNav" :key="item.to">
          <TooltipTrigger as-child>
            <NuxtLink
              :to="item.to"
              class="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:scale-[1.05] active:scale-[0.95]"
              :class="isActive(item.to) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'"
              :aria-label="item.label"
            >
              <component :is="item.icon" class="w-4 h-4" />
            </NuxtLink>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            class="z-50 px-2.5 py-1.5 text-sm font-medium bg-popover text-popover-foreground rounded-lg shadow-md border border-border"
          >
            {{ item.label }}
          </TooltipContent>
        </TooltipRoot>

      </TooltipProvider>
    </nav>
  </aside>
</template>
```

---

## Variant 3 — Floating

Sidebar has rounded corners, shadow, and margin — appears elevated off the page edge. Can optionally combine with the Collapsible collapse toggle.

### Key differences
- Root element has `m-3 h-[calc(100vh-1.5rem)] rounded-xl shadow-lg` instead of flush edges
- `border border-border` instead of `border-r border-border`
- Main layout wrapper in `default.vue` needs `bg-muted/30` or similar to show the gap

### Script setup

Identical to Collapsible (collapsed ref optional; remove if floating-only).

### Root class

```ts
const sidebarClass = computed(() => cn(
  'flex flex-col bg-sidebar border border-border rounded-xl shadow-lg',
  'm-3 h-[calc(100vh-1.5rem)]',
  'transition-all duration-200 ease-in-out z-30',
  collapsed.value ? 'lg:w-16' : 'lg:w-60',
  'hidden lg:flex',
  'fixed lg:relative inset-y-0 left-0 w-60',
  props.mobileOpen ? 'flex translate-x-0 m-0 rounded-none h-full' : '-translate-x-full lg:translate-x-0',
))
```

On mobile when open, strip margin and border-radius so it fills the edge properly:
- `mobileOpen ? 'm-0 rounded-none h-full' : 'm-3 h-[calc(100vh-1.5rem)] rounded-xl'`

Nav items use `rounded-md` (not `rounded-lg`) for a slightly tighter feel inside the rounded container.

---

## Variant 4 — Overlay

Sidebar is **always fixed** — never relative. Never pushes content. A hamburger button in the header controls it on all viewport sizes.

### Key difference for `default.vue`
The backdrop in `default.vue` must show on ALL viewports (remove `lg:hidden`):
```vue
<!-- In default.vue — change from lg:hidden to always show for overlay variant -->
<div v-if="mobileOpen" class="fixed inset-0 z-20 bg-black/40" @click="mobileOpen = false" />
```

### Script setup

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { X, LayoutDashboard, Users, Settings, User } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface Props {
  logoPath?: string
  logomarkPath?: string
  projectName: string
  mobileOpen: boolean
  currentRole?: string | null
}
const props = defineProps<Props>()
defineEmits<{ 'update:mobileOpen': [v: boolean] }>()

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')

const sidebarClass = computed(() => cn(
  'hidden lg:flex',
  'fixed lg:relative inset-y-0 left-0 z-30 w-72 flex flex-col',
  'bg-sidebar border-r border-border shadow-xl',
  'transition-transform duration-300 ease-in-out',
  props.mobileOpen ? 'flex translate-x-0' : '-translate-x-full lg:translate-x-0',
))
</script>
```

Template is identical to Collapsible variant but without the collapse toggle button and without desktop width toggling. The sidebar is permanently `w-72`.

---

