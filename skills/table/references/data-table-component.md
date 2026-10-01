# Data Table — `DataTable.vue` Implementation

Read this file before writing `app/components/shared/DataTable.vue`. It carries the
coupling rule, the complete `<script setup>` block, and the complete `<template>`.

## `DataTable.vue` pattern

**SFC structure (mandatory):** The file must contain exactly three top-level blocks in this order: `<script setup lang="ts">`, `<template>`, `<style scoped>` (optional). The `<style>` block is NEVER placed inside `<template>`. Any animation or scoped styles go after the closing `</template>` tag as a separate top-level block.

### Coupling rule
`DataTable.vue` calls `useDataTable` internally. Pages pass only `columns` and `rows` as props — they do NOT call `useDataTable` directly. The composable is an implementation detail of `DataTable.vue`.

### `<script setup>` block

```vue
<script setup lang="ts">
import { ref, computed, toRef } from 'vue'
import {
  DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuItemIndicator,
  PopoverRoot, PopoverTrigger, PopoverContent, PopoverClose,
} from 'radix-vue'
import {
  ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Search, ListFilter, Columns, Download, Inbox, AlertCircle, Check, SquareChevronDown,
} from 'lucide-vue-next'
import { useDataTable } from '~/composables/useDataTable'
import type { ColumnDef } from '~/composables/useDataTable'
import DataTablePagination from '~/components/shared/DataTablePagination.vue'
import { cn } from '~/utils/cn'

interface Props {
  columns: ColumnDef[]
  rows: any[]
  rowKey?: string
  pageSize?: number
  selectable?: boolean
  expandable?: boolean
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  searchable?: boolean
  exportable?: boolean
  columnFilterable?: boolean
  stickyHeader?: boolean
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  rowKey: 'id',
  pageSize: 10,
  selectable: false,
  expandable: false,
  searchable: true,
  exportable: true,
  columnFilterable: false,
  stickyHeader: true,
  pageSizeOptions: () => [10, 25, 50, 100],
})

const {
  columns,
  searchQuery,
  columnFilters,
  sortState,
  page,
  pageSize,
  pageSizeOptions,
  selected,
  expanded,
  loading: tableLoading,
  error: tableError,
  columnWidths,
  filteredRows,
  paginatedRows,
  totalPages,
  totalFilteredCount,
  pageRangeText,
  selectAllOnPage,
  visibleColumns,
  toggleSort,
  toggleSelectAll,
  toggleRow,
  toggleExpand,
  toggleColumn,
  setPage,
  setPageSize,
  exportCSV,
  startResize,
} = useDataTable({
  columns: props.columns,
  rows: toRef(props, 'rows'),    // toRef keeps reactivity — never pass props.rows directly
  rowKey: props.rowKey,
  pageSize: props.pageSize,
  pageSizeOptions: props.pageSizeOptions,
  loading: toRef(props, 'loading'),
  error: toRef(props, 'error'),
  onRetry: props.onRetry,
})

// ── Filter overlay ──
const filterableColumns = computed(() => columns.value.filter(c => c.filterable))
const pendingFilters = ref<Record<string, string>>({})
const filterCount = computed(() =>
  Object.values(columnFilters.value).filter(v => v.trim()).length
)

function openFilter() {
  pendingFilters.value = { ...columnFilters.value }
}
function applyFilters() {
  columnFilters.value = { ...pendingFilters.value }
}
function clearFilters() {
  pendingFilters.value = {}
  columnFilters.value = {}
}
</script>
```

### `<template>`

The entire component is a **card** (`rounded-xl border border-border bg-card`). The toolbar is the card header, the table is the card body, and the pagination is the card footer — all separated by `border-border` dividers. The table itself has no additional border or rounded corners. Do NOT add `overflow-hidden` to the card — it will clip the DropdownMenu and Popover overlays even when they use Radix-Vue portals, and can interfere with native `<select>` dropdowns in some browsers.

