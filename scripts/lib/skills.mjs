import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

export const REPO_ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)))
export const SKILLS_DIR = join(REPO_ROOT, 'skills')
export const INDEX_PATH = join(SKILLS_DIR, 'index.json')

export const ALLOWED_FRONTMATTER_FIELDS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
])

export const ALLOWED_METADATA_KEYS = new Set(['version', 'tags', 'stack', 'app-type'])

/** App types a skill may target (`metadata.app-type`); `both` = website+webapp,
 *  `all` = every known type. Absent = the pack's `appType` default. */
export const APP_TYPE_VOCABULARY = new Set(['website', 'webapp', 'mobile', 'both', 'all'])

export const STACK_VOCABULARY = new Set([
  'nuxt4',
  'vue3',
  'tailwind4',
  'radix-vue',
  'vueuse',
  'gsap',
  'swiper',
  'tresjs',
  'three',
  'chart.js',
  'lucide',
  'lenis',
  'split-type',
])

export const REQUIRED_STACK_TOKENS = ['nuxt4', 'vue3', 'tailwind4']

export const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/
export const DESCRIPTION_MAX = 1024
export const COMPATIBILITY_MAX = 500
export const NAME_MAX = 64

export function listSkillDirs() {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort()
}

export function listFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue
    const absolute = join(entry.parentPath ?? entry.path, entry.name)
    files.push(relative(dir, absolute).split(sep).join('/'))
  }
  return files.sort()
}

export const CHECKER_REL_PATH = 'checks/validate.mjs'
export const CHECKER_MAX_BYTES = 64 * 1024

const CHECKER_FORBIDDEN = [
  { re: /^[ \t]*import[\s(]/m, label: 'import statements' },
  { re: /\bimport\s*\(/, label: 'dynamic import()' },
  { re: /\brequire\s*\(/, label: 'require()' },
  { re: /\bprocess\b/, label: 'process access' },
  { re: /\beval\s*\(/, label: 'eval()' },
  { re: /\bnew\s+Function\b/, label: 'new Function' },
  { re: /\bfetch\s*\(/, label: 'fetch()' },
  { re: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
  { re: /\bWebSocket\b/, label: 'WebSocket' },
  { re: /\bchild_process\b/, label: 'child_process' },
]

/**
 * The one accepted shape for a skill capability checker. Mirrors the app's
 * install/run gate (see the host's checker-convention module): exactly
 * `checks/validate.mjs`, one `export default function validate(input)`, no
 * host access. The checker runs in a sandbox — this check keeps the published
 * content honest before it ever ships.
 */
export function validateCheckerSource(source) {
  if (Buffer.byteLength(source, 'utf8') > CHECKER_MAX_BYTES) {
    return { ok: false, reason: 'is larger than 64 KB' }
  }
  const hit = CHECKER_FORBIDDEN.find((entry) => entry.re.test(source))
  if (hit) return { ok: false, reason: `must not use ${hit.label}` }
  if ((source.match(/^[ \t]*export\b/gm) ?? []).length > 1) {
    return { ok: false, reason: 'must export exactly one function' }
  }
  if (!/^[ \t]*export[ \t]+default[ \t]+function[ \t]+validate[ \t]*\(/m.test(source)) {
    return { ok: false, reason: 'must define `export default function validate(input)`' }
  }
  return { ok: true }
}

export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)
  if (!match) {
    throw new Error('missing YAML frontmatter (file must start with ---)')
  }
  let data
  try {
    data = yaml.load(match[1])
  } catch (error) {
    throw new Error(`invalid YAML frontmatter: ${error.message}`)
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('frontmatter must be a YAML mapping')
  }
  return { data, body: text.slice(match[0].length) }
}

export function readSkill(name) {
  const dir = join(SKILLS_DIR, name)
  const text = readFileSync(join(dir, 'SKILL.md'), 'utf8')
  const { data, body } = parseFrontmatter(text)
  return { name, dir, text, data, body }
}

export function collectIndex() {
  return listSkillDirs().map((name) => {
    const { data } = readSkill(name)
    const version = data.metadata?.version
    if (typeof version !== 'string' || !SEMVER_PATTERN.test(version)) {
      throw new Error(`skills/${name}/SKILL.md: metadata.version must be a semver string`)
    }
    return { name, files: listFiles(join(SKILLS_DIR, name)), version }
  })
}

export function stripFencedCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '')
}

export function findRelativeLinks(markdown) {
  const targets = new Set()
  for (const match of stripFencedCode(markdown).matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '')
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue
    const path = target.split('#')[0].split('?')[0]
    if (path) targets.add(path)
  }
  return [...targets].sort()
}

export function resolveRelativeLink(baseDir, file, target) {
  return join(baseDir, dirname(file), target)
}
