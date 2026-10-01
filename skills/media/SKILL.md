---
name: media
description: >-
  Placeholder-aware media contract: emit plain `<img data-media-id>` and `<video
  data-media-id>` elements and the build pipeline injects real asset paths after
  download. Covers static and responsive images, videos with poster, and CSS background
  images. Use whenever a section needs to display media or reserve space for assets the
  designer will replace later.
license: Apache-2.0
compatibility: >-
  Requires a Dezineer-scaffolded Nuxt 4 project (Tailwind v4 design tokens, shared
  components, media pipeline). Guidance targets Dezineer's generator; patterns may
  transfer to a plain Nuxt project with those primitives.
metadata:
  version: "1.0.0"
  tags: "media, images"
  stack: "nuxt4, vue3, tailwind4"
---

# Media Skill

## When to use
Any image or video element in the UI — hero images, card thumbnails, gallery grids, avatars, feature previews, background images, inline videos, autoplay loops. Use this skill whenever a page needs to display or reserve space for media that the designer will later replace with real assets.

## The media contract (plain tags + `data-media-id`)

There are no media wrapper components in this project. Every pipeline-managed media element is a **plain HTML tag carrying a `data-media-id` attribute**:

| Element | Use for |
|---------|---------|
| `<img data-media-id="...">` | All images — heroes, thumbnails, avatars, cards, gallery items |
| `<video data-media-id="...">` | All videos — demo videos, background loops, feature previews |

**You never write `src` for a pipeline-managed element.** After generation, the pipeline downloads a real asset for each id and injects `:src="'./media/<id>.<ext>'"` into the code. For elements inside a `v-for`, give each data object a `mediaId` field (an allocated id, or `''` when none is available) and bind `:data-media-id="item.mediaId"` — the pipeline bakes a `mediaSrc` path into every object and wires `:src="item.mediaSrc"`.

### The three id cases

Every `<img>` / `<video>` that represents pipeline-managed media must carry `data-media-id`:

1. **Allocated id** — the id from the spec's Image Prompts section (`data-media-id="<id>"`). The pipeline downloads a real asset and injects it.
2. **No id available for this section** — emit `data-media-id=""` with a meaningful `alt`. The pipeline registers the empty id, finds a relevant stock image, and fills it — the element becomes selectable and replaceable in the builder.
3. **`:src` only for REAL external mock URLs** (avatars, logos, demo thumbnails via picsum.photos or similar). Never placeholder services (`placehold.co`), never inline `data:image/svg` grey boxes.

An image that represents a real entity is NEVER a placeholder. A hardcoded placeholder URL or grey-box data-URI renders as a dead, non-editable element the designer cannot replace — no image selector, no real photo, forever.

### Choosing media dimensions

Media dimensions are **not fixed** — always choose `width` and `height` attributes (and an aspect-ratio class) that match the element's role in the design. The media occupies exactly the space the real image will eventually occupy, so sizing it correctly is what makes the layout look accurate.

| Context | Width | Height | Ratio |
|---------|------:|-------:|-------|
| Full-width hero / page banner | 1920 | 1080 | 16/9 |
| Section hero / feature banner | 1200 | 675 | 16/9 |
| Blog / article header | 1200 | 630 | ~16/9 |
| Open Graph / social share | 1200 | 630 | ~16/9 |
| Card thumbnail (landscape) | 600 | 400 | 3/2 |
| Card thumbnail (standard) | 400 | 300 | 4/3 |
| Gallery grid image | 800 | 600 | 4/3 |
| Portrait photo | 400 | 600 | 2/3 |
| Avatar (large profile) | 128 | 128 | 1/1 |
| Avatar (small / inline) | 48 | 48 | 1/1 |
| Logo / brand mark | 200 | 80 | — |
| Video (full HD) | 1920 | 1080 | 16/9 |
| Video (standard) | 1280 | 720 | 16/9 |
| Video thumbnail | 640 | 360 | 16/9 |
| Mobile portrait video | 720 | 1280 | 9/16 |

Pick the row that best matches the element's purpose in the design. If the design calls for a non-standard size (e.g. a `300×200` sidebar image), use those exact dimensions — the table is a guide, not a constraint.

---

## Usage examples