```vue
<template>
  <div class="rounded-xl border border-border bg-card">

    <!-- Toolbar: search LEFT, action buttons RIGHT -->
    <div class="flex items-center justify-between gap-4 px-4 py-3 border-b border-border">
      <!-- Left: search -->
      <div v-if="searchable" class="relative w-64 shrink-0">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          v-model="searchQuery"
          placeholder="Search..."
          class="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div v-else class="flex-1" />

      <!-- Right: action buttons -->
      <div class="flex items-center gap-2">
        <!-- Filter button — only rendered when at least one column is filterable -->
        <PopoverRoot v-if="filterableColumns.length > 0">
          <PopoverTrigger as-child>
            <button
              class="relative p-2 rounded-lg border border-input hover:bg-muted transition-colors"
              :class="filterCount > 0 ? 'border-primary text-primary' : 'text-muted-foreground'"
              title="Filter"
              aria-label="Filters"
              @click="openFilter"
            >
              <ListFilter class="w-4 h-4" />
              <span
                v-if="filterCount > 0"
                class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground
                       text-[10px] font-bold flex items-center justify-center"
              >
                {{ filterCount }}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            class="z-50 w-72 rounded-xl border border-border bg-popover shadow-lg p-4"
            :side-offset="8"
          >
            <p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Filters</p>
            <div class="space-y-3">
              <div
                v-for="col in filterableColumns"
                :key="col.key"
                class="flex flex-col gap-1"
              >
                <label class="text-xs font-medium text-foreground">{{ col.label }}</label>
                <input
                  v-model="pendingFilters[col.key]"
                  :placeholder="`Filter by ${col.label.toLowerCase()}...`"
                  class="w-full px-3 py-1.5 text-sm rounded-lg border border-input bg-background text-foreground
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div class="flex items-center gap-2 mt-4 pt-3 border-t border-border">
              <PopoverClose as-child>
                <button
                  @click="applyFilters"
                  class="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium
                         hover:bg-primary transition-colors"
                >
                  Apply
                </button>
              </PopoverClose>
              <PopoverClose as-child>
                <button
                  @click="clearFilters"
                  class="flex-1 py-1.5 rounded-lg border border-input bg-background text-foreground
                         text-sm font-medium hover:bg-muted transition-colors"
                >
                  Clear
                </button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </PopoverRoot>

        <!-- Column visibility dropdown -->
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <button class="p-2 rounded-lg border border-input hover:bg-muted transition-colors text-muted-foreground">
              <Columns class="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="z-50 w-52 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border p-1">
            <DropdownMenuCheckboxItem
              v-for="col in columns"
              :key="col.key"
              :checked="col.visible !== false"
              @select="toggleColumn(col.key)"
              class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-sm text-foreground
                     cursor-pointer select-none outline-none hover:bg-muted transition-colors"
            >
              <span>{{ col.label }}</span>
              <DropdownMenuItemIndicator>
                <Check class="w-3.5 h-3.5 text-primary" />
              </DropdownMenuItemIndicator>
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>

        <!-- CSV export -->
        <button
          v-if="exportable"
          @click="exportCSV()"
          class="p-2 rounded-lg border border-input hover:bg-muted transition-colors text-muted-foreground"
          title="Export CSV"
        >
          <Download class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="tableLoading" class="px-4 py-4 space-y-2" role="status" aria-live="polite">
      <div
        v-for="n in pageSize"
        :key="n"
        class="h-12 bg-muted rounded animate-pulse"
      />
    </div>

    <!-- Error state -->
    <div
      v-else-if="tableError"
      class="flex flex-col items-center justify-center py-16 text-muted-foreground"
    >
      <AlertCircle class="w-12 h-12 mb-3 text-destructive" />
      <p class="text-base font-medium text-destructive">{{ tableError }}</p>
      <button
        v-if="onRetry"
        @click="onRetry"
        class="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium
               hover:bg-primary transition-colors"
      >
        Try again
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="filteredRows.length === 0"
      class="flex flex-col items-center justify-center py-16 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Inbox class="w-12 h-12 mb-3" />
      <p class="text-base font-medium">No results</p>
      <p class="text-sm mt-1">Try adjusting your search or filters</p>
    </div>

    <!-- Data state — table goes full-width, card provides the border -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead :class="cn('', stickyHeader && 'sticky top-0 z-10 bg-card')">
          <tr class="border-b border-border">
            <!-- Select-all checkbox -->
            <th v-if="selectable" class="w-10 px-3 py-3">
              <input
                type="checkbox"
                :checked="selectAllOnPage"
                :indeterminate="selected.size > 0 && !selectAllOnPage"
                @change="toggleSelectAll"
                class="rounded border-border"
                aria-label="Select all"
              />
            </th>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              class="relative"
              :aria-sort="col.sortable
                ? (sortState.key === col.key ? (sortState.dir === 'asc' ? 'ascending' : 'descending') : 'none')
                : undefined"
            >
              <div
                class="flex items-center gap-1 px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider select-none"
                :class="col.sortable ? 'cursor-pointer' : ''"
                :style="col.width ? { width: col.width + 'px', minWidth: (col.minWidth || 80) + 'px' } : { minWidth: (col.minWidth || 80) + 'px' }"
                @click="col.sortable && toggleSort(col.key)"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="inline-flex">
                  <ArrowUpDown v-if="sortState.key !== col.key" class="w-3 h-3 text-muted-foreground/50" />
                  <ChevronUp v-else-if="sortState.dir === 'asc'" class="w-3 h-3 text-foreground" />
                  <ChevronDown v-else class="w-3 h-3 text-foreground" />
                </span>
                <!-- Resize handle — independent of sortable -->
                <div
                  v-if="col.resizable !== false"
                  class="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary transition-colors active:bg-primary"
                  @mousedown.prevent.stop="startResize(col.key, $event)"
                />
              </div>
              <!-- Per-column filter input (secondary mode — only when columnFilterable prop is true) -->
              <input
                v-if="columnFilterable && col.filterable"
                v-model="columnFilters[col.key]"
                :placeholder="`Filter ${col.label.toLowerCase()}...`"
                class="w-full px-3 py-1.5 text-xs border-t border-border bg-background text-foreground
                       focus-visible:outline-none"
                @click.stop
              />
            </th>
            <!-- Expand column header spacer -->
            <th v-if="expandable" class="w-10" />
          </tr>
        </thead>
        <tbody>
          <template v-for="row in paginatedRows" :key="row[rowKey]">
            <tr
              class="border-b border-border hover:bg-muted/50 transition-colors"
              :class="{ 'bg-muted': selected.has(row[rowKey]) }"
            >
              <!-- Checkbox -->
              <td v-if="selectable" class="px-3 py-3">
                <input
                  type="checkbox"
                  :checked="selected.has(row[rowKey])"
                  @change="toggleRow(row[rowKey])"
                  class="rounded border-border"
                  aria-label="Select row"
                />
              </td>
              <!-- Data cells -->
              <td
                v-for="col in visibleColumns"
                :key="col.key"
                class="px-3 py-3 text-sm text-foreground whitespace-nowrap"
                :style="columnWidths[col.key] ? { width: columnWidths[col.key] + 'px' } : undefined"
              >
                <slot
                  v-if="$slots[`cell-${col.key}`]"
                  :name="`cell-${col.key}`"
                  :value="row[col.key]"
                  :row="row"
                />
                <span v-else>
                  {{ col.cell ? col.cell(row[col.key], row) : row[col.key] }}
                </span>
              </td>
              <!-- Expand toggle -->
              <td v-if="expandable" class="px-3 py-3">
                <button
                  @click="toggleExpand(row[rowKey])"
                  class="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SquareChevronDown v-if="!expanded.has(row[rowKey])" class="w-4 h-4" />
                  <ChevronUp v-else class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <!-- Expandable row content -->
            <tr v-if="expandable && expanded.has(row[rowKey])" class="bg-muted">
              <td
                :colspan="(visibleColumns.length || 1) + (selectable ? 1 : 0) + (expandable ? 1 : 0)"
                class="px-6 py-4 text-sm text-muted-foreground"
              >
                <slot name="expanded-row" :row="row" />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination footer — inside the card, separated by a top border -->
    <div
      v-if="!tableLoading && !tableError && totalPages > 0"
      class="px-4 py-3 border-t border-border"
    >
      <DataTablePagination
        v-bind="{ page, totalPages, pageSize, pageSizeOptions, totalFilteredCount, pageRangeText }"
        @update:page="setPage"
        @update:page-size="setPageSize"
      />
    </div>

  </div>
</template>
```

Props the component should accept:
- `columns: ColumnDef[]` (required)
- `rows: any[]` (required)
- `rowKey?: string` (default `'id'`)
- `pageSize?: number` (default `10`)
- `selectable?: boolean` (default `false`) — enables checkbox column
- `expandable?: boolean` (default `false`) — enables expand toggle column
- `loading?: boolean`
- `error?: string | null`
- `onRetry?: () => void`
- `searchable?: boolean` (default `true`) — shows search bar on the left
- `exportable?: boolean` (default `true`) — shows CSV button on the right
- `columnFilterable?: boolean` (default `false`) — shows secondary per-column filter inputs under each header (power-user mode; the primary filter UI is always the filter button overlay)
- `stickyHeader?: boolean` (default `true`)
- `pageSizeOptions?: number[]`

