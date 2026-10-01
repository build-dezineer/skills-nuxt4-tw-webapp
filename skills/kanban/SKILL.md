---
name: kanban
description: >-
  Drag-and-drop kanban board with columns, cards, tags, priority levels, assignee
  avatars, due dates, WIP limits, search/filter and a card-detail drawer, built on the
  native HTML5 Drag and Drop API. Generates 12-15 realistic demo cards across four
  columns. Use for task boards, sprint planning and workflow screens.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "data, kanban, board"
  stack: "nuxt4, vue3, tailwind4, lucide"
---

# Kanban Board Skill

## When to use
Project management boards, task tracking, sprint planning, workflow management, any interface that needs columns of cards that users drag between states. Use when the page needs a visual, interactive task board with drag-and-drop, not a flat table or static list.

## Architecture (5 files)

| File | Path | Purpose |
|------|------|---------|
| **KanbanBoard.vue** | `app/components/features/kanban/KanbanBoard.vue` | Main board — columns container, toolbar, drag context |
| **KanbanColumn.vue** | `app/components/features/kanban/KanbanColumn.vue` | Single column — header, card list, add card button |
| **KanbanCard.vue** | `app/components/features/kanban/KanbanCard.vue` | Individual card — title, tags, priority, assignee, due date, checklist progress |
| **KanbanCardDrawer.vue** | `app/components/shared/KanbanCardDrawer.vue` | Side drawer for card detail view + edit |
| **useKanbanBoard.ts** | `app/composables/useKanbanBoard.ts` | Composable — columns, cards, drag-drop state, CRUD |

Pages use `KanbanBoard` directly. All column, card, and drag logic lives in the composable.

---

## Choosing what to read

| Writing | Read before writing |
|---|---|
| `useKanbanBoard.ts` drag-drop logic | [references/drag-drop.md](references/drag-drop.md) — composable + event bindings |
| Card detail drawer | [references/card-drawer.md](references/card-drawer.md) — drawer sections + checklist template |

Data structures, column/card structure, toolbar, mock data, states, and non-negotiables
stay on this page.

## Data structures

### Column
```ts
interface Column {
  id: string
  title: string
  cards: Card[]
  wipLimit?: number        // optional WIP limit — header turns red when exceeded
  createdAt: number
}
```

### Card
```ts
interface Card {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: Tag[]               // color-coded tags
  assignee: { name: string; avatar?: string }
  dueDate: string | null
  checklist: ChecklistItem[]
  activity: ActivityEntry[]
  createdAt: number
  updatedAt: number
}

interface Tag {
  name: string
  color: 'red' | 'orange' | 'amber' | 'green' | 'blue' | 'purple' | 'gray'
}

interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

interface ActivityEntry {
  action: string         // "moved card", "changed priority", "added checklist item"
  user: string
  timestamp: number
}
```

---

## Column structure

Each column is `min-w-[280px] max-w-[320px]` inside a horizontally scrollable container.

| Element | Classes |
|---------|---------|
| Column wrapper | `flex flex-col bg-muted/20 rounded-xl min-w-[280px] max-h-full` |
| Column header | `flex items-center justify-between px-3 py-2.5 shrink-0` |
| Column title | `text-sm font-semibold text-foreground` |
| Card count badge | `text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium` |
| WIP limit badge | `text-[11px] px-1.5 py-0.5 rounded-full font-medium` — `bg-red-100 text-red-700` when at/exceeded limit |
| Card list area | `flex-1 overflow-y-auto px-2 pb-2 space-y-2 min-h-[60px]` |
| Add card button | `text-xs text-muted-foreground hover:text-foreground px-3 py-2 flex items-center gap-1.5 transition-colors shrink-0` |

### WIP limit
When `column.wipLimit` is set and `column.cards.length >= column.wipLimit`, the count badge turns red and the column header shows a visual warning. Cards can still be dragged in but the warning is visible.

