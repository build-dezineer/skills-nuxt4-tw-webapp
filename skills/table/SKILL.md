---
name: table
description: >-
  Full data table covering sorting, filtering, pagination, CSV export, row selection,
  expandable rows and column visibility, built on the pre-built `DataTable` +
  `useDataTable` + `DataTablePagination`. Handles loading, error, empty and data states.
  Use for any admin or list screen showing 5+ tabular rows.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "data, tables, listing"
  stack: "nuxt4, vue3, tailwind4, radix-vue, vueuse, lucide"
---

# Data Table Skill

## When to use
Pages that display tabular data — sortable, filterable, paginated, or selectable lists with more than 5 rows.

## Architecture
Generate THREE files:

| File | Purpose |
|------|---------|
| `app/composables/useDataTable.ts` | Pure state logic — sort, filter, paginate, select, expand, column visibility, CSV export, resize |
| `app/components/shared/DataTable.vue` | Table UI shell — card wrapper, toolbar, states, table, pagination footer |
| `app/components/shared/DataTablePagination.vue` | Page controls — prev/next, page numbers, page size, row count |

Pages import only `DataTable`:
```ts
import DataTable from '~/components/shared/DataTable.vue'
```

## Choosing what to read

| Writing | Read before writing |
|---|---|
| `app/composables/useDataTable.ts` | This page — interfaces, state contract, and logic rules |
| `app/components/shared/DataTable.vue` | [references/data-table-component.md](references/data-table-component.md) — coupling rule + full SFC |
| `app/components/shared/DataTablePagination.vue` | [references/pagination.md](references/pagination.md) — full SFC |

The cell-slot pattern, page usage example, CSS variable usage, and non-negotiables stay
on this page.

## Required imports
- **Icons:** `ArrowUpDown`, `ChevronUp`, `ChevronDown`, `ChevronLeft`, `ChevronRight`, `Search`, `ListFilter`, `Columns`, `Download`, `Inbox`, `AlertCircle`, `Check`, `SquareChevronDown`. Do NOT import `Filter`, `Loader2`, or `GripVertical` — these are unused in this component set.
- **Radix-Vue (DropdownMenu):** `DropdownMenuRoot`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuCheckboxItem`, `DropdownMenuItemIndicator` — for the column visibility toggle
- **Radix-Vue (Popover):** `PopoverRoot`, `PopoverTrigger`, `PopoverContent`, `PopoverClose` — for the filter overlay panel
- **Utility:** `cn` from `~/utils/cn`

## States (non-negotiable)
Every table MUST handle FOUR states, exactly one visible at a time, evaluated in this priority order:

1. **Loading** — skeleton rows with `animate-pulse`. Always render `pageSize` rows. Use the column count to determine skeleton cell width distribution.
2. **Error** — `AlertCircle` icon + error message + retry button using `bg-primary text-primary-foreground`. Checked BEFORE empty so an error on an empty result set is never masked by the empty state.
3. **Empty** — centered `Inbox` icon (w-12 h-12) + "No results" or descriptive message + optional secondary text. Use `text-muted-foreground`. Only shown when no error is present.
4. **Data** — the actual table rows with all features enabled.

**State priority rule:** `v-if="tableLoading"` → `v-else-if="tableError"` → `v-else-if="filteredRows.length === 0"` → `v-else`. Never put the empty check before the error check.

## TypeScript interfaces
Define these at the top of `useDataTable.ts`:

```ts
export interface ColumnDef {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  resizable?: boolean    // default true — show resize handle (independent of sortable)
  visible?: boolean
  width?: number      // px
  minWidth?: number   // px, default 80
  cell?: (value: any, row: any) => string | number  // plain values only — use #cell-[key] slot for Vue components
}

export interface SortState {
  key: string | null
  dir: 'asc' | 'desc'
}

export interface DataTableOptions<T extends Record<string, any>> {
  columns: ColumnDef[]
  rows: Ref<T[]>
  rowKey?: string        // default 'id'
  pageSize?: number      // default 10
  pageSizeOptions?: number[]  // default [10, 25, 50, 100]
  defaultSort?: SortState
  debounceMs?: number    // default 300 — for search debounce
  loading?: Ref<boolean>
  error?: Ref<string | null>
  onRetry?: () => void
}
```

## `useDataTable` composable
Write a generic composable that returns:

```ts
function useDataTable<T extends Record<string, any>>(options: DataTableOptions<T>): DataTableState<T>

interface DataTableState<T> {
  // ── Reactive state ──
  columns: Ref<ColumnDef[]>
  searchQuery: Ref<string>
  columnFilters: Ref<Record<string, string>>  // key → filter text
  sortState: Ref<SortState>
  page: Ref<number>
  pageSize: Ref<number>
  pageSizeOptions: Ref<number[]>
  selected: Ref<Set<string | number>>
  expanded: Ref<Set<string | number>>
  loading: Ref<boolean>
  error: Ref<string | null>
  columnWidths: Ref<Record<string, number>>

