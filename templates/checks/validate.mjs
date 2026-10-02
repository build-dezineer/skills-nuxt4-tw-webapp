/**
 * Capability checker template — copy to `<skill>/checks/validate.mjs`.
 *
 * The host runs this after generation, in an isolated sandbox, once per run.
 * Report what the generated file is missing; never touch the file. See
 * VALIDATOR.md for the full contract.
 */
export default function validate(input) {
  const findings = []

  for (const file of input.files) {
    // Only inspect the files this skill owns (match on sectionName or path).
    if (!/example/i.test(file.sectionName)) continue
    const source = file.content || ''

    if (!/PreBuiltPrimitive/.test(source)) {
      findings.push({
        file: file.path,
        message: 'Use the pre-built PreBuiltPrimitive from ~/components/shared/... so the section gets its intended behavior for free.',
      })
    }
  }

  return { findings }
}
