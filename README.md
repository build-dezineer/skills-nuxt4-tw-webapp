# Nuxt 4 + Tailwind Webapp Skills

[![Validate skills](https://github.com/build-dezineer/skills-nuxt4-tw-webapp/actions/workflows/validate.yml/badge.svg)](https://github.com/build-dezineer/skills-nuxt4-tw-webapp/actions/workflows/validate.yml)

A library of [Agent Skills](https://agentskills.io) for building production-quality
web applications on a **Nuxt 4 + Tailwind CSS v4** stack. The skills are the design
guidance behind Dezineer's webapp generator: each one tells an agent how to build a
coherent surface of an app — data tables, forms, drawers, dashboards, auth, commerce —
to a quality floor, using the stack's pre-built primitives instead of reinventing them.

Skills follow the open Agent Skills format, so they work in any compatible client
(Claude Code, Codex, OpenCode, Dezineer, and others) — install once, use everywhere.

Looking for marketing-website sections instead? See the sibling library
[Nuxt 4 + Tailwind Website Skills](https://github.com/build-dezineer/skills-nuxt4-tw-website).

## Skills

| Skill | Builds |
|---|---|
| [`table`](skills/table/SKILL.md) | Full data table — sorting, filtering, pagination, CSV export, selection, expandable rows |
| [`form`](skills/form/SKILL.md) | Drawer and inline form patterns with validation and loading states |
| [`modal`](skills/modal/SKILL.md) | Centred confirmation and detail dialogs on Radix-Vue Dialog |
| [`drawer`](skills/drawer/SKILL.md) | Slide-in panels via the pre-built `DrawerRoot` — right, left and bottom |
| [`media`](skills/media/SKILL.md) | Placeholder-aware image/video contract for the media pipeline |
| [`sidenav`](skills/sidenav/SKILL.md) | App sidebar — collapsible, icon rail, floating and overlay variants |
| [`auth`](skills/auth/SKILL.md) | Login, register, reset, OTP and verify-email pages in four layouts |
| [`chart`](skills/chart/SKILL.md) | Chart.js line/bar/doughnut charts via the pre-built `ChartWrapper` |
| [`metric-card`](skills/metric-card/SKILL.md) | KPI/stat cards via the pre-built `MetricCard` — five variants |
| [`dashboard-motion`](skills/dashboard-motion/SKILL.md) | Count-up numbers and `.stagger-children` entrance motion |
| [`kanban`](skills/kanban/SKILL.md) | Drag-and-drop board with columns, cards, WIP limits and a detail drawer |
| [`commerce-core`](skills/commerce-core/SKILL.md) | Commerce foundation — types, `useCart`, `useProducts`, `useOrders` |
| [`product-catalog`](skills/product-catalog/SKILL.md) | Storefront product browsing with search, category chips and sort |
| [`product-detail`](skills/product-detail/SKILL.md) | Storefront product page with gallery, options and add-to-cart |
| [`cart-checkout`](skills/cart-checkout/SKILL.md) | Cart drawer, checkout and order confirmation with mock payment |
| [`commerce-admin`](skills/commerce-admin/SKILL.md) | Back-office orders, inventory, sales dashboard and fulfillment |

## Install

Each skill is a folder containing a `SKILL.md` plus optional `references/` and
`evals/`. Copy or symlink the skill folders into your client's skills directory.

**skills CLI** — installs into any detected agent (Claude Code, Codex, OpenCode,
Cursor, and [many more](https://github.com/vercel-labs/skills#supported-agents)):

```bash
npx skills add build-dezineer/skills-nuxt4-tw-webapp
```

Use `--list` to preview the skills first, or `--skill table` to install one.

**Dezineer** — Settings → **Skills** → install from GitHub with:

```
https://github.com/build-dezineer/skills-nuxt4-tw-webapp
```

**Claude Code** — personal (`~/.claude/skills/`) or project (`.claude/skills/`):

```bash
git clone --depth 1 https://github.com/build-dezineer/skills-nuxt4-tw-webapp.git
mkdir -p ~/.claude/skills
cp -R skills-nuxt4-tw-webapp/skills/*/ ~/.claude/skills/
```

Claude Code also accepts symlinked skill folders, which keeps `git pull` as the update
mechanism:

```bash
ln -s "$PWD/skills-nuxt4-tw-webapp/skills/table" ~/.claude/skills/table
```

**Codex** — `~/.agents/skills/` (all projects) or `.agents/skills/` (project):

```bash
mkdir -p ~/.agents/skills
cp -R skills-nuxt4-tw-webapp/skills/*/ ~/.agents/skills/
```

**OpenCode** — global (`~/.config/opencode/skills/`) or project
(`.opencode/skills/`). OpenCode also reads the Claude- and agents-compatible
directories above:

```bash
mkdir -p ~/.config/opencode/skills
cp -R skills-nuxt4-tw-webapp/skills/*/ ~/.config/opencode/skills/
```

**Any other Agent Skills client** — copy the skill folders into its skills directory.
The format is portable; only the discovery path changes.

## Compatibility

The guidance targets a **Dezineer-scaffolded Nuxt 4 project**: Tailwind v4 design
tokens, the app shell (`layout: default`, `SidebarNav`), shared components
(`DataTable`, `DrawerRoot`, `ChartWrapper`, `MetricCard`, …), and the `data-media-id`
media pipeline. `compatibility` and `metadata.stack` on each skill declare this.
Patterns may transfer to a plain Nuxt 4 project that provides the same primitives.

Each skill folder is self-contained; you can install only the skills relevant to a
project.

## Repository structure

```
skills/<name>/SKILL.md      # required: frontmatter + instructions
skills/<name>/references/   # optional: detail loaded only when the skill says to
skills/<name>/checks/       # optional: checks/validate.mjs capability checker
skills/<name>/evals/        # optional: evals/evals.json test cases
pack.json                   # pack display metadata (name, description)
skills/index.json           # generated catalog (pack metadata + name, files, version)
scripts/                    # repo tooling (validation, index build)
```

## Validate

Requires Node.js 20+ and, for the spec validator, [uv](https://docs.astral.sh/uv/).

```bash
npm ci
npm run validate        # repo checks: frontmatter, links, index inputs
npm run validate:spec   # official skills-ref validation (agentskills.io)
npm run index:check     # committed index.json is up to date
```

CI runs all three on every push and pull request.

## Versioning

Every skill starts at `1.0.0` in `metadata.version`. Content edits bump patch or
minor; a change to a skill's inputs or section contract bumps major. Repo tags
(`v1.0.0`) pin snapshots for consumers that vendor the library.

## Evals

Skills with objectively verifiable output ship test cases in `evals/evals.json`
(currently `table`, `form`, `chart` and `metric-card`). Run them with Anthropic's
[`skill-creator`](https://github.com/anthropics/skills/tree/main/skills/skill-creator),
or manually by running each prompt with and without the skill and comparing outputs.
Eval workspaces are local and gitignored.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the authoring contract — frontmatter
fields, description formula, body guidelines, versioning, and evals.

## License

[Apache-2.0](LICENSE) © Dezineer
