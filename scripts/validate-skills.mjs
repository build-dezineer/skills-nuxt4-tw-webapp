#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ALLOWED_FRONTMATTER_FIELDS,
  ALLOWED_METADATA_KEYS,
  APP_TYPE_VOCABULARY,
  COMPATIBILITY_MAX,
  DESCRIPTION_MAX,
  INDEX_PATH,
  NAME_MAX,
  NAME_PATTERN,
  REQUIRED_STACK_TOKENS,
  SEMVER_PATTERN,
  SKILLS_DIR,
  STACK_VOCABULARY,
  findRelativeLinks,
  listFiles,
  listSkillDirs,
  readSkill,
  resolveRelativeLink,
  validateCheckerSource,
} from './lib/skills.mjs'

const problems = []
const fail = (skill, message) => problems.push(`${skill}: ${message}`)

let index
try {
  index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'))
} catch (error) {
  fail('skills/index.json', `cannot be read: ${error.message}`)
}

const names = listSkillDirs()
if (names.length === 0) fail('skills/', 'no skill directories found')

for (const name of names) {
  const skillDir = join(SKILLS_DIR, name)
  if (!existsSync(join(skillDir, 'SKILL.md'))) {
    fail(name, 'missing SKILL.md')
    continue
  }
  if (existsSync(join(skillDir, 'scripts'))) {
    fail(name, 'must not contain a scripts/ directory')
  }

  const checksDir = join(skillDir, 'checks')
  if (existsSync(checksDir)) {
    const entries = readdirSync(checksDir, { withFileTypes: true })
    if (entries.length !== 1 || entries[0].name !== 'validate.mjs' || !entries[0].isFile()) {
      fail(name, 'checks/ may contain only validate.mjs')
    } else {
      const result = validateCheckerSource(readFileSync(join(checksDir, 'validate.mjs'), 'utf8'))
      if (!result.ok) fail(name, `checks/validate.mjs ${result.reason}`)
    }
  }

  let skill
  try {
    skill = readSkill(name)
  } catch (error) {
    fail(name, error.message)
    continue
  }
  const { data, text } = skill

  for (const key of Object.keys(data)) {
    if (key.startsWith('dezineer-')) fail(name, `host-specific frontmatter field: ${key}`)
    else if (!ALLOWED_FRONTMATTER_FIELDS.has(key)) fail(name, `unexpected frontmatter field: ${key}`)
  }

  if (typeof data.name !== 'string' || !NAME_PATTERN.test(data.name) || data.name.length > NAME_MAX) {
    fail(name, `name must match ${NAME_PATTERN} and be at most ${NAME_MAX} characters`)
  } else if (data.name !== name) {
    fail(name, `name "${data.name}" must match the directory name`)
  }

  if (typeof data.description !== 'string' || data.description.trim() === '') {
    fail(name, 'description is required and must be a non-empty string')
  } else if (data.description.length > DESCRIPTION_MAX) {
    fail(name, `description is ${data.description.length} characters (max ${DESCRIPTION_MAX})`)
  }

  if (data.license !== 'Apache-2.0') fail(name, 'license must be Apache-2.0')

  if (data.compatibility !== undefined) {
    if (typeof data.compatibility !== 'string') fail(name, 'compatibility must be a string')
    else if (data.compatibility.length > COMPATIBILITY_MAX) {
      fail(name, `compatibility is ${data.compatibility.length} characters (max ${COMPATIBILITY_MAX})`)
    }
  }

  const metadata = data.metadata
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    fail(name, 'metadata is required and must be a string-to-string mapping')
  } else {
    for (const [key, value] of Object.entries(metadata)) {
      if (!ALLOWED_METADATA_KEYS.has(key)) fail(name, `unexpected metadata key: ${key}`)
      if (typeof value !== 'string') fail(name, `metadata.${key} must be a string`)
    }
    if (typeof metadata.version !== 'string' || !SEMVER_PATTERN.test(metadata.version)) {
      fail(name, 'metadata.version must be a semver string')
    }
    if (typeof metadata.tags !== 'string' || metadata.tags.trim() === '') {
      fail(name, 'metadata.tags must be a non-empty string')
    }
    if (typeof metadata.stack !== 'string' || metadata.stack.trim() === '') {
      fail(name, 'metadata.stack must be a non-empty string')
    } else {
      const tokens = metadata.stack.split(',').map((token) => token.trim()).filter(Boolean)
      if (tokens.length > 8) fail(name, `metadata.stack has ${tokens.length} tokens (max 8)`)
      for (const token of tokens) {
        if (!STACK_VOCABULARY.has(token)) fail(name, `metadata.stack token not in vocabulary: ${token}`)
      }
      for (const required of REQUIRED_STACK_TOKENS) {
        if (!tokens.includes(required)) fail(name, `metadata.stack is missing base token: ${required}`)
      }
    }
    if (metadata['app-type'] !== undefined) {
      if (typeof metadata['app-type'] !== 'string' || metadata['app-type'].trim() === '') {
        fail(name, 'metadata.app-type must be a non-empty string')
      } else {
        const tokenList = metadata['app-type'].split(/[,|]+/).map((token) => token.trim()).filter(Boolean)
        if (tokenList.length === 0) fail(name, 'metadata.app-type must name at least one app type')
        for (const token of tokenList) {
          if (!APP_TYPE_VOCABULARY.has(token)) fail(name, `metadata.app-type token not in vocabulary: ${token}`)
        }
      }
    }
  }

  const files = listFiles(skillDir)
  for (const file of files) {
    if (file.endsWith('.md')) {
      const markdown = readFileSync(join(skillDir, file), 'utf8')
      for (const target of findRelativeLinks(markdown)) {
        if (!existsSync(resolveRelativeLink(skillDir, file, target))) {
          fail(name, `${file}: relative link does not resolve: ${target}`)
        }
      }
    }
    const content = readFileSync(join(skillDir, file), 'utf8')
    if (content.includes('dezineer-')) fail(name, `${file}: contains forbidden host-specific string "dezineer-"`)
  }

  const entry = index?.skills?.find((candidate) => candidate.name === name)
  if (!entry) {
    fail(name, 'missing from skills/index.json — run `npm run index`')
  } else {
    for (const file of entry.files ?? []) {
      if (!files.includes(file)) fail(name, `skills/index.json lists a missing file: ${file}`)
    }
    if (entry.version !== metadata?.version) {
      fail(name, 'skills/index.json version does not match metadata.version — run `npm run index`')
    }
  }
}

for (const entry of index?.skills ?? []) {
  if (!names.includes(entry.name)) fail(entry.name, 'skills/index.json entry has no matching directory')
}

if (problems.length > 0) {
  console.error(`validate-skills: ${problems.length} problem(s)`)
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}
console.log(`validate-skills: ${names.length} skills OK`)
