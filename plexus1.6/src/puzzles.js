// Compatibility/aggregation layer. The actual content now lives in
// src/data/ (dailyPuzzles.js, systemPuzzles.js, constants.js), organized so
// it can map directly onto a real backend table later (e.g. Supabase:
// one `puzzles` row per object here, with `categories` as a JSONB column
// or a child table). Existing components that only care about a puzzle's
// `categories` shape (Game, ReviewConnections) don't need to change —
// they simply ignore the extra metadata fields.

import { DIFFICULTY, SYSTEMS, PUZZLE_STATUS } from './data/constants.js'
import dailyPuzzles from './data/dailyPuzzles.js'
import handWrittenSystemPuzzles from './data/systemPuzzles.js'
import generatedPuzzles from './data/generatedPuzzles.js'

export { DIFFICULTY, SYSTEMS, PUZZLE_STATUS, dailyPuzzles, generatedPuzzles }

// The Systems Library plays hand-written and bank-assembled puzzles side by
// side — same schema, same UI, no component changes needed. Generated
// puzzles are produced by scripts/assemblePuzzles.mjs from
// src/data/connectionBank.js; see that script/file for how to add more.
export const systemPuzzles = [...handWrittenSystemPuzzles, ...generatedPuzzles]

const allPuzzles = [...dailyPuzzles, ...systemPuzzles]

export function getPuzzleById(id) {
  return allPuzzles.find((p) => p.id === id) || null
}

export function getPublishedPuzzles() {
  return allPuzzles.filter((p) => p.status === 'published')
}

// Basic integrity check helper (used by the self-test script and, defensively, at runtime).
export function validatePuzzle(p) {
  const errors = []
  if (!p.id) errors.push('missing id')
  if (typeof p.number !== 'number') errors.push('missing/invalid puzzle number')
  if (!['daily', 'system'].includes(p.type)) errors.push('type must be "daily" or "system"')
  if (p.type === 'daily' && !p.date) errors.push('daily puzzles must have a date')
  if (p.type === 'system' && p.date) errors.push('system puzzles should not have a date')
  if (!p.title) errors.push('missing title')
  if (!Array.isArray(p.systems) || p.systems.length === 0) errors.push('missing systems[]')
  else {
    p.systems.forEach((s) => {
      if (!SYSTEMS.includes(s)) errors.push(`unknown system "${s}"`)
    })
  }
  if (!Array.isArray(p.topicTags)) errors.push('missing topicTags[]')
  if (!PUZZLE_STATUS.includes(p.status)) errors.push('status must be draft, reviewed, or published')
  if (!p.source) errors.push('missing source')

  if (!Array.isArray(p.categories) || p.categories.length !== 4) {
    errors.push('must have exactly 4 categories')
  } else {
    const allTerms = []
    p.categories.forEach((c, i) => {
      if (!c.title) errors.push(`category ${i} missing title`)
      if (!c.explanation) errors.push(`category ${i} ("${c.title}") missing explanation`)
      if (!c.remember) errors.push(`category ${i} ("${c.title}") missing remember line`)
      if (!Array.isArray(c.items) || c.items.length !== 4) {
        errors.push(`category ${i} ("${c.title}") must have exactly 4 items`)
      } else {
        c.items.forEach((it, j) => {
          if (!it || typeof it.term !== 'string' || !it.term.trim()) {
            errors.push(`category ${i} item ${j} missing term`)
          } else {
            allTerms.push(it.term)
          }
          if (!it || typeof it.why !== 'string' || !it.why.trim()) {
            errors.push(`category ${i} ("${c.title}") item "${it && it.term}" missing why`)
          }
        })
      }
      if (![1, 2, 3, 4].includes(c.level)) errors.push(`category ${i} has invalid level`)
    })
    if (allTerms.length !== 16) errors.push('puzzle must have exactly 16 items total')
    const unique = new Set(allTerms.map((s) => s.trim().toLowerCase()))
    if (unique.size !== allTerms.length) errors.push('duplicate item text within puzzle')
    const levels = p.categories.map((c) => c.level).sort()
    if (JSON.stringify(levels) !== JSON.stringify([1, 2, 3, 4])) {
      errors.push('categories must use levels 1,2,3,4 exactly once each')
    }
  }
  return errors
}

export default allPuzzles
