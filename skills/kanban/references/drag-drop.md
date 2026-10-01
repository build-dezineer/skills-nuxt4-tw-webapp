# Kanban — Drag and Drop

Read this file before writing the drag-drop half of `useKanbanBoard.ts` or the card
and column template bindings. Covers the composable implementation, visual feedback
states, and the exact HTML5 drag event bindings.

## Drag and drop

Use the **HTML5 Drag and Drop API** — zero external dependencies, supported in all modern browsers.

### Composable implementation (`useKanbanBoard.ts`)
```ts
// Drag state
const dragData = ref<{ card: Card; fromColumnId: string } | null>(null)

function onDragStart(e: DragEvent, card: Card, fromColumnId: string) {
  dragData.value = { card, fromColumnId }
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', JSON.stringify({ cardId: card.id, fromColumnId }))
  setTimeout(() => (e.target as HTMLElement).classList.add('opacity-30'), 0)
}

function onDragEnd(e: DragEvent) {
  ;(e.target as HTMLElement).classList.remove('opacity-30', 'rotate-[2deg]')
  dragData.value = null
  dropTargetColumn.value = null
}

function onDragOver(e: DragEvent, columnId: string) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  dropTargetColumn.value = columnId
}

function onDragLeave(columnId: string) {
  if (dropTargetColumn.value === columnId) dropTargetColumn.value = null
}

function onDrop(e: DragEvent, toColumnId: string) {
  e.preventDefault()
  if (!dragData.value) return
  const { card, fromColumnId } = dragData.value
  if (fromColumnId === toColumnId) return
  moveCard(card.id, fromColumnId, toColumnId)
  dragData.value = null
  dropTargetColumn.value = null
}

const dropTargetColumn = ref<string | null>(null)

const isDropTarget = (columnId: string) => dropTargetColumn.value === columnId
```

### Visual feedback
| State | Classes applied |
|-------|----------------|
| **Dragging card** | `opacity-30 rotate-[2deg] scale-105` — ghost at original position |
| **Valid drop target column** | `ring-2 ring-primary/30 bg-primary/5` — column highlights |
| **Invalid drop target** | `cursor-no-drop` on the draggable card |
| **Drag handle** | `cursor-grab active:cursor-grabbing` — show `GripVertical` icon on hover |

### Template bindings per card
```html
<div
  draggable="true"
  @dragstart="onDragStart($event, card, column.id)"
  @dragend="onDragEnd"
  class="card"
>
```

### Template bindings per column (card list area)
```html
<div
  class="column-card-list"
  :class="isDropTarget(column.id) ? 'ring-2 ring-primary/30 bg-primary/5' : ''"
  @dragover="onDragOver($event, column.id)"
  @dragleave="onDragLeave(column.id)"
  @drop="onDrop($event, column.id)"
>
```

---

