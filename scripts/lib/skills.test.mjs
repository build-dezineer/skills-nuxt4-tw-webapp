import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findRelativeLinks, parseFrontmatter, resolveRelativeLink, stripFencedCode } from './skills.mjs'

test('parseFrontmatter returns data and body', () => {
  const text = '---\nname: hero\ndescription: Builds a hero.\n---\n\n# Hero\n\nBody.\n'
  const { data, body } = parseFrontmatter(text)
  assert.equal(data.name, 'hero')
  assert.equal(data.description, 'Builds a hero.')
  assert.equal(body, '\n# Hero\n\nBody.\n')
})

test('parseFrontmatter supports folded scalars and quoted metadata', () => {
  const text = '---\nname: hero\ndescription: >-\n  Builds a hero.\n  Use when needed.\nmetadata:\n  version: "1.0.0"\n---\nbody\n'
  const { data } = parseFrontmatter(text)
  assert.equal(data.description, 'Builds a hero. Use when needed.')
  assert.equal(data.metadata.version, '1.0.0')
})

test('parseFrontmatter rejects missing frontmatter', () => {
  assert.throws(() => parseFrontmatter('# No frontmatter\n'), /missing YAML frontmatter/)
})

test('parseFrontmatter rejects unclosed frontmatter', () => {
  assert.throws(() => parseFrontmatter('---\nname: hero\n'), /missing YAML frontmatter/)
})

test('findRelativeLinks keeps local targets and skips external ones', () => {
  const markdown = [
    'See [hero](../hero/SKILL.md) and [docs](https://example.com/x).',
    '![logo](assets/logo.svg)',
    '[anchor](#section) [mail](mailto:x@example.com)',
    '[page](references/guide.md#step-2)',
  ].join('\n')
  assert.deepEqual(findRelativeLinks(markdown), [
    '../hero/SKILL.md',
    'assets/logo.svg',
    'references/guide.md',
  ])
})

test('findRelativeLinks ignores links inside fenced code', () => {
  const markdown = '```md\n[not a link](../missing/SKILL.md)\n```\n[real](references/x.md)\n'
  assert.deepEqual(findRelativeLinks(markdown), ['references/x.md'])
})

test('stripFencedCode removes fenced blocks only', () => {
  const markdown = 'before\n```js\nconst x = 1\n```\nafter\n~~~\ntilde\n~~~\n'
  assert.equal(stripFencedCode(markdown), 'before\n\nafter\n\n')
})

test('resolveRelativeLink resolves against the containing file directory', () => {
  assert.equal(
    resolveRelativeLink('/repo/skills/kanban', 'SKILL.md', '../drawer/SKILL.md'),
    '/repo/skills/drawer/SKILL.md',
  )
  assert.equal(
    resolveRelativeLink('/repo/skills/kanban', 'references/card-drawer.md', '../../drawer/SKILL.md'),
    '/repo/skills/drawer/SKILL.md',
  )
  assert.equal(
    resolveRelativeLink('/repo/skills/kanban', 'references/card-drawer.md', '../assets/board.svg'),
    '/repo/skills/kanban/assets/board.svg',
  )
})
