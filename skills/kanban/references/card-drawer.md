# Kanban — Card Detail Drawer

Read this file when building the card detail drawer: its scrollable sections and the
checklist section template. The drawer shell comes from the [drawer skill](../../drawer/SKILL.md).

## Card detail drawer

Uses the **DrawerRoot.vue** component (from the [drawer skill](../../drawer/SKILL.md)). Opens when a card is clicked.

### Drawer sections (scrollable)

| Section | Content |
|---------|---------|
| **Header** | Card title (editable `<input>`), close button (`X`), delete button (`Trash2`) |
| **Priority** | 4 segmented buttons: Low / Medium / High / Urgent |
| **Description** | `<textarea>` multiline, placeholder "Add a description…" |
| **Assignee** | Text input for name, avatar preview (first letter in circle) |
| **Due date** | Native `<input type="date">` |
| **Tags** | Tag chips with add/remove. Predefined pool: `bug`, `feature`, `improvement`, `design`, `docs`, `chore`, `testing` plus custom entry |
| **Checklist** | Title "Checklist" with add-item input. Each item shows checkbox + text + delete button. Progress summary in header. Items can be reordered within the list |
| **Activity log** | Timestamped list: "Alice moved this to In Progress", "Bob changed priority to High", "Alice added a checklist item". Show all entries in reverse chronological order. Each line = `icon + action + relative time ("2h ago")` |
| **Actions** | Save, Cancel, Delete card (confirmation dialog) |

### Checklist section template
```html
<div class="space-y-1.5">
  <div class="flex items-center justify-between">
    <span class="text-xs font-medium text-foreground">Checklist</span>
    <span class="text-[10px] text-muted-foreground">{{ done }}/{{ total }}</span>
  </div>
  <div v-for="item in checklist" :key="item.id" class="flex items-center gap-2">
    <input type="checkbox" :checked="item.done" @change="toggleChecklist(item.id)" class="accent-primary" />
    <span :class="item.done ? 'line-through text-muted-foreground' : 'text-foreground'" class="text-sm flex-1">{{ item.text }}</span>
    <button class="p-0.5 text-muted-foreground/50 hover:text-foreground" @click="removeChecklist(item.id)">
      <X class="w-3 h-3" />
    </button>
  </div>
  <button class="text-xs text-primary hover:underline flex items-center gap-1" @click="addChecklistItem">
    <Plus class="w-3 h-3" /> Add item
  </button>
</div>
```

---