```html
<span v-if="column.wipLimit" class="text-[10px]"
  :class="column.cards.length >= column.wipLimit
    ? 'text-red-500 font-medium'
    : 'text-muted-foreground'">
  {{ column.cards.length }}/{{ column.wipLimit }}
</span>
```

### Column actions menu
Dropdown accessible via a `MoreHorizontal` (three dots) button:
- **Rename column** — inline edit on the title
- **Archive done** — remove all cards with `done: false` checklist items
- **Set WIP limit** — small number input popover
- **Clear column** — remove all cards (confirmation required)
- **Delete column** — only if empty

### Empty column state
```html
<div class="flex-1 flex items-center justify-center border-2 border-dashed border-muted rounded-lg mx-2 mb-2 min-h-[80px] transition-colors"
     :class="isDropTarget(column.id) ? 'border-primary/50 bg-primary/5' : ''">
  <p class="text-xs text-muted-foreground/50">Drop cards here</p>
</div>
```

---

## Card structure

Each card is a compact, information-rich rectangle:

| Element | Classes |
|---------|---------|
| Card wrapper | `bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative` |
| Title | `text-sm font-medium text-foreground leading-snug` |
| Description | `text-xs text-muted-foreground mt-1 line-clamp-2` |
| Tags row | `flex flex-wrap gap-1 mt-2` |
| Tag chip | `text-[10px] px-1.5 py-0.5 rounded-full font-medium` with predefined color classes (see below) |
| Priority badge | `text-[10px] px-1.5 py-0.5 rounded font-semibold` |
| Checklist progress | `text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1` — shows "3 of 5" with a small progress bar |
| Assignee + Due date | `flex items-center justify-between mt-2 text-[11px] text-muted-foreground` |
| Assignee avatar | `w-5 h-5 rounded-full bg-secondary text-[9px] font-semibold text-secondary-foreground flex items-center justify-center` (first letter of name) |
| Drag handle | `absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-muted-foreground/30 transition-opacity` with `GripVertical` icon |

### Tag color classes
```ts
const TAG_COLORS: Record<string, string> = {
  red:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  amber:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  green:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  gray:   'bg-muted text-muted-foreground',
}
```

### Priority colors
| Level | Badge |
|-------|-------|
| Low | `bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400` |
| Medium | `bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400` |
| High | `bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400` |
| Urgent | `bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400` |

### Checklist progress bar
```html
<div v-if="card.checklist.length > 0" class="flex items-center gap-1.5 mt-1.5">
  <div class="flex-1 h-1 rounded-full bg-muted overflow-hidden">
    <div class="h-full rounded-full bg-emerald-500 transition-all duration-300"
         :style="{ width: donePercent + '%' }" />
  </div>
  <span class="text-[10px] text-muted-foreground">
    {{ done }}/{{ total }}
  </span>
</div>
```

### Due date display
- **Today / overdue**: `text-red-500 font-medium` with `Calendar` icon
- **Tomorrow**: `text-amber-500`
- **Future**: `text-muted-foreground`
- **No date**: hidden

### Activity preview on card
Show the last activity entry (e.g., "Alice moved to In Progress") as a `text-[10px] text-muted-foreground/60 mt-1 truncate` line below the description. Full activity log is in the [card detail drawer](references/card-drawer.md).

---

## Toolbar (KanbanBoard header)

Positioned above the columns, sticky within the board container:

| Element | Behavior |
|---------|----------|
| **Search** | Text input, filters cards by title/description. `v-model` debounced 300ms |
| **Filter: Tag** | Dropdown multiselect of all unique tags across the board. Each tag shown with its color dot |
| **Filter: Priority** | Dropdown: All / Low / Medium / High / Urgent |
| **Filter: Assignee** | Dropdown of all unique assignee names across the board |
| **Clear filters** | Visible only when any filter is active. Resets all filters |
| **Quick-add** | Button "Add card" opens a small popover: title input + column picker dropdown. Saves on Enter |
| **Compact mode** | Toggle — reduces card padding (`p-2` instead of `p-3`), smaller text |
| **Column count** | `"4 columns · 15 cards · 2 filtered"` summary |

