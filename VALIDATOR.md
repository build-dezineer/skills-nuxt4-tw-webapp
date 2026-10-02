# Capability checkers (`checks/validate.mjs`)

A skill may ship one small verification script that runs **after the app
generates a file**. It checks that the generated code actually uses the
pre-built primitives the skill requires, and returns findings. It never edits
anything — the host decides what to do (usually one corrective retry, then a
warning).

Checkers are optional. A skill without one works exactly as before.

## The one accepted shape

A skill may contain exactly one checker, at:

```text
<skill>/checks/validate.mjs
```

Rules:

- Plain JavaScript, synchronous, at most 64 KB.
- Exactly one default export: `export default function validate(input) { … }`.
- **No imports** (no `import`, `require`, `process`, `eval`, `new Function`,
  `fetch`, `XMLHttpRequest`, `WebSocket`, `child_process`). The script cannot
  read files, reach the network, or touch the machine — the host runs it in an
  isolated sandbox that exposes nothing but the input.
- Deterministic, runs in well under one second.
- Return at most 10 findings; each message ≤ 300 characters, written in product
  language (say what to use and why — never "you must" for design).

`scripts/validate-skills.mjs` rejects any non-conforming checker in CI, so a
bad script never ships.

## Input

The host calls the function once per generation with:

```js
{
  skill: 'hero',                 // this skill's id
  projectType: 'website',        // website | webapp | … 
  facts: { /* the user's wizard selections, e.g. heroVisual, navConfig */ },
  files: [
    { path: 'app/components/sections/HeroSection.vue',
      sectionName: 'HeroSection',
      content: '…the generated file…' },
  ],
}
```

Only files the code generation just produced are passed. `facts` may be missing
keys on older projects — always tolerate that.

## Output

```js
{ findings: [ { file: 'app/components/sections/HeroSection.vue', message: '…' } ] }
```

`file` must exactly match one of the input paths — findings for unknown files
are ignored. Worked examples live in the sibling
[website skills repo](https://github.com/build-dezineer/skills-nuxt4-tw-website)
(`skills/hero/checks/validate.mjs`, `skills/gallery/checks/validate.mjs`,
`skills/navigation/checks/validate.mjs`, `skills/footer/checks/validate.mjs`).
No webapp skill ships a checker yet — add one when a skill has a deterministic
pre-built-primitive requirement worth enforcing.

## Template

Copy `templates/checks/validate.mjs` into your skill and adapt it.

## Compatibility

`checks/` is an additional directory: the Agent Skills format allows any files
beyond `SKILL.md`, and other agent clients simply ignore it. Keep it out of
`scripts/` — that directory means "code the agent may run", which a checker is
not.
