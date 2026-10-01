---
name: commerce-core
description: >-
  Commerce foundation for a web app: `commerce.ts` types, `useCart` (persistent
  localStorage cart), `useProducts`, `useCartDrawer` and admin-only `useOrders`, plus
  the mock `products.json`/`orders.json` data. Generate first for any storefront or
  admin surface. Use only when the project actually deals in products.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "commerce, foundation"
  stack: "nuxt4, vue3, tailwind4, vueuse"
---

# Commerce Core Skill

## When to use
The foundation for **any** commerce in a web app — storefront (product catalog, product detail,
cart/checkout) and admin (orders, inventory, sales, fulfillment). Every commerce skill
([`product-catalog`](../product-catalog/SKILL.md), [`product-detail`](../product-detail/SKILL.md),
[`cart-checkout`](../cart-checkout/SKILL.md), [`commerce-admin`](../commerce-admin/SKILL.md)) depends on this one.
**Generate these files FIRST**; if they already exist, do not recreate them.

Only relevant when the project actually deals in products (the planner adds commerce pages based on
PRODUCT.md). Never generate for a non-commerce app.

## Architecture

Generate these files **exactly as shown** (reproduce verbatim; treat them as read-only afterwards):

| File | Purpose |
|------|---------|
| `app/types/commerce.ts` | Shared domain types (Product, variants, cart line, Order) |
| `app/composables/useCart.ts` | Persistent client-side cart (localStorage singleton) — storefront |
| `app/composables/useProducts.ts` | Loads the mock catalog from `public/data/products.json` |
| `app/composables/useCartDrawer.ts` | Shared cart-drawer open/close state — storefront |
| `app/composables/useOrders.ts` | Loads mock orders from `public/data/orders.json` — admin only |

Generate `useCart`/`useProducts`/`useCartDrawer` for storefront pages; add `useOrders` when building the
admin surface. **There is no separate data step — you generate `public/data/products.json` (and
`orders.json` for admin) yourself** as part of building commerce (see "Mock data" below).

### `app/composables/useCartDrawer.ts`

```ts
import { ref } from 'vue'

// Module-level singleton — one shared drawer-open state for the whole app.
const _open = ref(false)

export function useCartDrawer() {
  return {
    isOpen: _open,
    open: () => { _open.value = true },
    close: () => { _open.value = false },
    toggle: () => { _open.value = !_open.value },
  }
}
```

## `app/types/commerce.ts`

```ts
// ─────────────────────────────────────────────────────────────────────────────
// COMMERCE DOMAIN TYPES — generated from commerce-core. DO NOT EDIT.
// Shared shape for the mock catalog (public/data/products.json), orders
// (public/data/orders.json), useProducts, useCart, useOrders, and every commerce skill.
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductOptionValue {
  label: string            // display, e.g. "Small", "Midnight Black"
  value: string            // slug, e.g. "s", "black"
  swatch?: string          // CSS color for color swatches (optional)
  image?: string           // image shown when this value is selected (optional)
}

export interface ProductOption {
  name: string             // e.g. "Size", "Color"
  values: ProductOptionValue[]
}

export interface ProductVariant {
  id: string
  options: Record<string, string> // option name -> value, e.g. { Size: "s", Color: "black" }
  price?: number                   // overrides product.price when set
  compareAtPrice?: number
  sku?: string
  inStock?: boolean
  inventory?: number
  image?: string
}

export interface Product {
  id: string
  slug: string
  name: string
  price: number
  compareAtPrice?: number   // original price → renders as a strikethrough sale price
  currency?: string         // ISO code; defaults to 'USD'
  description?: string
  images: string[]          // at least one; images[0] is primary
  category?: string
  tags?: string[]
  options?: ProductOption[] // e.g. Size, Color — drives variant selection
  variants?: ProductVariant[]
  rating?: number           // 0..5
  reviewCount?: number
  inStock?: boolean         // defaults to true when omitted
  inventory?: number
  badges?: string[]         // e.g. ["New", "Bestseller"]
  featured?: boolean
}

export interface CartLine {
  id: string                // stable line id: `${productId}` or `${productId}:${variantId}`
  productId: string
  slug: string
  name: string
  image?: string
  price: number             // resolved unit price (variant price if any, else product price)
  currency: string
  quantity: number
  variantId?: string
  variantLabel?: string     // human-readable, e.g. "Size: S / Color: Black"
}

export interface Cart {
  lines: CartLine[]
  count: number
  subtotal: number
}

// ─── Admin (webapp commerce) ─────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export interface OrderItem {
  productId: string
  name: string
  variantLabel?: string
  price: number
  quantity: number
}

export interface Order {
  id: string
  number: string            // human-facing, e.g. "#1042"
  customer: string
  email?: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  currency: string
  createdAt: string         // ISO date
}
```

## `app/composables/useCart.ts`

