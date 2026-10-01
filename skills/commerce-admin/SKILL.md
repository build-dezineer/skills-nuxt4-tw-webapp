---
name: commerce-admin
description: >-
  Merchant back-office composition: orders table + detail drawer, inventory table with
  stock-edit forms, a KPI/chart sales dashboard and a fulfillment kanban wired to
  `useOrders`/`useProducts`. Uses the table, chart, metric-card, form and kanban skills
  instead of reimplementing them. Use when building admin or store-manager screens.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "commerce, admin"
  stack: "nuxt4, vue3, tailwind4"
---

# Commerce Admin Skill

## When to use
The merchant/back-office side of a commerce web app — orders, inventory, a sales dashboard, and
fulfillment. This skill is **composition**: it wires the existing app skills
([`table`](../table/SKILL.md), [`chart`](../chart/SKILL.md), [`metric-card`](../metric-card/SKILL.md),
[`form`](../form/SKILL.md), [`kanban`](../kanban/SKILL.md)) to the commerce data. Depends on the
[commerce-core skill](../commerce-core/SKILL.md) (`useOrders`, `useProducts`, `commerce.ts`).

Generate `useOrders`/`useProducts` from `commerce-core` first (they load `public/data/orders.json` and
`public/data/products.json`).

## Pages to plan

| Page | Path | Built from |
|------|------|-----------|
| Sales dashboard | `/` or `/dashboard` | `metric-card` (KPIs) + `chart` (sales over time) + recent orders (`table`) |
| Orders | `/orders` | `table` (orders) + order detail `drawer` |
| Inventory | `/inventory` | `table` (products) + stock-edit `form`/`drawer` |
| Fulfillment | `/fulfillment` | `kanban` (orders grouped by status) |

Component paths follow `app/components/features/{domain}/…`. Do NOT reimplement DataTable, charts,
metric cards, or the kanban board — generate them from their own skills and feed them commerce data.

## Orders table — `app/pages/orders.vue`

```vue
<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'
import DataTable from '~/components/shared/DataTable.vue'
import type { ColumnDef } from '~/composables/useDataTable'

definePageMeta({ layout: 'default' })

const { orders, loading, error } = useOrders()

const columns: ColumnDef[] = [
  { key: 'number', label: 'Order', sortable: true },
  { key: 'customer', label: 'Customer', sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
]

const statusClass: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  paid: 'bg-primary/10 text-primary',
  fulfilled: 'bg-primary/10 text-primary',
  shipped: 'bg-primary/10 text-primary',
  delivered: 'bg-secondary/15 text-secondary',
  cancelled: 'bg-destructive/10 text-destructive',
  refunded: 'bg-destructive/10 text-destructive',
}
function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n) }
</script>

<template>
  <div class="py-6">
    <h1 class="mb-6 text-2xl font-bold text-foreground">Orders</h1>
    <DataTable :columns="columns" :rows="orders" :loading="loading" :error="error" searchable exportable>
      <template #cell-status="{ value }">
        <span :class="['inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize', statusClass[value] ?? 'bg-muted text-muted-foreground']">{{ value }}</span>
      </template>
      <template #cell-total="{ value }">
        <span class="tabular-nums">{{ fmt(value) }}</span>
      </template>
    </DataTable>
  </div>
</template>
```

- Row click / an actions cell opens an **order detail drawer** (from the [drawer skill](../drawer/SKILL.md)
  and [form skill](../form/SKILL.md)) showing
  line items, customer, and a status selector. Editing status updates the row (local mock state).
- The DataTable already provides the loading/error/empty/data states — do not re-implement them.

## Sales dashboard KPIs — wire `metric-card` to `useOrders`

`MetricCard` (from the [metric-card skill](../metric-card/SKILL.md)) is used directly inside a grid — it takes `label` / `value` /
`variant` / `icon-color` props (no `:metrics` array prop). The point is the values are **derived from
`useOrders`**, never hardcoded:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useOrders } from '~/composables/useOrders'
import MetricCard from '~/components/shared/MetricCard.vue'

const { orders, revenue } = useOrders()
const orderCount = computed(() => orders.value.length)
const aov = computed(() => (orderCount.value ? revenue.value / orderCount.value : 0))
const pending = computed(() => orders.value.filter((o) => o.status === 'pending').length)
function money(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) }
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <MetricCard label="Revenue" :value="money(revenue)" variant="icon" icon-color="primary" />
    <MetricCard label="Orders" :value="orderCount" variant="default" />
    <MetricCard label="Avg order value" :value="money(aov)" variant="default" />
    <MetricCard label="Pending" :value="pending" variant="icon" icon-color="secondary" />
  </div>
</template>
```
Generate `MetricCard` from the [metric-card skill](../metric-card/SKILL.md) (match its exact props). Add a
[`chart`](../chart/SKILL.md) (line/bar) of
revenue or order count over time using the orders' `createdAt`, and a "Recent orders" `table` limited to
the latest few.

## Inventory & fulfillment

- **Inventory** (`/inventory`): a [`table`](../table/SKILL.md) of `useProducts().products` with columns name / category / price /
  stock (`inStock`/`inventory`); a stock-edit [drawer](../drawer/SKILL.md) ([form](../form/SKILL.md) skill) to adjust values (local mock state).
- **Fulfillment** (`/fulfillment`): a [`kanban`](../kanban/SKILL.md) board whose columns are order statuses
  (`pending → paid → fulfilled → shipped → delivered`), cards are orders from `useOrders`; moving a card
  updates that order's status locally.

## Non-negotiables

1. **Compose existing skills** — generate DataTable/charts/metric cards/kanban from `table`/`chart`/
   `metric-card`/`kanban`; never hand-roll them here.
2. **All commerce data comes from `useOrders` / `useProducts`** (from `commerce-core`) — never hardcode
   orders or inventory in the page.
3. Status is rendered as a token-coloured badge (`bg-primary/10 text-primary`, `bg-destructive/10 …`, …) —
   never hardcoded hex/green/red.
4. Money via `Intl.NumberFormat` + `tabular-nums`. Dashboard KPIs are **derived** from the data
   (revenue/orders/AOV/pending), not placeholder numbers.
5. This is a **frontend with mock data** — edits (status changes, stock edits) are local/mock; there is no
   backend or persistence beyond the mock JSON.
6. Renders in `layout: default` (sidebar shell); auth/role gating (if any) follows the `sidenav`/`auth`
   skills.

## Colour & polish

- Order/fulfilment status pills.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Row hover; a status legend above the table.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