```vue
<!-- 1. Fluid hero image, 16:9 — pipeline injects :src after download -->
<img
  data-media-id="hBYQIcU_zfIs_DwiLCVap"
  alt="Team working together"
  width="1920"
  height="1080"
  loading="eager"
  decoding="async"
  class="w-full aspect-video object-cover"
/>

<!-- 2. Card thumbnail, 3:2 -->
<img
  data-media-id="X8_ecaVr5dMqB-Gm_hvBL"
  alt="Product Photo"
  width="600"
  height="400"
  loading="lazy"
  decoding="async"
  class="w-full aspect-[3/2] object-cover rounded-lg"
/>

<!-- 3. Square avatar, 48px — small inline avatar -->
<img
  data-media-id="YypEUe0Soz7hdUXZfpplu"
  alt="Alice Johnson"
  width="48"
  height="48"
  loading="lazy"
  decoding="async"
  class="w-12 h-12 aspect-square rounded-full object-cover"
/>

<!-- 4. Gallery grid item inside a v-for — per-object mediaId,
     the pipeline bakes mediaSrc into every object -->
<img
  v-for="item in items"
  :key="item.id"
  :data-media-id="item.mediaId"
  :src="item.mediaSrc"
  :alt="item.alt"
  width="800"
  height="600"
  loading="lazy"
  decoding="async"
  class="w-full aspect-[4/3] object-cover"
/>

<!-- 5. Real external mock URL (allowed exception — a specific person's avatar) -->
<img
  src="https://i.pravatar.cc/96?img=32"
  alt="Alice Johnson"
  width="48"
  height="48"
  loading="lazy"
  decoding="async"
  class="w-12 h-12 rounded-full object-cover"
/>

<!-- 6. Autoplaying background video loop (muted required by browser) -->
<video
  data-media-id="jsJMGnqU6lbkMrsACXWVW"
  autoplay
  muted
  loop
  playsinline
  width="1920"
  height="1080"
  class="w-full aspect-video object-cover"
></video>

<!-- 7. Player video with controls -->
<video
  data-media-id="V9zXwcAkUWb_YS65Irk0P"
  controls
  preload="metadata"
  width="1280"
  height="720"
  class="w-full aspect-video object-cover"
>
  <track kind="captions" />
  Your browser does not support the video element.
</video>
```

---

## Background images

For full-bleed section backgrounds, use `<img data-media-id="...">` with absolute positioning.

Do NOT use inline `:style="{ backgroundImage: url(...) }"` for images that need pipeline management. The `<img data-media-id="...">` pattern is the only way the pipeline can inject downloaded image paths.

---

## Common aspect ratios

| Ratio | Tailwind class | Use for |
|-------|----------------|---------|
| 16:9 | `aspect-video` | Videos, hero images, feature cards |
| 4:3 | `aspect-[4/3]` | Standard photography |
| 3:2 | `aspect-[3/2]` | Landscape photos |
| 1:1 | `aspect-square` | Avatars, thumbnails, square cards |
| 9:16 | `aspect-[9/16]` | Portrait / mobile-first media |
| 21:9 | `aspect-[21/9]` | Ultra-wide cinema banners |

Apply the aspect class to the `<img>`/`<video>` element itself (paired with `object-cover`) so the box keeps its shape before the real asset loads.

---

## Non-negotiables

1. `alt` is **always** passed to every `<img>` — never omit it. Purely decorative images use `alt=""`
2. `loading="lazy"` is the default. Only use `loading="eager"` for the first visible image above the fold (e.g. hero)
3. `decoding="async"` on every `<img>` element
4. **Never write `src`/`:src` for a pipeline-managed element** — emit the tag with `data-media-id` and let the pipeline inject the path. `:src` is allowed ONLY for real external mock URLs (avatars, logos)
5. **Always pass explicit `width` and `height` sized to the design context** — use the dimensions table as a guide. The element should occupy exactly the space the real asset will fill
6. `alt` text MUST be descriptive: `"Hero Banner"`, `"Team Photo"`, `"Product Demo"` — never `"image"`, `"img"`, a filename, or a URL
7. For repeated items in a `v-for`, give EACH item its own `mediaId` field and bind `:data-media-id="item.mediaId"` — never share one id across items, never repeat one static id for every row
8. `<video>` elements MUST include `<track kind="captions" />` and a text fallback (`Your browser does not support the video element.`)
9. Autoplay videos MUST be muted and `playsinline` — never render an autoplay video without `muted`
10. **An ambient video (autoplay/loop/muted) must NEVER render controls** — omit the `controls` attribute on an autoplaying loop
11. CSS background images MUST be paired with a `bg-{color}` CSS-variable class (e.g. `bg-muted`) as a fallback — never standalone inline style
12. SFC block order: `<script setup lang="ts">` → `<template>` → `<style scoped>` (if needed). `<style>` is NEVER placed inside `<template>`
13. All class composition uses `cn()` from `~/utils/cn` — never raw string concatenation or template literals for Tailwind classes

## Colour & polish

- Placeholder tint from `muted`; aspect-ratio class to prevent shift.
