---
name: product-catalog
description: >-
  Web-app storefront product browsing: a dense app-styled `ProductCard` plus
  `ProductCatalog` with search, category chips, sort, responsive grid and loading/empty
  states. Reads `useProducts` and adds to cart via `useCart` + `useCartDrawer`. Use when
  building shop or catalog pages inside the sidebar shell.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "commerce, catalog"
  stack: "nuxt4, vue3, tailwind4, lucide"
---

# Product Catalog Skill (web app storefront)

## When to use
The product browsing surface inside a web-app storefront (a B2B/internal ordering portal, marketplace,
or any app that lets users buy). Renders inside the sidebar shell (`layout: default`). Depends on
**`commerce-core`** ([commerce-core skill](../commerce-core/SKILL.md); `useCart`, `useProducts`, `useCartDrawer`, `commerce.ts`).

## Architecture

Generate TWO files (feature-scoped under `shop/`):

| File | Purpose |
|------|---------|
| `app/components/features/shop/ProductCard.vue` | Dense app-style product card (image, price, add) |
| `app/components/features/shop/ProductCatalog.vue` | Search + category chips + sort + responsive grid + states |

A `/shop` (or `/catalog`) page renders `ProductCatalog`. Component paths follow the webapp convention
`app/components/features/{domain}/...`.

## `app/components/features/shop/ProductCard.vue`

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from 'lucide-vue-next'
import { useCart } from '~/composables/useCart'
import { useCartDrawer } from '~/composables/useCartDrawer'
import type { Product } from '~/types/commerce'

const props = defineProps<{ product: Product }>()
const cart = useCart()
const drawer = useCartDrawer()

const onSale = computed(() =>
  !!props.product.compareAtPrice && props.product.compareAtPrice > props.product.price)
const soldOut = computed(() => props.product.inStock === false)
const hasVariants = computed(() => (props.product.variants?.length ?? 0) > 0)

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: props.product.currency ?? 'USD' }).format(n)
}
function add() {
  if (soldOut.value || hasVariants.value) return
  cart.add(props.product)
  drawer.open()
}
</script>

<template>
  <div class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
    <NuxtLink :to="`/products/${product.slug}`" class="relative block aspect-square overflow-hidden bg-muted">
      <img :src="product.images?.[0]" :alt="product.name" loading="lazy" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <span v-if="onSale" class="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">Sale</span>
      <span v-if="soldOut" class="absolute inset-0 flex items-center justify-center bg-background/60 text-xs font-medium uppercase tracking-wide text-foreground">Sold out</span>
    </NuxtLink>
    <div class="flex flex-1 flex-col p-3">
      <NuxtLink :to="`/products/${product.slug}`" class="truncate text-sm font-medium text-foreground hover:text-primary">{{ product.name }}</NuxtLink>
      <p v-if="product.category" class="mt-0.5 text-xs text-muted-foreground">{{ product.category }}</p>
      <div class="mt-auto flex items-center justify-between pt-3">
        <div>
          <span class="text-sm font-semibold tabular-nums text-foreground">{{ fmt(product.price) }}</span>
          <span v-if="onSale" class="ml-1 text-xs tabular-nums text-muted-foreground line-through">{{ fmt(product.compareAtPrice!) }}</span>
        </div>
        <NuxtLink
          v-if="hasVariants && !soldOut"
          :to="`/products/${product.slug}`"
          class="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground"
        >Options</NuxtLink>
        <button
          v-else
          :disabled="soldOut"
          class="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          @click="add"
        >
          <Plus class="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  </div>
</template>
```

## `app/components/features/shop/ProductCatalog.vue`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search } from 'lucide-vue-next'
import { cn } from '~/utils/cn'
import { useProducts } from '~/composables/useProducts'
import ProductCard from '~/components/features/shop/ProductCard.vue'

const { products, loading, error, isEmpty, categories } = useProducts()

const query = ref('')
const activeCategory = ref('all')
type Sort = 'featured' | 'price-asc' | 'price-desc'
const sort = ref<Sort>('featured')

const visible = computed(() => {
  let list = products.value
  if (activeCategory.value !== 'all') list = list.filter((p) => p.category === activeCategory.value)
  const q = query.value.trim().toLowerCase()
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q)))
  const arr = [...list]
  if (sort.value === 'price-asc') arr.sort((a, b) => a.price - b.price)
  else if (sort.value === 'price-desc') arr.sort((a, b) => b.price - a.price)
  else arr.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
  return arr
})
</script>

<template>
  <div class="py-6">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Catalog</h1>
        <p class="text-sm text-muted-foreground">Browse and add products to your order.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input v-model="query" type="search" placeholder="Search products" class="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:w-56" />
        </div>
        <select v-model="sort" class="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          <option value="featured">Featured</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </div>
    </div>

    <div v-if="categories.length" class="mb-6 flex flex-wrap gap-2">
      <button :class="cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', activeCategory === 'all' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')" @click="activeCategory = 'all'">All</button>
      <button v-for="c in categories" :key="c" :class="cn('rounded-full px-3 py-1.5 text-xs font-medium transition-colors', activeCategory === c ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground')" @click="activeCategory = c">{{ c }}</button>
    </div>

    <!-- loading → error → empty → data -->
    <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      <div v-for="n in 8" :key="n" class="animate-pulse overflow-hidden rounded-xl border border-border">
        <div class="aspect-square bg-muted" />
        <div class="space-y-2 p-3"><div class="h-4 w-2/3 rounded bg-muted" /><div class="h-3 w-1/3 rounded bg-muted" /></div>
      </div>
    </div>
    <div v-else-if="error" class="rounded-xl border border-border py-16 text-center text-muted-foreground">Couldn’t load products.</div>
    <div v-else-if="isEmpty || !visible.length" class="rounded-xl border border-border py-16 text-center text-muted-foreground">No products match your filters.</div>
    <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      <ProductCard v-for="p in visible" :key="p.id" :product="p" />
    </div>
  </div>
</template>
```

## Non-negotiables

1. **Read products only through `useProducts()`**; add-to-cart only through `useCart().add()` +
   `useCartDrawer().open()`. No local product/cart state.
2. Variant products route to the PDP (`Options` link) instead of quick-adding; sold-out disables add.
3. Four states in priority order: **loading → error → empty → data** (skeletons on loading).
4. Component paths under `app/components/features/shop/`; renders inside `layout: default` (sidebar shell).
5. Prices via `Intl.NumberFormat` + `tabular-nums`; all colours via tokens (bg-card, border-border, …).

## Colour & polish

- Category/tag chips, one token per category.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Card hover lift; fixed image aspect ratio to stop layout shift.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