  // ── Computed derived data (client-side) ──
  filteredRows: ComputedRef<T[]>        // searchQuery + columnFilters
  sortedRows: ComputedRef<T[]>          // sortState applied
  paginatedRows: ComputedRef<T[]>       // current page slice
  totalPages: ComputedRef<number>
  totalFilteredCount: ComputedRef<number>
  pageRangeText: ComputedRef<string>    // "Showing 1-10 of 47"
  selectAllOnPage: ComputedRef<boolean> // all current page rows selected?
  visibleColumns: ComputedRef<ColumnDef[]>  // columns.filter(c => c.visible)

  // ── Actions ──
  toggleSort: (key: string) => void
  toggleSelectAll: () => void
  toggleRow: (id: string | number) => void
  toggleExpand: (id: string | number) => void
  toggleColumn: (key: string) => void
  setPage: (n: number) => void
  setPageSize: (n: number) => void
  exportCSV: (filename?: string) => void

  // ── Column resize ──
  startResize: (key: string, event: MouseEvent) => void
  onResize: (event: MouseEvent) => void
  stopResize: () => void
}
```

**Search logic:** `filteredRows` should filter `rows` where `searchQuery` matches any visible string column value (case-insensitive). Combine with per-column `columnFilters` (AND logic). Debounce the search input value by `debounceMs` before applying.

**Sort logic:** `sortedRows` sorts `filteredRows`. Clicking the same column toggles `asc` ↔ `desc`. Clicking a different column sets that column to `asc`. Show ChevronUp for `asc`, ChevronDown for `desc`, ArrowUpDown for unsorted.

**Pagination logic:** `paginatedRows` slices `sortedRows` to `[(page-1)*pageSize, page*pageSize]`. `totalPages` = `Math.ceil(sortedRows.length / pageSize)`. Clamp page when it exceeds totalPages.

**CSV export:** Build CSV string from `filteredRows` + `visibleColumns`. Join column keys as header row. Escape commas/quotes in values. Create Blob, trigger download with `URL.createObjectURL`.

**Column resize:** On `startResize(key, e)`, capture initial mouse X + column width. On `onResize(e)`, compute delta and update `columnWidths`. On `stopResize()`, lock width and remove listeners. Use `document.addEventListener('mousemove', onResize)` and `document.addEventListener('mouseup', stopResize)`. Set `document.body.style.cursor = 'col-resize'` on start; restore to `''` on stop. Call `onUnmounted(() => { document.removeEventListener('mousemove', onResize); document.removeEventListener('mouseup', stopResize) })` to prevent memory leaks if the component unmounts during a drag.

## Cell slot pattern
When a cell needs to render a Vue component (badge, avatar, action button, link), use a named scoped slot instead of `col.cell`. The `col.cell` function can only return `string | number` — it cannot produce markup.

**Convention:** slot name = `cell-[column-key]`

The slot is already wired in the `DataTable.vue` template in
[references/data-table-component.md](references/data-table-component.md) — when a slot named `cell-[key]` is provided by the page, it is used; otherwise falls back to `col.cell` or the raw value.

**Page usage with a slot:**
```vue
<DataTable :columns="columns" :rows="users">
  <template #cell-status="{ value }">
    <span :class="cn(
      'px-2 py-0.5 rounded-full text-xs font-medium',
      value === 'active' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
    )">
      {{ value }}
    </span>
  </template>
</DataTable>
```

Do not try to render HTML from `col.cell` — it returns plain values only.

**Avatar cell:** for a table with many rows (the common case — 10+ records), render an
initials circle per row from row data. This is NOT pipeline-managed — do not invent a
`data-media-id` per row, and do not hardcode a `placehold.co` URL per row either:

```vue
<template #cell-name="{ row }">
  <div class="flex items-center gap-2.5">
    <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
      {{ row.name.charAt(0) }}
    </div>
    <span>{{ row.name }}</span>
  </div>
</template>
```

Only if the spec's Image Prompts section lists per-item entries for this exact list (this only
happens for a short list — fewer than ~10 items, e.g. a small "Team" list, never a bulk table),
use `<img :data-media-id="row.avatarId">` bound to each row's own id instead — the pipeline injects `:src` (`'./media/<id>.webp'`):

```vue
<template #cell-name="{ row }">
  <div class="flex items-center gap-2.5">
    <img :data-media-id="row.avatarId" decoding="async" alt="" class="h-7 w-7 rounded-full shrink-0 object-cover" />
    <span>{{ row.name }}</span>
  </div>
</template>
```

## Page usage example
A page passes only `columns` and `rows`. It never calls `useDataTable` directly — that is `DataTable.vue`'s internal concern.

```vue
<script setup lang="ts">
import type { ColumnDef } from '~/composables/useDataTable'
import DataTable from '~/components/shared/DataTable.vue'
import { cn } from '~/utils/cn'

