# Data Table — Pagination Component

Read this file before writing `app/components/shared/DataTablePagination.vue`. It
carries the complete `<script setup>` block and `<template>`.

## `DataTablePagination.vue` pattern

**SFC structure (mandatory):** Same rule as `DataTable.vue` — `<script setup>`, `<template>`, then optional `<style scoped>` as a top-level block. Never inside `<template>`.

### `<script setup>` block

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  page: number
  totalPages: number
  pageSize: number
  pageSizeOptions: number[]
  totalFilteredCount: number
  pageRangeText: string
}

const props = defineProps<Props>()

defineEmits<{
  'update:page': [n: number]
  'update:pageSize': [n: number]
}>()

const pageNumbers = computed((): (number | '...')[] => {
  if (props.totalPages <= 7) return Array.from({ length: props.totalPages }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  const left = Math.max(2, props.page - 2)
  const right = Math.min(props.totalPages - 1, props.page + 2)
  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < props.totalPages - 1) pages.push('...')
  pages.push(props.totalPages)
  return pages
})
</script>
```

### `<template>`

The component renders inside the card footer `<div>` provided by `DataTable.vue`, so it needs no outer margin or padding.

```vue
<template>
  <nav aria-label="Table pagination">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rows per page:</span>
        <select
          :value="pageSize"
          @change="$emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
          class="bg-background border border-input rounded px-2 py-1 text-sm text-foreground"
        >
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="flex items-center gap-1">
        <button
          :disabled="page <= 1"
          @click="$emit('update:page', page - 1)"
          class="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <template v-for="n in pageNumbers" :key="n">
          <button
            v-if="n !== '...'"
            @click="$emit('update:page', n as number)"
            class="min-w-[2rem] h-8 rounded text-sm font-medium transition-colors"
            :class="n === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
          >
            {{ n }}
          </button>
          <span v-else class="px-1 text-muted-foreground">...</span>
        </template>
        <button
          :disabled="page >= totalPages"
          @click="$emit('update:page', page + 1)"
          class="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
    <p class="mt-2 text-xs text-muted-foreground">{{ pageRangeText }}</p>
  </nav>
</template>
```

