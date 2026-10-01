---
name: modal
description: >-
  Centered confirmation and detail dialogs using Radix-Vue Dialog, with overlay and
  panel animations driven by `data-[state]` attributes. Use for delete confirmations,
  focused detail views and short overlays that do not need a full drawer.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "overlay, modal"
  stack: "nuxt4, vue3, tailwind4, radix-vue, lucide"
---

# Modal / Dialog Skill

## When to use
Overlay dialogs for confirmations, detailed forms, image previews, or features requiring focused attention.

## Required imports
- Radix-Vue: `DialogRoot`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription`, `DialogClose`
- Icons: `X`, `AlertCircle`, `Loader2`

## Animations use Radix-Vue `data-[state]` attributes — never Vue `<Transition>` on the panel itself
Radix-Vue Dialog manages its own mount/unmount lifecycle via `DialogPortal`. Applying Vue `<Transition>` causes animation conflicts.

## Pattern
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'radix-vue'
import { X, AlertCircle, Loader2 } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

const isOpen = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

async function handleConfirm() {
  saving.value = true
  error.value = null
  try {
    // your async action
    isOpen.value = false
  } catch (e: any) {
    error.value = e.message || 'Something went wrong'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <DialogRoot v-model:open="isOpen">
    <DialogTrigger as-child>
      <button class="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm
                     hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150">
        Open Modal
      </button>
    </DialogTrigger>
    <DialogPortal>
      <!-- Overlay: independent fade with backdrop blur -->
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm
        data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />

      <!-- Content: fade + scale-up with spring easing; static centering -->
      <DialogContent
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50
               w-full bg-card text-card-foreground rounded-xl p-6 shadow-2xl
               data-[state=open]:animate-dialog-in data-[state=closed]:animate-dialog-out"
      >
        <!-- Header with title, description, close button -->
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="min-w-0">
            <DialogTitle class="text-lg font-semibold text-foreground">Title</DialogTitle>
            <DialogDescription v-if="false" class="mt-0.5 text-sm text-muted-foreground">Optional description</DialogDescription>
          </div>
          <DialogClose class="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors duration-150">
            <X class="h-4 w-4" />
          </DialogClose>
        </div>

        <!-- Error banner -->
        <div v-if="error" class="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <!-- Body slot -->
        <div class="space-y-4">
          <slot />
        </div>

        <!-- Footer: confirm + cancel -->
        <div class="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            class="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-foreground hover:bg-muted transition-all duration-150"
            :disabled="saving"
            @click="isOpen = false"
          >
            Cancel
          </button>
          <button
            class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            :disabled="saving"
            @click="handleConfirm"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            {{ saving ? 'Saving...' : 'Confirm' }}
          </button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

## Destructive confirm variant
For delete/destructive actions, change the confirm button to:
```diff
- bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30
+ bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:bg-destructive/90 hover:shadow-destructive/30
```

## CSS variable usage
- Overlay: `bg-black/50 backdrop-blur-sm`
- Content: `bg-card text-card-foreground rounded-xl shadow-2xl`
- Title: `text-foreground font-semibold` (use `DialogTitle` component)
- Close button: `text-muted-foreground hover:text-foreground`
- Error banner: `bg-destructive/10 text-destructive`
- Confirm button: `bg-primary text-primary-foreground shadow-primary/20`
- Destructive confirm: `bg-destructive text-destructive-foreground shadow-destructive/20`

## Size variants
| Size | Class | Max Width |
|------|-------|-----------|
| sm | `max-w-sm` | 384px |
| md | `max-w-md` | 448px |
| lg | `max-w-lg` | 512px |
| xl | `max-w-xl` | 576px |

## Non-negotiables
- Animations use Radix-Vue `data-[state]` attributes — NEVER Vue `<Transition>` on the dialog content
- Spring easing (cubic-bezier(0.34, 1.56, 0.64, 1)) on enter, shorter ease-in on exit
- Overlay must have independent fade animation (not wrapped with content)
- Confirm button must show `Loader2` + "Saving..." during async operations
- All form fields must be disabled during save
- Error messages: inline banner at top of body, not a toast
- `prefers-reduced-motion` is respected by main.css — no extra guard needed

## Colour & polish

- Destructive confirmations use `destructive`.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Backdrop blur; visible focus ring on the trapped element.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
