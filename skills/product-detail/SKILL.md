---
name: product-detail
description: >-
  Web-app storefront product detail page at `app/pages/products/[slug].vue`: gallery,
  variant/option selection, quantity, add-to-cart and related products, rendering in the
  sidebar shell and reusing the catalog's `ProductCard`. Use when a storefront needs
  product pages.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "commerce, product"
  stack: "nuxt4, vue3, tailwind4, lucide"
---

# Product Detail Skill (web app storefront)

## When to use
The product detail page inside a web-app storefront, at the dynamic route `/products/[slug]`. Renders in
the sidebar shell (`layout: default`). Depends on the [commerce-core skill](../commerce-core/SKILL.md) (`useProducts`, `useCart`,
`useCartDrawer`), and reuses `ProductCard` from the [product-catalog skill](../product-catalog/SKILL.md) for related.

## Architecture

Generate ONE page (keep the literal bracket — it is the dynamic route):

| File | Purpose |
|------|---------|
| `app/pages/products/[slug].vue` | Gallery + variant selection + add-to-cart + related |

## `app/pages/products/[slug].vue`

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from '#imports'
import { Minus, Plus, ShoppingCart } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
import { useProducts } from '~/composables/useProducts'
import { useCart } from '~/composables/useCart'
import { useCartDrawer } from '~/composables/useCartDrawer'
import ProductCard from '~/components/features/shop/ProductCard.vue'
import type { ProductVariant } from '~/types/commerce'

definePageMeta({ layout: 'default' })

const route = useRoute()
const { getBySlug, related, loading } = useProducts()
const cart = useCart()
const drawer = useCartDrawer()

const product = computed(() => getBySlug(String(route.params.slug)))
const notFound = computed(() => !loading.value && !product.value)

const selected = ref<Record<string, string>>({})
watch(product, (p) => {
  if (!p) return
  const next: Record<string, string> = {}
  for (const opt of p.options ?? []) next[opt.name] = opt.values[0]?.value ?? ''
  selected.value = next
}, { immediate: true })

const hasVariants = computed(() => (product.value?.variants?.length ?? 0) > 0)
const selectedVariant = computed<ProductVariant | undefined>(() =>
  product.value?.variants?.find((v) => Object.entries(v.options).every(([k, val]) => selected.value[k] === val)))
const price = computed(() => selectedVariant.value?.price ?? product.value?.price ?? 0)
const inStock = computed(() => hasVariants.value ? (selectedVariant.value?.inStock !== false && !!selectedVariant.value) : product.value?.inStock !== false)
const canAdd = computed(() => !!product.value && inStock.value && (!hasVariants.value || !!selectedVariant.value))

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: product.value?.currency ?? 'USD' }).format(n)
}

const activeImage = ref(0)
const mainImage = computed(() => selectedVariant.value?.image ?? product.value?.images?.[activeImage.value] ?? product.value?.images?.[0])
const qty = ref(1)
function addToCart() {
  if (!product.value || !canAdd.value) return
  cart.add(product.value, selectedVariant.value, qty.value)
  drawer.open()
}
const relatedItems = computed(() => related(product.value, 4))
</script>