```ts
// ─────────────────────────────────────────────────────────────────────────────
// SHOPPING CART — generated from commerce-core. DO NOT REIMPLEMENT.
// A single reactive cart shared across every page/component, persisted to
// localStorage so it survives refresh. Import { useCart } and call its actions.
// Add-to-cart everywhere MUST go through this — never keep cart state locally.
// ─────────────────────────────────────────────────────────────────────────────
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { Product, ProductVariant, CartLine } from '~/types/commerce'

const STORAGE_KEY = 'shop:cart:v1'

function isValidLine(l: unknown): l is CartLine {
  const x = l as Partial<CartLine>
  return !!x && typeof x.id === 'string' && typeof x.price === 'number'
    && typeof x.quantity === 'number' && x.quantity > 0
}

// Module-level singleton: one shared, persisted reactive store for the whole app.
// The serializer is defensive — corrupted/partial persisted JSON degrades to an
// empty cart instead of throwing and breaking the storefront.
const _lines = useLocalStorage<CartLine[]>(STORAGE_KEY, [], {
  serializer: {
    read: (raw: string) => {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter(isValidLine) : []
      }
      catch { return [] }
    },
    write: (val: CartLine[]) => JSON.stringify(val),
  },
})

function lineId(product: Product, variant?: ProductVariant): string {
  return variant ? `${product.id}:${variant.id}` : product.id
}

function variantLabel(product: Product, variant?: ProductVariant): string | undefined {
  if (!variant?.options) return undefined
  return Object.entries(variant.options)
    .map(([name, value]) => {
      const opt = product.options?.find((o) => o.name === name)
      const val = opt?.values.find((v) => v.value === value)
      return `${name}: ${val?.label ?? value}`
    })
    .join(' / ')
}

export function useCart() {
  const lines = computed(() => _lines.value)
  const count = computed(() => _lines.value.reduce((n, l) => n + l.quantity, 0))
  const subtotal = computed(() => _lines.value.reduce((s, l) => s + l.price * l.quantity, 0))
  const isEmpty = computed(() => _lines.value.length === 0)

  function add(product: Product, variant?: ProductVariant, quantity = 1) {
    if (!product || quantity < 1) return
    const id = lineId(product, variant)
    if (_lines.value.some((l) => l.id === id)) {
      _lines.value = _lines.value.map((l) =>
        l.id === id ? { ...l, quantity: l.quantity + quantity } : l,
      )
      return
    }
    _lines.value = [
      ..._lines.value,
      {
        id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: variant?.image ?? product.images?.[0],
        price: variant?.price ?? product.price,
        currency: product.currency ?? 'USD',
        quantity,
        variantId: variant?.id,
        variantLabel: variantLabel(product, variant),
      },
    ]
  }

  function setQty(id: string, quantity: number) {
    if (quantity < 1) { remove(id); return }
    _lines.value = _lines.value.map((l) => (l.id === id ? { ...l, quantity } : l))
  }

  function increment(id: string) {
    const l = _lines.value.find((x) => x.id === id)
    if (l) setQty(id, l.quantity + 1)
  }

  function decrement(id: string) {
    const l = _lines.value.find((x) => x.id === id)
    if (l) setQty(id, l.quantity - 1)
  }

  function remove(id: string) {
    _lines.value = _lines.value.filter((l) => l.id !== id)
  }

  function clear() {
    _lines.value = []
  }

  function has(productId: string) {
    return _lines.value.some((l) => l.productId === productId)
  }

  return { lines, count, subtotal, isEmpty, add, setQty, increment, decrement, remove, clear, has }
}
```

## `app/composables/useProducts.ts`

```ts
// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATALOG — generated from commerce-core. DO NOT REIMPLEMENT.
// Loads the mock catalog from public/data/products.json into typed Product[],
// with loading/error/empty state and lookup helpers. Commerce pages MUST read
// products through this — do not hardcode a parallel catalog.
// ─────────────────────────────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import type { Product } from '~/types/commerce'
import { withBase } from '~/utils/basePath'

// Root-absolute paths break under the builder preview's base path — always withBase().
const PRODUCTS_URL = '/data/products.json'

// Module-level singleton so every component shares one fetch + one reactive list.
const _products = ref<Product[]>([])
const _loading = ref(false)
const _error = ref<string | null>(null)
let _loaded = false
let _inflight: Promise<void> | null = null

async function load(): Promise<void> {
  if (_loaded) return
  if (_inflight) return _inflight
  _loading.value = true
  _error.value = null
  _inflight = fetch(withBase(PRODUCTS_URL))
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load products: ${r.status}`)
      const type = r.headers.get('content-type') || ''
      if (!type.includes('json')) throw new Error('Expected JSON but received HTML — check the asset base path')
      return r.json()
    })
    .then((data) => {
      // Accept either a bare array or { products: [...] }.
      const list = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : []
      _products.value = list.filter((p: unknown) => {
        const x = p as Partial<Product>
        return !!x && typeof x.slug === 'string' && typeof x.name === 'string' && typeof x.price === 'number'
      })
      _loaded = true
    })
    .catch((e) => {
      // Graceful fallback — a missing/broken catalog must not crash the store.
      _error.value = e instanceof Error ? e.message : 'Failed to load products'
      _products.value = []
      _loaded = true
    })
    .finally(() => {
      _loading.value = false
      _inflight = null
    })
  return _inflight
}

