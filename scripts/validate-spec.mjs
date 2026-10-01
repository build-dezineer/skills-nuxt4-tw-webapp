#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { SKILLS_DIR, listSkillDirs } from './lib/skills.mjs'

const probe = spawnSync('uvx', ['--version'], { encoding: 'utf8' })
if (probe.error) {
  console.error('validate-spec: uv is required — https://docs.astral.sh/uv/')
  process.exit(1)
}

const names = listSkillDirs()
const failures = []
for (const name of names) {
  const result = spawnSync(
    'uvx',
    ['--from', 'skills-ref', 'agentskills', 'validate', join(SKILLS_DIR, name)],
    { stdio: 'inherit' },
  )
  if (result.status !== 0) failures.push(name)
}

if (failures.length > 0) {
  console.error(`validate-spec: ${failures.length} skill(s) failed: ${failures.join(', ')}`)
  process.exit(1)
}
console.log(`validate-spec: ${names.length} skills OK (skills-ref)`)