### Filter implementation
```ts
const activeTagFilter = ref<string | null>(null)
const activePriorityFilter = ref<string | null>(null)
const activeAssigneeFilter = ref<string | null>(null)
const searchQuery = ref('')
const debouncedSearch = refDebounced(searchQuery, 300)

const filteredColumns = computed(() => {
  const q = debouncedSearch.value.toLowerCase()
  return columns.value.map(col => ({
    ...col,
    cards: col.cards.filter(c => {
      if (q && !c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false
      if (activeTagFilter.value && !c.tags.some(t => t.name === activeTagFilter.value)) return false
      if (activePriorityFilter.value && c.priority !== activePriorityFilter.value) return false
      if (activeAssigneeFilter.value && c.assignee.name !== activeAssigneeFilter.value) return false
      return true
    }),
  }))
})
```

---

## Quick-add from toolbar

Accessible via "Add card" button in the toolbar. Opens a small popover:
```
┌──────────────────────────┐
│ Title: [______________] │
│ Column: [ Backlog ▼]    │
│  [ Create ]              │
└──────────────────────────┘
```
- Title input autofocuses, Enter submits, Escape closes
- Column dropdown defaults to the first column
- Creates a card with default priority (medium), empty tags, no assignee, no due date

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + ←` / `Ctrl + →` | Move selected card to adjacent column |
| `Ctrl + ↑` / `Ctrl + ↓` | Reorder selected card within column |
| `Enter` | Open card detail drawer (when a card is focused) |
| `Escape` | Close card drawer / cancel editing |
| `Delete` | Delete selected card (with confirmation) |
| `Ctrl + F` | Focus search input |
| `/` | Focus search input (when not in an input field) |

---

## Mock data

Generate 12-15 realistic demo cards across 4 default columns: **Backlog**, **In Progress**, **Review**, **Done**.

```ts
const DEFAULT_COLUMNS: Column[] = [
  {
    id: crypto.randomUUID(),
    title: 'Backlog',
    cards: [
      {
        id: crypto.randomUUID(),
        title: 'Design system audit',
        description: 'Review all components for consistency with the new palette',
        priority: 'medium',
        tags: [{ name: 'design', color: 'blue' }, { name: 'improvement', color: 'green' }],
        assignee: { name: 'Alice' },
        dueDate: '2026-07-01',
        checklist: [
          { id: crypto.randomUUID(), text: 'Review button components', done: true },
          { id: crypto.randomUUID(), text: 'Check form inputs', done: false },
        ],
        activity: [
          { action: 'created card', user: 'Alice', timestamp: Date.now() - 86400000 },
        ],
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
      },
      // ... 10-13 more cards with varied priority, tags, assignees, checklist, activity
    ],
  },
  { id: crypto.randomUUID(), title: 'In Progress', wipLimit: 4, cards: [/* 3-4 cards */] },
  { id: crypto.randomUUID(), title: 'Review', cards: [/* 2-3 cards */] },
  { id: crypto.randomUUID(), title: 'Done', cards: [/* 3-4 cards */] },
]
```

**Assignee avatars**: use `<img data-media-id="">` (the pipeline fills a real avatar and injects `:src`), or a REAL external mock URL on a plain `<img>`:
```
https://i.pravatar.cc/48?img=1
```
Size `48x48`, `rounded-full`. Never placeholder services (`placehold.co`) — they render as dead, non-editable grey boxes.

---

## 4 required states

### Loading
```
┌─────────────────────┐
│  [============]     │  ← Skeleton toolbar
│ ┌────┐ ┌────┐ ┌──┐ │
│ │ ░░ │ │ ░░ │ │░░│ │  ← 3-4 skeleton columns
│ │ ░░ │ │ ░░ │ │░░│ │     with 2-3 skeleton cards each
│ │ ░░ │ │ ░░ │ │░░│ │     (animate-pulse, bg-muted rounded-lg)
│ └────┘ └────┘ └──┘ │
└─────────────────────┘
```

### Empty
```html
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
    <LayoutPanelLeft class="w-6 h-6 text-muted-foreground/50" />
  </div>
  <h3 class="text-base font-semibold text-foreground mb-1">No cards yet</h3>
  <p class="text-sm text-muted-foreground max-w-xs">Create your first card or choose a template to get started.</p>
  <button class="mt-4 text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Add your first card</button>
