#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { INDEX_PATH, REPO_ROOT, collectIndex } from './lib/skills.mjs'

const PACKAGE_PATH = join(REPO_ROOT, 'package.json')
const checkOnly = process.argv.includes('--check')

function readDescription() {
  let raw
  try {
    raw = JSON.parse(readFileSync(PACKAGE_PATH, 'utf8'))
  } catch (error) {
    throw new Error(`package.json is missing or invalid: ${error.message}`)
  }
  const description = typeof raw?.description === 'string' ? raw.description.trim() : ''
  if (!description || description.length > 300) throw new Error('package.json: description must be 1-300 characters')
  return description
}

function build() {
  return `${JSON.stringify({ description: readDescription(), skills: collectIndex() }, null, 2)}\n`
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
