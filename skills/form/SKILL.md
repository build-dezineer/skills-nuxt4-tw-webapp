---
name: form
description: >-
  Form patterns for webapp data entry: drawer-based add/edit forms built on the
  pre-built `DrawerRoot`, and inline forms for one-to-three field cases like login,
  settings and quick filters. Covers validation, error and loading states, and field
  layout. Use when building a form, settings panel, or CRUD flow.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "forms, input"
  stack: "nuxt4, vue3, tailwind4, radix-vue, lucide"
---

# Form Skill

## When to use
Pages with input forms — login, registration, settings, data entry, filters.

## Two form patterns
Choose based on context:

| Pattern | Use for | Don't use for |
|---------|---------|---------------|
| **Drawer** (recommended) | Add/edit records, multi-field forms, CRUD, forms that benefit from focused attention without leaving the page | Login, single-field edits, quick filters |
| **Inline** | Login, settings panels, quick filters, single-field edits, anything with 1-3 fields | Complex CRUD with 5+ fields requiring full attention |

A drawer uses the pre-generated `DrawerRoot.vue` from `~/components/shared/DrawerRoot.vue`. Never reconstruct the drawer shell manually — always compose it.

## Required imports
- **Radix-Vue:** `Input`, `Select`, `Checkbox`, `Switch`, `Textarea` — form controls
- **Shared component:** `DrawerRoot` from `~/components/shared/DrawerRoot.vue`
- **Icons:** `AlertCircle`, `Check`, `Eye`, `EyeOff`, `Loader2`, `X`

## States (non-negotiable)
Every form field MUST handle:
1. **Default** — empty or pre-filled with current value
2. **Focused** — ring color via `focus-visible:ring-ring`
3. **Error** — red border + error message below (`text-destructive text-sm`)
4. **Disabled** — `opacity-50 cursor-not-allowed` (for loading/submitted states)

Buttons MUST handle:
1. **Default** — interactive state
2. **Loading** — spinner icon + `pointer-events-none opacity-70`
3. **Disabled** — form invalid or already submitted

## Drawer form pattern (recommended for add/edit)

Use `DrawerRoot.vue` from `~/components/shared/DrawerRoot.vue`. It handles position, size, transitions, backdrop, escape key, and click-outside. You only provide the form content.

```vue
<script setup lang="ts">
import DrawerRoot from '~/components/shared/DrawerRoot.vue'
import { AlertCircle, Loader2 } from 'lucide-vue-next'

const formOpen = ref(false)
const saving = ref(false)
const error = ref('')

const formData = ref({ name: '', email: '', role: '' })

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    // submit logic
    formOpen.value = false
  } catch (e: any) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button
    class="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm
           hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
    @click="formOpen = true"
  >
    Add Record
  </button>

  <DrawerRoot :open="formOpen" title="Add Record" size="md" @close="formOpen = false">
    <!-- Error banner at top of body -->
    <div v-if="error" class="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4">
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <!-- Form fields with space-y between groups -->
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div v-for="field in formFields" :key="field.key" class="space-y-1.5">
        <label class="text-sm font-medium text-foreground">{{ field.label }}</label>
        <input
          v-model="formData[field.key as keyof typeof formData]"
          :type="field.type || 'text'"
          :class="[
            'w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
            field.error ? 'border-destructive' : '',
          ]"
          :disabled="saving"
          :placeholder="field.placeholder"
        />
        <p v-if="field.error" class="flex items-center gap-1 text-destructive text-sm">
          <AlertCircle class="h-3 w-3" />
          {{ field.error }}
        </p>
      </div>
    </form>

    <!-- Footer: Cancel + Save -->
    <template #footer>
      <button
        class="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-foreground hover:bg-muted transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="saving"
        @click="formOpen = false"
      >
        Cancel
      </button>
      <button
        class="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        :disabled="saving"
        @click="handleSubmit"
      >
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </template>
  </DrawerRoot>
</template>
```

Key improvements over manual drawer:
- Spring easing (cubic-bezier(0.34,1.56,0.64,1)) is built into DrawerRoot — no manual easing needed
- Exit animation is shorter (200ms) and uses ease-in — DrawerRoot handles this
- Color-matched shadows: `shadow-primary/20` on the save button
- Scale feedback: `hover:scale-[1.02] active:scale-[0.98]` on both trigger and save
- Error banner uses `bg-destructive/10` not `bg-muted`

## Inline form pattern (for simple cases)

Use for: login, registration, settings panels, search filters, single-field edits.

```vue
<script setup lang="ts">
const email = ref('')
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try { /* submit logic */ }
  catch (e: any) { error.value = e.message }
  finally { loading.value = false }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 max-w-md">
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-foreground">Email</label>
      <input
        v-model="email"
        type="email"
        class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        :class="{ 'border-destructive': error }"
        :disabled="loading"
      />
      <p v-if="error" class="flex items-center gap-1 text-destructive text-sm">
        <AlertCircle class="h-3 w-3" />
        {{ error }}
      </p>
    </div>
    <button
      type="submit"
      class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
             bg-primary text-primary-foreground font-medium text-sm
             shadow-lg shadow-primary/20 hover:bg-primary/90
             hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]
             transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      :disabled="loading"
    >
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      {{ loading ? 'Submitting...' : 'Submit' }}
    </button>
  </form>
</template>
```

## CSS variable usage
- Labels: `text-foreground font-medium`
- Inputs: `border-input bg-background text-foreground`, focus: `ring-ring`
- Errors: `text-destructive`, input border: `border-destructive`
- Buttons default: `bg-primary text-primary-foreground shadow-primary/20`
- Buttons disabled: `opacity-50 cursor-not-allowed`
- Drawer uses `DrawerRoot.vue` — refer to its documentation for drawer shell CSS
- Error banner: `bg-destructive/10` (NOT `bg-muted`)

## Non-negotiables
- Drawers MUST use `DrawerRoot.vue` from `~/components/shared/DrawerRoot.vue` — never reconstruct the drawer shell manually
- Save button shows `Loader2` spinner during submission, all fields disabled
- Overlay click closes drawer (DrawerRoot handles this)
- Same field state pattern applies: default, focused, error, disabled
- Same button state pattern applies: default, loading, disabled
- Spring easing (cubic-bezier(0.34,1.56,0.64,1)) on enter, shorter ease-in on exit — DrawerRoot handles this automatically
- Error banner: always use `bg-destructive/10 text-destructive` — never `bg-muted`
- Submit button: MUST have `hover:scale-[1.02] active:scale-[0.98]` for tactile feedback
- Submit button: MUST have color-matched shadow (`shadow-primary/20` or `shadow-destructive/20`)
- For the inline pattern, never use side effects — keep it form-in-page

## Colour & polish

- Focus-visible ring from `ring`; inline error text in `destructive`.
