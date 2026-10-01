---
name: auth
description: >-
  Authentication pages covering login, register, forgot/reset password, OTP/MFA and
  verify-email in four layouts: minimal card, split-screen, full-bleed background and
  multi-step wizard. Includes password strength, show/hide toggles, field errors and
  global error banners. Use when building auth or onboarding flows.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "auth, forms"
  stack: "nuxt4, vue3, tailwind4, lucide"
---

# Auth Skill

## When to use
Any page handling user authentication: login, register, forgot-password, reset-password, verify-email, OTP/MFA. Read SPEC.md to choose the right layout variant for the product's brand character.

## Quick decision

| SPEC.md describes... | Jump to |
|---|---|
| "clean", "simple", "functional", any SaaS | [Minimal card](references/variants.md#variant-1--minimal-card) |
| "marketing", "hero", "brand panel", "premium" | [Split-screen](references/variants.md#variant-2--split-screen) |
| "bold", "immersive", "lifestyle", "photography" | [Full-bleed](references/variants.md#variant-3--full-bleed-background) |
| "onboarding", "multi-step", "wizard" | [Multi-step](references/variants.md#variant-4--multi-step-wizard) |

Read [references/fields.md](references/fields.md) for the shared field patterns every variant
uses: inputs, field errors, password show/hide, global error banner, submit button,
password strength bar, and OTP inputs.

## Four layout variants

| Variant | Choose when SPEC.md describes… | Layout meta |
|---------|-------------------------------|-------------|
| **Minimal card** | Clean SaaS, functional, any general product | `layout: 'auth'` |
| **Split-screen** | Marketing-forward product, premium conversion feel | `layout: false` |
| **Full-bleed background** | Bold brand, visual product, lifestyle feel | `layout: false` |
| **Multi-step wizard** | Onboarding-heavy register, MFA flows, progressive disclosure | `layout: 'auth'` |

The `auth` layout (`layouts/auth.vue`) centers its slot content and shows a floating theme toggle. Variants that need full-viewport control use `layout: false` and reproduce the theme toggle manually.

---

## Auth page types

| Page | Route | Primary fields | Secondary links |
|------|-------|---------------|-----------------|
| Login | `/login` | email, password (show/hide), remember me | Forgot password, Register |
| Register | `/register` | name, email, password (strength bar), confirm password | Login |
| Forgot password | `/forgot-password` | email | Back to login |
| Reset password | `/reset-password` | new password, confirm password | — |
| OTP / MFA | `/mfa` | 6-digit code (individual inputs) | Resend code |
| Verify email | `/verify-email` | No form — success illustration + resend button | — |

---

## Required imports

| Symbol | Source |
|--------|--------|
| `AlertCircle`, `Eye`, `EyeOff`, `Loader2`, `Sun`, `Moon`, `CheckCircle` | `lucide-vue-next` |
| `ref`, `computed`, `onMounted`, `watch` | `vue` |
| `cn` | `~/utils/cn` |
| `NuxtLink` | `#components` |

Validate every icon against `app/assets/lucide-icons.txt`.

---

## Non-negotiables

1. **Standard auth pages** always use `definePageMeta({ layout: 'auth' })`. Split-screen and Full-bleed use `layout: false` and manually reproduce the theme toggle
2. Card surface: `bg-card border border-border rounded-xl shadow-sm` (Variant 1), `bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl` (Variant 3 over image)
3. Card max-width: `max-w-sm` (login, forgot, MFA) — `max-w-md` (register with more fields)
4. Submit button always **full-width** (`w-full`)
5. Submit button shows `Loader2 animate-spin` + disabled during loading — no double-submit
6. Global error banner: `bg-destructive/10 text-destructive` with `AlertCircle` — never hardcoded red
7. Field-level errors displayed BELOW the field — never only as border color
8. Password fields always have Eye/EyeOff toggle — never plain `type="password"` without it
9. Secondary navigation uses `<NuxtLink>` — never `<a href>`
10. OTP inputs: auto-advance on digit entry, auto-backspace to previous on delete
11. Card entrance animation always present (scoped `@keyframes card-in` with `prefers-reduced-motion` guard)
12. Multi-step uses `<Transition name="slide-down" mode="out-in">` for step changes
13. `<form @submit.prevent="handleSubmit">` — never bare button `@click` without a form wrapper
14. All icons from `lucide-vue-next`, validated against `lucide-icons.txt`
15. Dark mode state in Variants 2/3: always persist to `localStorage`, toggle `.dark` on `<html>`
16. SFC block order: `<script setup>` → `<template>` → `<style scoped>`

## Colour & polish

- Focus rings on every field; brand panel on split layouts.
