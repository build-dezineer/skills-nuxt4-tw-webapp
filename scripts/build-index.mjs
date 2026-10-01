#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { INDEX_PATH, collectIndex } from './lib/skills.mjs'

const checkOnly = process.argv.includes('--check')

function build() {
  return `${JSON.stringify({ skills: collectIndex() }, null, 2)}\n`
}

let expected
try {
  expected = build()
} catch (error) {
  console.error(`build-index: ${error.message}`)
  process.exit(1)
}

if (checkOnly) {
  let committed
  try {
    committed = readFileSync(INDEX_PATH, 'utf8')
  } catch {
    console.error('build-index: skills/index.json is missing — run `npm run index`')
    process.exit(1)
  }
  if (committed !== expected) {
    console.error('build-index: skills/index.json is stale — run `npm run index`')
    const want = JSON.parse(expected).skills
    const have = JSON.parse(committed).skills ?? []
    const haveByName = new Map(have.map((skill) => [skill.name, skill]))
    for (const skill of want) {
      const current = haveByName.get(skill.name)
      if (!current) console.error(`  missing entry: ${skill.name}`)
      else if (JSON.stringify(current) !== JSON.stringify(skill)) console.error(`  changed entry: ${skill.name}`)
      haveByName.delete(skill.name)
    }
    for (const name of haveByName.keys()) console.error(`  extra entry: ${name}`)
    process.exit(1)
  }
  console.log(`build-index: skills/index.json is up to date (${JSON.parse(expected).skills.length} skills)`)
} else {
  writeFileSync(INDEX_PATH, expected)
  console.log(`build-index: wrote skills/index.json (${JSON.parse(expected).skills.length} skills)`)
}
