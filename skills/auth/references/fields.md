# Auth — Shared Field Patterns

Read this file when writing any auth form's fields: text, email and password inputs,
field errors, password show/hide, the global error banner, the submit button, the
password strength bar, and 6-digit OTP inputs.

## Shared field patterns (all variants)

### Input
```vue
<input
  v-model="fieldValue"
  type="text"
  class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
  :class="{ 'border-destructive': fieldError }"
  :disabled="loading"
/>
```

### Field error
```vue
<p v-if="fieldError" class="mt-1 text-sm text-destructive flex items-center gap-1">
  <AlertCircle class="w-3 h-3 shrink-0" />
  {{ fieldError }}
</p>
```

### Password with show/hide toggle
```vue
<div class="relative">
  <input
    v-model="password"
    :type="showPassword ? 'text' : 'password'"
    class="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background text-foreground text-sm
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
    :class="{ 'border-destructive': passwordError }"
    :disabled="loading"
    autocomplete="current-password"
  />
  <button
    type="button"
    @click="showPassword = !showPassword"
    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
    :aria-label="showPassword ? 'Hide password' : 'Show password'"
  >
    <Eye v-if="!showPassword" class="w-4 h-4" />
    <EyeOff v-else class="w-4 h-4" />
  </button>
</div>
```

### Global error banner
```vue
<div v-if="error" class="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
  <AlertCircle class="w-4 h-4 shrink-0" />
  {{ error }}
</div>
```

### Submit button (full-width, with loading state)
```vue
<button
  type="submit"
  :disabled="loading"
  class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
         hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
         disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
>
  <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
  {{ loading ? 'Signing in…' : 'Sign in' }}
</button>
```

### Password strength bar (register only)
```vue
<!-- In script setup: -->
const strength = computed(() => {
  const p = password.value
  let s = 0
  if (p.length >= 8) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
})
const strengthLabel = computed(() => ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][strength.value])
const strengthBg = computed(() => ['bg-destructive', 'bg-destructive', 'bg-secondary', 'bg-primary', 'bg-success'][strength.value])

<!-- In template (below password input): -->
<div v-if="password" class="mt-2 space-y-1">
  <div class="flex gap-1">
    <div v-for="i in 4" :key="i"
      class="h-1 flex-1 rounded-full transition-colors duration-300"
      :class="strength >= i ? strengthBg : 'bg-muted'"
    />
  </div>
  <p class="text-xs text-muted-foreground">{{ strengthLabel }}</p>
</div>
```

### OTP — 6-digit individual inputs (MFA page)
```vue
<!-- Script: -->
const otpRefs = ref<HTMLInputElement[]>([])
const otpValues = ref<string[]>(Array(6).fill(''))

function onOtpInput(index: number, e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  otpValues.value[index] = val
  if (val && index < 5) otpRefs.value[index + 1]?.focus()
}
function onOtpBackspace(index: number, e: KeyboardEvent) {
  if (!otpValues.value[index] && index > 0) {
    otpValues.value[index - 1] = ''
    otpRefs.value[index - 1]?.focus()
  }
}
const otpCode = computed(() => otpValues.value.join(''))

<!-- Template: -->
<div class="flex gap-2 justify-center my-4">
  <input
    v-for="i in 6" :key="i"
    type="text" maxlength="1" inputmode="numeric"
    :value="otpValues[i - 1]"
    class="w-11 h-13 text-center text-xl font-mono rounded-lg border border-input
           bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
           transition-colors"
    :class="{ 'border-destructive': error }"
    @input="onOtpInput(i - 1, $event)"
    @keydown.backspace="onOtpBackspace(i - 1, $event)"
    :ref="el => { if (el instanceof HTMLInputElement) otpRefs[i - 1] = el }"
    :aria-label="`Digit ${i} of 6`"
  />
</div>
```

---

