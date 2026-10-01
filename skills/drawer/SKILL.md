---
name: drawer
description: >-
  Slide-in panels built on the pre-built `DrawerRoot` (Radix-Vue Dialog): right/left/bottom
  positions, sm/md/lg/full sizes, and a sticky header + scrollable body + footer
  structure. Includes feature drawers that own their form state, with a complete example.
  Use for add/edit records, detail views, settings and cart panels.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "overlay, drawer"
  stack: "nuxt4, vue3, tailwind4, radix-vue, lucide"
---

# Drawer Skill

## When to use
Slide-in panels for focused interactions: add/edit records, detail views, settings panels, filter sidebars, shopping carts, notifications, media previews. Use when the interaction is too complex for a modal dialog but the user should remain on the current page.

## Architecture (two-file pattern)

```
app/components/shared/DrawerRoot.vue   — reusable structural shell (Radix-Vue Dialog)
app/components/shared/UserDrawer.vue   — feature drawer, owns form + state, uses DrawerRoot
app/components/shared/FilterDrawer.vue — another feature drawer example
```

Pages call feature drawers (e.g. `<UserDrawer>`). Feature drawers use `<DrawerRoot>` for structure and own their content, form state, loading, and errors. Pages never talk to `DrawerRoot` directly.

---

## Positions + sizes

### Positions

| Position | Anchors to | Slides from | Use for |
|----------|-----------|-------------|---------|
| `right` (default) | `top-0 right-0 h-full` | Right edge | Add/edit forms, detail views |
| `left` | `top-0 left-0 h-full` | Left edge | Navigation panels, filter sidebars |
| `bottom` | `bottom-0 left-0 right-0` | Bottom edge | Mobile sheets, quick-action panels |

### Sizes (right + left drawers)

| Size | Class | Use for |
|------|-------|---------|
| `sm` | `max-w-xs` (320px) | Quick confirmations, single-field edits |
| `md` | `max-w-lg` (512px) — **default** | Standard add/edit forms |
| `lg` | `max-w-2xl` (672px) | Multi-section forms, rich detail views |
| `full` | `w-full` | Full-panel experiences, mobile-first sheets |

Bottom drawer uses `max-h-[85vh]` instead of height — it doesn't use the size prop.

---

## Animation utilities — already in `main.css`

Do NOT add keyframes and do NOT use tailwindcss-animate classes (`animate-in`, `fade-in-0`, `slide-in-from-*`) — they don't exist in this project. `main.css` pre-defines these utilities for Radix-Vue's `data-[state]` attributes:

```css
/* overlay */  animate-overlay-in, animate-overlay-out
/* panel  */  animate-drawer-in-right, animate-drawer-out-right
              animate-drawer-in-left,  animate-drawer-out-left
              animate-drawer-in-bottom, animate-drawer-out-bottom
```

---

## DrawerRoot.vue — complete implementation

### Props + emits

```ts
interface Props {
  open: boolean
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  position?: 'right' | 'left' | 'bottom'
}
defineEmits<{ close: [] }>()
```

### Complete script setup

```vue
<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogRoot, DialogPortal, DialogOverlay, DialogContent,
  DialogTitle, DialogClose,
} from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface Props {
  open: boolean
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  position?: 'right' | 'left' | 'bottom'
}
const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  position: 'right',
})
defineEmits<{ close: [] }>()

const sizeClass = computed(() => ({
  sm:   'max-w-xs',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  full: 'w-full',
}[props.size]))

const positionClass = computed(() => ({
  right:  'top-0 right-0 h-full',
  left:   'top-0 left-0 h-full',
  bottom: 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl',
}[props.position]))

const animationClass = computed(() => ({
  right:  'data-[state=open]:animate-drawer-in-right  data-[state=closed]:animate-drawer-out-right',
  left:   'data-[state=open]:animate-drawer-in-left   data-[state=closed]:animate-drawer-out-left',
  bottom: 'data-[state=open]:animate-drawer-in-bottom data-[state=closed]:animate-drawer-out-bottom',
}[props.position]))
</script>
```

### Complete template

