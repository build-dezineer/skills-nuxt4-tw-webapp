---
name: cart-checkout
description: >-
  Web-app storefront cart and checkout: `useCartDrawer`, a Radix Dialog `CartDrawer`
  mounted once in the shell, a `CartButton` for header actions, a mock-payment checkout
  page and an order-confirmation page. Clears the cart on place-order. Use for the
  buying flow after commerce-core.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "commerce, checkout"
  stack: "nuxt4, vue3, tailwind4, radix-vue, lucide"
---

# Cart & Checkout Skill (web app storefront)

## When to use
The cart + checkout surface for a web-app storefront. Depends on the
[commerce-core skill](../commerce-core/SKILL.md) (`useCart`,
`useCartDrawer`).

**Frontend + mock data only — no backend, no real payment.** Checkout is UI that clears the cart and
shows a mock confirmation.

## Architecture

Generate FOUR files (`useCartDrawer` is provided by **`commerce-core`** — import it, don't recreate it):

| File | Purpose |
|------|---------|
| `app/components/features/shop/CartDrawer.vue` | Radix Dialog slide-in cart; **mount once in `default.vue`** |
| `app/components/features/shop/CartButton.vue` | Header cart button + count badge (add to `HeaderActions`) |
| `app/pages/checkout.vue` | Contact/shipping/mock-payment + order summary |
| `app/pages/order-confirmation.vue` | Mock success screen |

## `app/components/features/shop/CartDrawer.vue`

Radix `DialogRoot` bound to the shared state; slide/fade are CSS transitions keyed off Radix
`data-[state]`, so open/close stay symmetric (Radix keeps it mounted through the close transition).

```vue
<script setup lang="ts">
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogClose } from 'radix-vue'
import { X, Minus, Plus, ShoppingCart } from 'lucide-vue-next'
import { useCart } from '~/composables/useCart'
import { useCartDrawer } from '~/composables/useCartDrawer'

const cart = useCart()
const drawer = useCartDrawer()
function fmt(n: number, currency = 'USD') { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n) }
</script>

<template>
  <DialogRoot :open="drawer.isOpen.value" @update:open="(v) => (v ? drawer.open() : drawer.close())">
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
      <DialogContent class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card shadow-2xl data-[state=open]:animate-drawer-in-right data-[state=closed]:animate-drawer-out-right focus:outline-none">
        <div class="flex items-center justify-between border-b border-border px-5 py-4">
          <DialogTitle class="text-base font-semibold text-foreground">Cart ({{ cart.count.value }})</DialogTitle>
          <DialogClose class="p-1 text-muted-foreground hover:text-foreground" aria-label="Close"><X class="h-5 w-5" /></DialogClose>
        </div>

        <div v-if="cart.isEmpty.value" class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <ShoppingCart class="h-9 w-9 text-muted-foreground/50" />
          <p class="text-sm text-muted-foreground">Your cart is empty.</p>
          <DialogClose as-child><NuxtLink to="/shop" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">Browse catalog</NuxtLink></DialogClose>
        </div>

        <template v-else>
          <div class="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div v-for="line in cart.lines.value" :key="line.id" class="flex gap-3">
              <div class="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted"><img v-if="line.image" :src="line.image" :alt="line.name" class="h-full w-full object-cover" /></div>
              <div class="flex min-w-0 flex-1 flex-col">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0"><p class="truncate text-sm font-medium text-foreground">{{ line.name }}</p><p v-if="line.variantLabel" class="text-xs text-muted-foreground">{{ line.variantLabel }}</p></div>
                  <button class="text-muted-foreground hover:text-foreground" aria-label="Remove" @click="cart.remove(line.id)"><X class="h-4 w-4" /></button>
                </div>
                <div class="mt-auto flex items-center justify-between pt-2">
                  <div class="flex items-center rounded-lg border border-border">
                    <button class="p-1.5 text-foreground hover:text-primary" aria-label="Decrease" @click="cart.decrement(line.id)"><Minus class="h-3.5 w-3.5" /></button>
                    <span class="w-7 text-center text-sm tabular-nums text-foreground">{{ line.quantity }}</span>
                    <button class="p-1.5 text-foreground hover:text-primary" aria-label="Increase" @click="cart.increment(line.id)"><Plus class="h-3.5 w-3.5" /></button>
                  </div>
                  <span class="text-sm font-semibold tabular-nums text-foreground">{{ fmt(line.price * line.quantity, line.currency) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="border-t border-border px-5 py-4">
            <div class="mb-3 flex items-center justify-between"><span class="text-sm text-muted-foreground">Subtotal</span><span class="text-base font-semibold tabular-nums text-foreground">{{ fmt(cart.subtotal.value) }}</span></div>
            <DialogClose as-child><NuxtLink to="/checkout" class="block rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:brightness-110">Checkout</NuxtLink></DialogClose>
          </div>
        </template>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

## `app/components/features/shop/CartButton.vue`

```vue
<script setup lang="ts">
import { ShoppingCart } from 'lucide-vue-next'
import { useCart } from '~/composables/useCart'
import { useCartDrawer } from '~/composables/useCartDrawer'
const cart = useCart()
const drawer = useCartDrawer()
</script>

<template>
  <button class="relative rounded-lg p-2 text-foreground transition-colors hover:bg-muted" aria-label="Open cart" @click="drawer.open()">
    <ShoppingCart class="h-5 w-5" />
    <span v-if="cart.count.value > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground">{{ cart.count.value }}</span>
  </button>
</template>
```

## `app/pages/checkout.vue`
Renders in `layout: default`. Same logic as the storefront checkout: contact + shipping + **mock**
payment fields, a live order summary from `useCart()`, required-field validation, and on submit
`cart.clear()` + `router.push({ path: '/order-confirmation', query: { order } })` with a generated mock
order number. Include an honest "Demo checkout — no real payment" note. Guard the empty cart with a link
to `/shop`. Keep the standard checkout structure with app-shell spacing.

## `app/pages/order-confirmation.vue`
Renders in `layout: default`. Centered success card: check icon, "Thank you for your order", the mock
order number from `route.query.order`, "(Demo order — no payment processed.)", and a link back to `/shop`.

## Wiring
- `app/layouts/default.vue`: mount `<CartDrawer />` once.
- `app/components/layout/HeaderActions.vue`: add `<CartButton />` beside the theme toggle.

## Non-negotiables

1. **All cart reads/writes via `useCart()`**; drawer open state via `useCartDrawer()`. No local cart state.
2. **`CartDrawer` mounted once** in `default.vue`; **use Radix `DialogRoot`/`DialogContent`** with CSS
   **animations** from `main.css` (`data-[state=open]:animate-drawer-in-right`,
   `data-[state=closed]:animate-drawer-out-right`; overlay `animate-overlay-in`/`animate-overlay-out` —
   these utilities are pre-defined in `main.css`).
   Do NOT use `transition-*` and do NOT use tailwindcss-animate classes (`animate-in`, `fade-in-0`,
   `slide-in-from-right`): radix-vue's `Presence` only waits for CSS *animations* on exit, so a
   transition makes the drawer vanish instantly instead of sliding out. (You may instead reuse the
   scaffolded `~/components/shared/DrawerRoot.vue`, which already implements this correctly.) Never
   hand-roll a GSAP open/close timeline.
3. **No real payment** — mock fields + honest note; `placeOrder` clears the cart and routes to
   `/order-confirmation`.
4. Empty-cart guards on both the drawer and the checkout page.
5. Money via `Intl.NumberFormat` + `tabular-nums`; all colours via tokens.

## Colour & polish

- Step indicator: done / current / upcoming.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Clear primary-vs-secondary button hierarchy; visible disabled states.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
