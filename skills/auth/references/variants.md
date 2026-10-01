# Auth — Layout Variants

Read the section for the chosen variant before writing the page. The Minimal card
section includes a complete login page (script + template); the others list their
structural differences and code.

- Minimal card — centred card, `layout: auth`
- Split-screen — brand panel left, form right
- Full-bleed background — gradient or image background
- Multi-step wizard — step progress with slide-down transitions

## Variant 1 — Minimal card

The `auth.vue` layout already centers content. Render the card directly in the page slot.

### Complete login page (script + template)

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-vue-next'
import { cn } from '~/utils/cn'

definePageMeta({ layout: 'auth' })

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')
const emailError = ref('')
const passwordError = ref('')

function validate() {
  emailError.value = ''
  passwordError.value = ''
  if (!email.value) emailError.value = 'Email is required'
  else if (!/\S+@\S+\.\S+/.test(email.value)) emailError.value = 'Enter a valid email address'
  if (!password.value) passwordError.value = 'Password is required'
  return !emailError.value && !passwordError.value
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  error.value = ''
  try {
    // await useAuth().login({ email: email.value, password: password.value })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e.message ?? 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm auth-card">
    <div class="rounded-xl border border-border bg-card p-8 shadow-sm">
      <!-- Brand header -->
      <div class="mb-6 text-center">
        <img v-if="logoPath" :src="logoPath" class="h-8 w-auto mx-auto mb-4" :alt="projectName" />
        <h1 class="text-2xl font-semibold font-heading text-foreground">Welcome back</h1>
        <p class="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <!-- Error banner -->
      <div v-if="error" class="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
        <AlertCircle class="w-4 h-4 shrink-0" />
        {{ error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email -->
        <div class="space-y-1">
          <label class="text-sm font-medium text-foreground">Email</label>
          <input
            v-model="email" type="email" autocomplete="email"
            placeholder="you@example.com"
            class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
            :class="{ 'border-destructive': emailError }"
            :disabled="loading"
          />
          <p v-if="emailError" class="text-sm text-destructive flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />{{ emailError }}
          </p>
        </div>

        <!-- Password -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-foreground">Password</label>
            <NuxtLink to="/forgot-password" class="text-xs text-primary hover:underline">Forgot password?</NuxtLink>
          </div>
          <div class="relative">
            <input
              v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password"
              placeholder="••••••••"
              class="w-full px-3 py-2 pr-10 rounded-lg border border-input bg-background text-foreground text-sm
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              :class="{ 'border-destructive': passwordError }"
              :disabled="loading"
            />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              :aria-label="showPassword ? 'Hide password' : 'Show password'">
              <Eye v-if="!showPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="passwordError" class="text-sm text-destructive flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />{{ passwordError }}
          </p>
        </div>

        <!-- Remember me -->
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="rememberMe" type="checkbox" class="rounded border-border w-4 h-4" />
          <span class="text-sm text-muted-foreground">Remember me</span>
        </label>

        <!-- Submit -->
        <button type="submit" :disabled="loading"
          class="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                 hover:bg-primary/90 active:scale-[0.98] transition-all duration-150
                 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <!-- Register link -->
      <p class="mt-5 text-center text-sm text-muted-foreground">
        Don't have an account?
        <NuxtLink to="/register" class="text-primary hover:underline font-medium">Sign up</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  @keyframes card-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-card { animation: card-in 0.4s var(--ease-spring) both; }
}
</style>
```

---

## Variant 2 — Split-screen

Override the `auth` layout completely. Left half: brand panel. Right half: form card.

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Sun, Moon, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-vue-next'

definePageMeta({ layout: false })

// Reproduce theme toggle (layout: false means no auth.vue wrapper)
const darkMode = ref(false)
onMounted(() => { if (localStorage.getItem('theme') === 'dark') darkMode.value = true })
watch(darkMode, v => { document.documentElement.classList.toggle('dark', v); localStorage.setItem('theme', v ? 'dark' : 'light') })

// ... same form state as Variant 1
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Left: brand panel -->
    <div class="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white relative overflow-hidden">
      <!-- Background image: <img data-media-id>, never inline background-image (see media/SKILL.md) -->
      <img data-media-id="AuthBrandPanel" alt="" decoding="async" class="absolute inset-0 -z-10 h-full w-full object-cover" />
      <!-- Overlay for readability -->
      <div class="absolute inset-0 bg-primary/80" />
      <!-- Decorative shapes -->
      <div class="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2" />
      <div class="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/10 translate-x-1/3 translate-y-1/3" />
      <!-- Content -->
      <div class="relative text-center max-w-xs">
        <img v-if="logoPath" :src="logoPath" class="h-10 w-auto mx-auto mb-4" :alt="projectName" />
        <h2 class="text-3xl font-bold font-heading mb-4">Product Name</h2>
        <p class="text-lg leading-relaxed text-white/80">
          "The quote or tagline that captures the product's value. Brief and memorable."
        </p>
        <p class="mt-6 text-sm text-white/60">Join thousands of happy users</p>
      </div>
    </div>

    <!-- Right: form panel -->
    <div class="flex-1 flex items-center justify-center p-8 bg-background">
      <!-- Theme toggle -->
      <button class="fixed top-4 right-4 z-50 rounded-full p-2.5 bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors shadow-sm" @click="darkMode = !darkMode" :aria-label="darkMode ? 'Light mode' : 'Dark mode'">
        <Sun v-if="!darkMode" class="h-5 w-5" />
        <Moon v-else class="h-5 w-5" />
      </button>

      <div class="w-full max-w-sm">
        <div class="mb-8">
          <h1 class="text-2xl font-semibold font-heading text-foreground">Sign in</h1>
          <p class="mt-1.5 text-sm text-muted-foreground">Welcome back — enter your details below.</p>
        </div>
        <!-- error banner, form, secondary links — same as Variant 1 -->
      </div>
    </div>
  </div>
</template>
```

---

## Variant 3 — Full-bleed background

Override `auth` layout (`layout: false`). Background covers the full viewport; card floats over it.

Two background styles — choose based on SPEC.md:

**Gradient (brand colors):**
```vue
<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/15 via-background to-secondary/10">
```

**Image (photography or illustration):**
```vue
<div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
  <!-- <img data-media-id>, never inline background-image (see media/SKILL.md) -->
  <img data-media-id="AuthFullBleedBackground" alt="" decoding="async" class="absolute inset-0 -z-10 h-full w-full object-cover" />
  <div class="absolute inset-0 bg-black/50" />
  <!-- card goes inside, relative z-10 -->
</div>
```

Card surface over image: `bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl`
Card surface over gradient: `bg-card border border-border rounded-2xl shadow-xl`

```vue
<script setup lang="ts">
definePageMeta({ layout: false })
// + theme state (same as Split-screen)
// + form state
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 relative
              bg-gradient-to-br from-primary/15 via-background to-accent/10">
    <!-- Optional: bg image overlay -->
    <!-- <div class="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-15" /> -->

    <button class="fixed top-4 right-4 z-50 ..." @click="darkMode = !darkMode">...</button>

    <div class="relative z-10 w-full max-w-sm auth-card">
      <div class="rounded-2xl border border-border bg-card p-8 shadow-xl">
        <img v-if="logoPath" :src="logoPath" class="h-8 w-auto mx-auto mb-6" :alt="projectName" />
        <!-- same card content as Variant 1 -->
      </div>
    </div>
  </div>
</template>
```

---

## Variant 4 — Multi-step wizard

Uses `layout: 'auth'`. A single card manages multiple steps with animated transitions.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const steps = ['Account', 'Security', 'Verify', 'Done'] as const
const currentStep = ref(0)

const form = ref({ name: '', email: '', password: '', confirm: '' })
const otpValues = ref<string[]>(Array(6).fill(''))
const otpRefs = ref<HTMLInputElement[]>([])
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

// Strength, OTP handlers — same patterns as the shared fields in [fields.md](fields.md)

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    // await api call
    currentStep.value = steps.length - 1
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm">
    <div class="rounded-xl border border-border bg-card p-8 shadow-sm auth-card">

      <img v-if="logoPath" :src="logoPath" class="h-8 w-auto mx-auto mb-4" :alt="projectName" />

      <!-- Step progress indicator -->
      <div class="flex items-center justify-center gap-1.5 mb-6">
        <div v-for="(s, i) in steps.slice(0, -1)" :key="i"
          class="rounded-full transition-all duration-300"
          :class="i < currentStep ? 'w-6 h-1.5 bg-primary'
                : i === currentStep ? 'w-8 h-1.5 bg-primary'
                : 'w-3 h-1.5 bg-muted'"
        />
      </div>

      <!-- Step content — transitions between steps -->
      <Transition name="slide-down" mode="out-in">
        <div :key="currentStep">

          <!-- Step 0: Account info -->
          <div v-if="currentStep === 0" class="space-y-4">
            <div class="text-center mb-5">
              <h1 class="text-xl font-semibold font-heading text-foreground">Create your account</h1>
              <p class="text-sm text-muted-foreground mt-1">Start with your basic info</p>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground">Full name</label>
              <input v-model="form.name" type="text" placeholder="Alice Johnson" class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium text-foreground">Email</label>
              <input v-model="form.email" type="email" placeholder="you@example.com" class="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          </div>

          <!-- Step 1: Password -->
          <div v-else-if="currentStep === 1" class="space-y-4">
            <div class="text-center mb-5">
              <h2 class="text-xl font-semibold font-heading text-foreground">Secure your account</h2>
              <p class="text-sm text-muted-foreground mt-1">Choose a strong password</p>
            </div>
            <!-- password field with strength bar + confirm — see the shared patterns in [fields.md](fields.md) -->
          </div>

          <!-- Step 2: OTP verify -->
          <div v-else-if="currentStep === 2" class="space-y-4">
            <div class="text-center mb-5">
              <h2 class="text-xl font-semibold font-heading text-foreground">Verify your email</h2>
              <p class="text-sm text-muted-foreground mt-1">Enter the 6-digit code sent to <strong>{{ form.email }}</strong></p>
            </div>
            <!-- OTP inputs — see the shared patterns in [fields.md](fields.md) -->
            <p class="text-center text-xs text-muted-foreground">
              Didn't receive it?
              <button type="button" class="text-primary hover:underline">Resend code</button>
            </p>
          </div>

          <!-- Step 3: Done -->
          <div v-else class="text-center py-6">
            <CheckCircle class="w-14 h-14 text-success mx-auto mb-4" />
            <h2 class="text-xl font-semibold font-heading text-foreground">You're all set!</h2>
            <p class="text-sm text-muted-foreground mt-2 mb-6">Your account has been created.</p>
            <NuxtLink to="/" class="block w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium text-center hover:bg-primary/90 transition-colors">
              Go to dashboard
            </NuxtLink>
          </div>

        </div>
      </Transition>

      <!-- Navigation (Back / Continue) -->
      <div v-if="currentStep < steps.length - 1" class="flex items-center gap-3 mt-6">
        <button v-if="currentStep > 0" @click="currentStep--"
          class="flex-1 py-2.5 rounded-lg border border-input text-sm text-muted-foreground hover:bg-muted transition-colors">
          Back
        </button>
        <button
          @click="currentStep < steps.length - 2 ? currentStep++ : handleSubmit()"
          :disabled="loading"
          class="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60
                 flex items-center justify-center gap-2">
          <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
          {{ currentStep < steps.length - 2 ? 'Continue' : (loading ? 'Creating…' : 'Create account') }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  @keyframes card-in {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .auth-card { animation: card-in 0.4s var(--ease-spring) both; }
}
</style>
```

The step content transitions use the `slide-down` transition from `main.css` (`mode="out-in"` ensures clean in/out).

---