```vue
<template>
  <DialogRoot :open="open" @update:open="v => !v && $emit('close')">
    <DialogPortal>

      <!-- Backdrop -->
      <DialogOverlay
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
               data-[state=open]:animate-overlay-in
               data-[state=closed]:animate-overlay-out"
      />

      <!-- Panel -->
      <DialogContent
        :class="cn(
          'fixed z-50 flex flex-col bg-card',
          positionClass,
          props.position !== 'bottom' ? sizeClass : '',
          animationClass,
        )"
        @pointer-down-outside="$emit('close')"
        @escape-key-down="$emit('close')"
      >
        <!-- Sticky header -->
        <div class="flex items-start justify-between shrink-0 gap-4 px-6 py-4 border-b border-border">
          <div class="min-w-0">
            <DialogTitle class="text-lg font-semibold text-foreground leading-tight">{{ title }}</DialogTitle>
            <p v-if="description" class="mt-0.5 text-sm text-muted-foreground">{{ description }}</p>
          </div>
          <DialogClose as-child>
            <button
              class="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground
                     transition-colors active:scale-95"
              @click="$emit('close')"
              aria-label="Close drawer"
            >
              <X class="w-4 h-4" />
            </button>
          </DialogClose>
        </div>

        <!-- Scrollable body (default slot) -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <slot />
        </div>

        <!-- Optional sticky footer (footer slot) -->
        <div v-if="$slots.footer" class="shrink-0 px-6 py-4 border-t border-border bg-card">
          <slot name="footer" />
        </div>

      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

---

## Feature drawer pattern — UserDrawer.vue example

Feature drawers are the public-facing components that pages use. They own form state, loading, and errors. They use `<DrawerRoot>` for structure.

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import DrawerRoot from '~/components/shared/DrawerRoot.vue'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

interface User { id: number; name: string; email: string; role: string }

interface Props {
  open: boolean
  user: User | null  // null = create mode, User = edit mode
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: []; saved: [] }>()

const form = ref({ name: '', email: '', role: '' })
const saving = ref(false)
const error = ref('')
const nameError = ref('')
const emailError = ref('')

// Reset form when switching between create / edit mode
watch(() => props.user, (u) => {
  form.value = u
    ? { name: u.name, email: u.email, role: u.role }
    : { name: '', email: '', role: '' }
  error.value = ''
  nameError.value = ''
  emailError.value = ''
}, { immediate: true })

function validate() {
  nameError.value = ''
  emailError.value = ''
  if (!form.value.name.trim()) nameError.value = 'Name is required'
  if (!form.value.email) emailError.value = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(form.value.email)) emailError.value = 'Enter a valid email'
  return !nameError.value && !emailError.value
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  error.value = ''
  try {
    // await api.post/put(...)
    emit('saved')
  } catch (e: any) {
    error.value = e.message ?? 'Something went wrong. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <DrawerRoot
    :open="open"
    :title="user ? 'Edit User' : 'Add User'"
    :description="user ? 'Update the user details below.' : 'Fill in the details to create a new user.'"
    size="md"
    position="right"
    @close="emit('close')"
  >
    <!-- Body -->
    <div class="space-y-5">
      <!-- Global error -->
      <div v-if="error" class="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
        <AlertCircle class="w-4 h-4 shrink-0" />
        {{ error }}
      </div>

      <!-- Name -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">Full name</label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Alice Johnson"
          :disabled="saving"
          class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{ 'border-destructive': nameError }"
        />
        <p v-if="nameError" class="text-sm text-destructive flex items-center gap-1">
          <AlertCircle class="w-3 h-3" />{{ nameError }}
        </p>
      </div>

      <!-- Email -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">Email</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="alice@example.com"
          :disabled="saving"
          class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{ 'border-destructive': emailError }"
        />
        <p v-if="emailError" class="text-sm text-destructive flex items-center gap-1">
          <AlertCircle class="w-3 h-3" />{{ emailError }}
        </p>
      </div>

      <!-- Role (native select) -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">Role</label>
        <select
          v-model="form.role"
          :disabled="saving"
          class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="" disabled>Select a role</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="client">Client</option>
        </select>
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          @click="emit('close')"
          :disabled="saving"
          class="px-4 py-2 rounded-lg border border-input text-sm text-muted-foreground
                 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          @click="handleSubmit"
          :disabled="saving"
          class="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
          {{ saving ? 'Saving…' : (user ? 'Save changes' : 'Create user') }}
        </button>
      </div>
    </template>
  </DrawerRoot>
</template>
```

---

## Page usage

Pages control open state and handle saved/deleted events. They never interact with `DrawerRoot` directly.

```vue
<script setup lang="ts">
import UserDrawer from '~/components/shared/UserDrawer.vue'

const drawerOpen = ref(false)
const editingUser = ref<User | null>(null)

function openCreate() { editingUser.value = null; drawerOpen.value = true }
function openEdit(u: User) { editingUser.value = u; drawerOpen.value = true }
function onSaved() { drawerOpen.value = false; /* refresh data */ }
</script>

<template>
  <button @click="openCreate">Add User</button>
  <UserDrawer
    :open="drawerOpen"
    :user="editingUser"
    @close="drawerOpen = false"
    @saved="onSaved"
  />
</template>
```

---

## Required imports

**DrawerRoot.vue:**
```ts
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
```

**Feature drawers:**
```ts
import DrawerRoot from '~/components/shared/DrawerRoot.vue'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
```

---

## Non-negotiables

1. `DrawerRoot.vue` MUST use Radix-Vue `DialogRoot`/`DialogContent` — never manual `v-show`, `onClickOutside`, or `addEventListener`
2. Backdrop MUST be `DialogOverlay` — never a plain `div` with a click handler
3. Animations use Radix-Vue `data-[state=open/closed]` attributes — never Vue `<Transition>` on the panel itself
4. Enter easing: `cubic-bezier(0.34,1.56,0.64,1)` (spring — `var(--ease-spring)`); Exit easing: `ease-in`, shorter duration
5. All six keyframes MUST be in `app/assets/css/main.css` inside `@guard:motion-system` — **never** in `<style scoped>`. Check if they already exist — do NOT duplicate.
6. Panel structure: `[sticky header] → [flex-1 overflow-y-auto body] → [optional sticky footer]` — the body scrolls, header and footer do not
7. Close triggers: X button click, backdrop click (`@pointer-down-outside`), Escape key (`@escape-key-down`)
8. Feature drawers MUST watch their record prop (`watch(() => props.user, ...)`) to reset form when switching create ↔ edit mode
9. Submit button shows `Loader2 animate-spin` during saving — all form fields `disabled`
10. Error banner: `bg-destructive/10 text-destructive` + `AlertCircle` icon — never hardcoded color
11. X close button always has `aria-label="Close drawer"`
12. `DrawerRoot.vue` accepts a `footer` named slot — rendered as a sticky bottom bar inside the panel
13. Both `DrawerRoot.vue` and feature drawers live in `app/components/shared/` and MUST be explicitly imported — no Nuxt auto-imports in SPA builds
14. `cn()` for all class assembly
15. SFC block order: `<script setup>` → `<template>` (no `<style scoped>` needed — keyframes live in `main.css`)

## Colour & polish

- Header accent bar in `primary`.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Slide easing via `--ease-spring`; overlay fade.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