</div>
```

### Error
```html
<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm mb-4">
  <AlertCircle class="w-4 h-4 shrink-0" />
  <span>Failed to load board. Please try again.</span>
  <button class="ml-auto text-sm font-medium underline underline-offset-2">Retry</button>
</div>
```

### Data
The full interactive board with columns, cards, toolbar, drag-and-drop — as documented in this skill.

---

## Responsive behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (<768px) | Single column stack with dropdown column picker. Cards are full-width |
| Tablet (768-1023px) | 2-3 columns visible. Board scrolls horizontally |
| Desktop (1024px+) | All columns visible. Full drag-and-drop, toolbar, card drawer |
| Large (1440px+) | Expanded whitespace between columns |

---

## Dark mode

All tokens from main.css adapt automatically (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`). Additional dark-mode considerations:

- Drop target highlight: `bg-primary/5 dark:bg-primary/10`
- Tag colors have explicit `dark:` variants
- Checklist progress bar: `bg-muted dark:bg-muted/50`

---

## Non-negotiables

1. Use **HTML5 Drag and Drop API** — never import `useSortable`, `sortablejs`, or any drag-and-drop library. The native API has zero dependencies
2. Card ID must be unique — use `crypto.randomUUID()` (built into all modern browsers and Node.js)
3. Composable `useKanbanBoard` owns ALL state — never store board state in individual components
4. Title is the only required field on a card — description, tags, priority, assignee, due date, checklist, activity are all optional
5. Every interactive element has hover and focus states
6. Card drawer uses `DrawerRoot.vue` from `~/components/shared/DrawerRoot.vue` — never implement drawer from scratch
7. Mock data uses `<img data-media-id="">` for avatars (the pipeline fills them) — never inline base64 or hardcoded placeholder image URLs
8. Search debounces at 300ms — never filter on every keystroke
9. Empty columns show the drop-zone hint — never collapse or hide empty columns
10. Board scrolls horizontally, not vertically — columns fill viewport height with internal scroll
11. All icons from `lucide-vue-next` — validate against `lucide-icons.txt`
12. SFC block order: `<script setup>` → `<template>` → `<style scoped>`
13. Checklist items use `<input type="checkbox" class="accent-primary">` — never custom checkbox implementations
14. Activity log uses relative timestamps via a `formatRelativeTime()` helper — install date-fns if needed, or use `Intl.RelativeTimeFormat`
15. WIP limit is a soft limit (warning, not blocking) — cards can always be dropped regardless of limit
16. Keyboard shortcuts are only active when the board is focused — never intercept global shortcuts

---

## Required imports

| Symbol | Source |
|--------|--------|
| `ref`, `computed`, `watch`, `onMounted` | `vue` |
| `useRoute` | `vue-router` |
| `cn` | `~/utils/cn` |
| `DrawerRoot` | `~/components/shared/DrawerRoot.vue` |
| `AlertCircle`, `Plus`, `Search`, `X`, `MoreHorizontal`, `GripVertical`, `Calendar`, `ChevronLeft`, `ChevronRight`, `Trash2` | `lucide-vue-next` |

Validate every icon against `app/assets/lucide-icons.txt`.

## Colour & polish

- One token per column, echoed as the card's top border.
- Render category colour as a tinted chip: `bg-[hsl(var(--chart-N)/0.12)] text-[hsl(var(--chart-N))]`.
- Card lift on drag-hover.
- `success`/`destructive` are for genuine good/bad meaning only — never decoration.