export function useProducts() {
  if (typeof window !== 'undefined' && !_loaded) void load()

  const products = computed(() => _products.value)
  const loading = computed(() => _loading.value)
  const error = computed(() => _error.value)
  const isEmpty = computed(() => _loaded && _products.value.length === 0)
  const categories = computed(
    () => Array.from(new Set(_products.value.map((p) => p.category).filter(Boolean))) as string[],
  )

  function getBySlug(slug: string): Product | null {
    return _products.value.find((p) => p.slug === slug) ?? null
  }

  function byCategory(category: string): Product[] {
    return _products.value.filter((p) => p.category === category)
  }

  function related(product: Product | null, limit = 4): Product[] {
    if (!product) return []
    return _products.value
      .filter(
        (p) =>
          p.id !== product.id
          && (p.category === product.category
            || (p.tags ?? []).some((t) => (product.tags ?? []).includes(t))),
      )
      .slice(0, limit)
  }

  return { products, loading, error, isEmpty, categories, load, getBySlug, byCategory, related }
}
```

## `app/composables/useOrders.ts` (admin surface only)

```ts
// ─────────────────────────────────────────────────────────────────────────────
// ORDERS (admin) — generated from commerce-core. DO NOT REIMPLEMENT.
// Loads mock orders from public/data/orders.json for the commerce-admin surface
// (orders table, fulfillment, sales dashboard). Same reliability contract as
// useProducts: typed, loading/error/empty, graceful fallback.
// ─────────────────────────────────────────────────────────────────────────────
import { ref, computed } from 'vue'
import type { Order, OrderStatus } from '~/types/commerce'
import { withBase } from '~/utils/basePath'

const ORDERS_URL = '/data/orders.json'

const _orders = ref<Order[]>([])
const _loading = ref(false)
const _error = ref<string | null>(null)
let _loaded = false
let _inflight: Promise<void> | null = null

async function load(): Promise<void> {
  if (_loaded) return
  if (_inflight) return _inflight
  _loading.value = true
  _error.value = null
  _inflight = fetch(withBase(ORDERS_URL))
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load orders: ${r.status}`)
      const type = r.headers.get('content-type') || ''
      if (!type.includes('json')) throw new Error('Expected JSON but received HTML — check the asset base path')
      return r.json()
    })
    .then((data) => {
      const list = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : []
      _orders.value = list.filter((o: unknown) => {
        const x = o as Partial<Order>
        return !!x && typeof x.id === 'string' && typeof x.status === 'string' && typeof x.total === 'number'
      })
      _loaded = true
    })
    .catch((e) => {
      _error.value = e instanceof Error ? e.message : 'Failed to load orders'
      _orders.value = []
      _loaded = true
    })
    .finally(() => {
      _loading.value = false
      _inflight = null
    })
  return _inflight
}

export function useOrders() {
  if (typeof window !== 'undefined' && !_loaded) void load()

  const orders = computed(() => _orders.value)
  const loading = computed(() => _loading.value)
  const error = computed(() => _error.value)
  const isEmpty = computed(() => _loaded && _orders.value.length === 0)

  const revenue = computed(() =>
    _orders.value
      .filter((o) => o.status !== 'cancelled' && o.status !== 'refunded')
      .reduce((s, o) => s + o.total, 0),
  )

  function byStatus(status: OrderStatus): Order[] {
    return _orders.value.filter((o) => o.status === status)
  }

  function countByStatus(): Record<string, number> {
    return _orders.value.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1
      return acc
    }, {})
  }

  return { orders, loading, error, isEmpty, revenue, load, byStatus, countByStatus }
}
```

## Mock data files

`useProducts`/`useOrders` fetch `/data/products.json` and `/data/orders.json` — this builder is a
**frontend with mock data (no backend)**, so you create both files yourself as part of building
commerce. Read [references/mock-data.md](references/mock-data.md) for the required shapes, counts,
and examples before generating them.

## Non-negotiables

1. **Generate the composable/type files verbatim and treat them as read-only** — they are the shared
   contract every commerce section depends on; do not fork them or diverge from these signatures.
2. **You MUST create the data files yourself** — `public/data/products.json` (storefront) and, for the
   admin surface, `public/data/orders.json`, in the shapes in
   [references/mock-data.md](references/mock-data.md). There is no separate data step;
   `useProducts`/`useOrders` fetch them at runtime, so a missing file renders an empty store/table.
3. **`useCart` is the ONLY source of cart state**; **`useProducts` the ONLY catalog source**;
   **`useCartDrawer` the ONLY cart-drawer state**; **`useOrders` the ONLY orders source.** Never fork a
   parallel array/ref for these.
4. The cart persists (localStorage) and survives refresh; do not disable the serializer.
5. Explicit imports only. `@vueuse/core` and Pinia are already installed.
6. Only generate `useOrders.ts` + `orders.json` when building the admin surface — storefront-only apps
   don't need them.