const columns: ColumnDef[] = [
  { key: 'name',   label: 'Name',   sortable: true },
  { key: 'email',  label: 'Email',  sortable: true, filterable: true },
  { key: 'status', label: 'Status', sortable: false, filterable: true },
]

const { data: users, pending: loading, error, refresh } = await useFetch('/api/users')
</script>

<template>
  <DataTable
    :columns="columns"
    :rows="users ?? []"
    :loading="loading"
    :error="error?.message ?? null"
    :on-retry="refresh"
    :selectable="true"
    row-key="id"
  >
    <template #cell-status="{ value }">
      <span :class="cn(
        'px-2 py-0.5 rounded-full text-xs font-medium',
      value === 'active' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
      )">{{ value }}</span>
    </template>
  </DataTable>
</template>
```

The filter overlay appears automatically because `email` and `status` have `filterable: true`. The page passes `rows` as a plain array — reactivity is handled internally by `toRef(props, 'rows')` inside `DataTable.vue`.

## CSS variable usage
| Element | Classes |
|---------|---------|
| Card wrapper | `rounded-xl border border-border bg-card` (no `overflow-hidden` — would clip portaled overlays) |
| Toolbar | `px-4 py-3 border-b border-border` |
| Table headers | `text-muted-foreground font-medium text-xs uppercase tracking-wider` |
| Table rows | `border-b border-border hover:bg-muted/50` |
| Selected row | `bg-primary/5` |
| Table cells | `text-sm text-foreground` |
| Search input | `border-input bg-background text-foreground focus-visible:ring-ring` |
| Filter button (active) | `border-primary text-primary` |
| Filter badge | `bg-primary text-primary-foreground` |
| Filter panel | `bg-popover border-border shadow-lg` |
| Pagination footer | `px-4 py-3 border-t border-border` |
| Pagination buttons | `hover:bg-muted`, active: `bg-primary text-primary-foreground` |
| Skeleton | `bg-muted rounded animate-pulse` |
| Empty state | `text-muted-foreground` |
| Error state | `text-destructive` |
| Column resize handle | `hover:bg-primary active:bg-primary` |
| Toolbar buttons | `border border-input hover:bg-muted` |

## Non-negotiables
1. ALL colors via CSS variables — never hardcoded hex/rgb/hsl. Every color value must be one of: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`, `border-input`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-destructive`, `bg-destructive`, `bg-popover`, `text-popover-foreground`
2. Every component/file explicitly imported — no reliance on Nuxt auto-imports
3. `cn()` from `~/utils/cn` for all class assembly — never template literals for Tailwind
4. 4 states mandatory in this priority order: loading → error → empty → data. Never put empty before error.
5. Validate every lucide icon name before using it
6. Semantic `<table>` / `<thead>` / `<tbody>` / `<th>` / `<td>` — never div-based tables
7. `defineProps<T>()` and `defineEmits<T>()` with TypeScript interfaces
8. Search input must be debounced (300ms default) — use `useDebounceFn` from VueUse
9. The resize handle hit area must be at least 4px wide with `cursor-col-resize`
10. DropdownMenu for column visibility — never manual `onClickOutside` or `addEventListener`
11. `aria-sort="ascending"|"descending"|"none"` on every sortable `<th>` — derived from `sortState`
12. `aria-label="Select row"` on row checkboxes; `aria-label="Select all"` on the header checkbox
13. `role="status" aria-live="polite"` on loading and empty state containers
14. `aria-label="Table pagination"` on the `<nav>` wrapping pagination controls
15. `aria-label="Filters"` on the filter button; filter panel only rendered when columns have `filterable: true`
16. `<style scoped>` is a top-level SFC block — NEVER nested inside `<template>`. SFC block order: `<script setup lang="ts">` → `<template>` → `<style scoped>`.
17. The retry button MUST have `v-if="onRetry"` — never render or call it if no handler was passed.
18. The card wrapper (`rounded-xl border border-border bg-card`) is the only surface — NO `overflow-hidden` on the card. `overflow-hidden` clips portaled overlays (DropdownMenu, Popover) and native select dropdowns. The table inside has no additional border or rounded corners.
19. Every overlay content component (`DropdownMenuContent`, `PopoverContent`) MUST have `z-50`. The sticky `<thead>` uses `z-10` — any overlay without `z-50` will be covered by the sticky header if it opens near the table area.
20. Mock data for any table-using page MUST contain at least **10 records** (ideally 15–20). Fewer than 10 rows makes the default `pageSize: 10` show no pagination, makes filtering trivial, and makes the table look sparse/broken.
21. Toolbar layout: search on the LEFT (`w-64 shrink-0`), action buttons grouped on the RIGHT inside `<div class="flex items-center gap-2">`. Use `justify-between` on the toolbar div.
22. Pagination lives inside the card footer `<div class="px-4 py-3 border-t border-border">` — `DataTablePagination` itself has no outer margin.

## Colour & polish

- Map each status value to a fixed `chart-1`…`chart-5` token; the same status is always the same colour.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Row hover tint, sticky header, `tabular-nums` on numeric columns.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