<template>
  <div class="py-6">
    <!-- loading -->
    <div v-if="loading && !product" class="grid animate-pulse gap-8 md:grid-cols-2">
      <div class="aspect-square rounded-xl bg-muted" />
      <div class="space-y-4"><div class="h-7 w-2/3 rounded bg-muted" /><div class="h-5 w-1/4 rounded bg-muted" /><div class="h-20 rounded bg-muted" /></div>
    </div>

    <!-- not found -->
    <div v-else-if="notFound" class="py-24 text-center">
      <h1 class="text-2xl font-bold text-foreground">Product not found</h1>
      <NuxtLink to="/shop" class="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">Back to catalog</NuxtLink>
    </div>

    <!-- product -->
    <div v-else-if="product">
      <nav class="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <NuxtLink to="/shop" class="hover:text-foreground">Catalog</NuxtLink><span>/</span><span class="text-foreground">{{ product.name }}</span>
      </nav>

      <div class="grid gap-8 md:grid-cols-2">
        <div class="flex flex-col gap-3">
          <div class="aspect-square overflow-hidden rounded-xl border border-border bg-muted">
            <img :src="mainImage" :alt="product.name" class="h-full w-full object-cover" />
          </div>
          <div v-if="(product.images?.length ?? 0) > 1" class="flex gap-2">
            <button v-for="(img, i) in product.images" :key="img" :class="cn('aspect-square w-16 overflow-hidden rounded-lg border-2', activeImage === i ? 'border-foreground' : 'border-transparent hover:border-border')" @click="activeImage = i">
              <img :src="img" :alt="`${product.name} ${i + 1}`" class="h-full w-full object-cover" />
            </button>
          </div>
        </div>

        <div>
          <p v-if="product.category" class="mb-1 text-xs font-medium uppercase tracking-wide text-primary">{{ product.category }}</p>
          <h1 class="text-2xl font-bold text-foreground">{{ product.name }}</h1>
          <div class="mt-3 text-xl font-semibold tabular-nums text-foreground">{{ fmt(price) }}</div>
          <p v-if="product.description" class="mt-4 text-sm leading-relaxed text-muted-foreground">{{ product.description }}</p>

          <div v-for="opt in product.options ?? []" :key="opt.name" class="mt-6">
            <div class="mb-2 text-sm font-medium text-foreground">{{ opt.name }}</div>
            <div class="flex flex-wrap gap-2">
              <button v-for="val in opt.values" :key="val.value" :class="cn('rounded-lg border px-3 py-1.5 text-sm', selected[opt.name] === val.value ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:border-foreground')" @click="selected[opt.name] = val.value">
                <span v-if="val.swatch" class="mr-1.5 inline-block h-3 w-3 rounded-full align-middle" :style="{ backgroundColor: val.swatch }" />{{ val.label }}
              </button>
            </div>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <div class="flex items-center rounded-lg border border-border">
              <button class="p-2.5 text-foreground hover:text-primary disabled:opacity-40" :disabled="qty <= 1" aria-label="Decrease" @click="qty = Math.max(1, qty - 1)"><Minus class="h-4 w-4" /></button>
              <span class="w-9 text-center text-sm tabular-nums text-foreground">{{ qty }}</span>
              <button class="p-2.5 text-foreground hover:text-primary" aria-label="Increase" @click="qty += 1"><Plus class="h-4 w-4" /></button>
            </div>
            <button :disabled="!canAdd" :class="cn('flex flex-1 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all', canAdd ? 'bg-primary text-primary-foreground hover:brightness-110' : 'cursor-not-allowed bg-muted text-muted-foreground')" @click="addToCart">
              <ShoppingCart class="h-4 w-4" /> {{ inStock ? 'Add to cart' : 'Sold out' }}
            </button>
          </div>
          <p v-if="hasVariants && !selectedVariant" class="mt-2 text-xs text-muted-foreground">Select options to add to cart.</p>
        </div>
      </div>

      <section v-if="relatedItems.length" class="mt-12">
        <h2 class="mb-4 text-lg font-bold text-foreground">Related</h2>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          <ProductCard v-for="p in relatedItems" :key="p.id" :product="p" />
        </div>
      </section>
    </div>
  </div>
</template>
```

## Non-negotiables

1. **File path is exactly `app/pages/products/[slug].vue`** (dynamic route); resolve via
   `useProducts().getBySlug(route.params.slug)`.
2. Three states: **loading → not-found → product**. Not-found links back to `/shop`.
3. **Variant selection required before add** when the product has variants; button reads "Sold out" when
   out of stock.
4. Add-to-cart flows through `useCart().add(product, selectedVariant, qty)` then `useCartDrawer().open()`.
5. Renders in `layout: default` (sidebar shell); all colours via tokens; `tabular-nums` on prices.

## Colour & polish

- Stock and variant badges.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Selection ring on the active swatch.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
