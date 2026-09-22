// One-time (re-runnable) migration: transcribes every category from the
// hand-written src/data/systemPuzzles.js puzzles into standalone
// connection-bank entries (src/data/migratedBankCategories.js), so that
// already-verified, already-reviewed content becomes available to the
// dynamic per-system puzzle assembler without retyping a word of it.
//
// Run with: node scripts/migrateBank.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import systemPuzzles from '../src/data/systemPuzzles.js'
import { validateBankCategory } from '../src/data/connectionBank.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const LEVEL_TO_DIFFICULTY = { 1: 'easy', 2: 'medium', 3: 'hard', 4: 'expert' }

// Lightweight keyword heuristic so migrated content isn't uniformly tagged
// "knowledge" — good enough for a first pass; individual entries can be
// hand-corrected later without touching the migration script.
function inferConnectionType(puzzle, category) {
  const text = `${category.title} ${puzzle.title}`.toLowerCase()
  if (/murmur|pressure|shock|physiology|hemodynamic|acid-base|gas exchange|dlco|v\/q/.test(text)) return 'physiology'
  if (/anatomy|artery|nerve|vein|derivative|embryo/.test(text)) return 'anatomy'
  if (/receptor|mechanism|drug|pharm/.test(text)) return 'mechanism'
  if (/named|eponym|body|triad|sign|spot|line|node|phenomenon|prefix|suffix|wordplay|___/.test(text)) return 'language'
  if (/microbio|infection|organism|pathogen/.test(text)) return 'microbiology'
  if (/lab|complement|eosinophil|dlco/.test(text)) return 'laboratory'
  // NOTE: a content audit found "stroke|territory|movement disorder" was
  // previously mapped to 'cross-system' here, mistagging several
  // single-system Neurology categories that have no actual cross-system
  // content (a migration-heuristic artifact, not a real cross-system
  // category — those are legitimately tagged via a category's own
  // multi-entry `systems` array, not by connectionType). Corrected to
  // 'pathology', which fits stroke syndromes/movement disorders/lesion
  // patterns far better.
  if (/stroke|territory|movement disorder|lesion pattern/.test(text)) return 'pathology'
  return 'knowledge'
}

function conceptTagsFor(puzzle, category) {
  const tags = new Set()
  ;(puzzle.topicTags || []).forEach((t) => tags.add(t))
  // A short slug from the category title makes a reasonable extra concept tag.
  const slug = category.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-')
  if (slug) tags.add(slug)
  return [...tags]
}

const migrated = []
systemPuzzles.forEach((puzzle) => {
  puzzle.categories.forEach((category) => {
    const systems = puzzle.systems && puzzle.systems.length ? puzzle.systems : ['Mixed / Step Review']
    // Every migrated puzzle's `systems` array is single-entry today (this
    // migration source has never had a genuinely multi-system category),
    // so primarySystem is unambiguous. If that ever changes, this will
    // need the same manual primarySystem review connectionBank.js's
    // hand-authored multi-system categories already got.
    const baseNotes = `Migrated from hand-written puzzle "${puzzle.title}" (${puzzle.id}) — already reviewed content, now a standalone bank category so the assembler can recombine it freely.`
    const entry = {
      id: `bank-migrated-${puzzle.id}-L${category.level}`,
      title: category.title,
      tiles: category.items.map((it) => it.term),
      difficulty: LEVEL_TO_DIFFICULTY[category.level],
      systems,
      primarySystem: systems[0],
      secondarySystems: systems.slice(1),
      connectionType: inferConnectionType(puzzle, category),
      explanation: category.explanation,
      tileExplanations: category.items.map((it) => it.why),
      remember: category.remember,
      tags: conceptTagsFor(puzzle, category),
      overlapTags: [],
      status: category.needsReview ? 'needs_review' : 'verified',
      notes: category.needsReview ? `${baseNotes} CONTENT AUDIT: ${category.reviewNote || 'flagged for review'}` : baseNotes,
    }
    migrated.push(entry)
  })
})

let anyInvalid = false
migrated.forEach((c) => {
  const errors = validateBankCategory(c)
  if (errors.length) {
    anyInvalid = true
    console.error(`INVALID: ${c.id}: ${errors.join('; ')}`)
  }
})

if (anyInvalid) {
  console.error('\nOne or more migrated categories failed validateBankCategory — NOT writing output.')
  process.exit(1)
}

const bySystem = {}
migrated.forEach((c) => {
  c.systems.forEach((s) => {
    bySystem[s] = bySystem[s] || { easy: 0, medium: 0, hard: 0, expert: 0 }
    bySystem[s][c.difficulty] += 1
  })
})
console.log(`Migrated ${migrated.length} categories from ${systemPuzzles.length} hand-written puzzles.\n`)
Object.entries(bySystem)
  .sort()
  .forEach(([system, counts]) => {
    console.log(`  ${system}: easy ${counts.easy}, medium ${counts.medium}, hard ${counts.hard}, expert ${counts.expert}`)
  })

const header = `// AUTO-GENERATED by scripts/migrateBank.mjs — do not hand-edit.
// Regenerate with: node scripts/migrateBank.mjs
// Transcribes every category from the hand-written puzzles in
// src/data/systemPuzzles.js into standalone connection-bank entries, so
// content that already existed (and was already reviewed) becomes
// available to the dynamic per-system puzzle assembler. Merged into the
// bank by src/data/connectionBank.js.
`
const body = `${header}\nconst migratedBankCategories = ${JSON.stringify(migrated, null, 2)}\n\nexport default migratedBankCategories\n`
const outPath = path.join(__dirname, '..', 'src', 'data', 'migratedBankCategories.js')
fs.writeFileSync(outPath, body)
console.log(`\nWrote ${migrated.length} categories to ${path.relative(process.cwd(), outPath)}`)
