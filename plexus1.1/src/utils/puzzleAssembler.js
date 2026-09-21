// ---------------------------------------------------------------------
// Puzzle Assembler
// ---------------------------------------------------------------------
// Turns 4 compatible connection-bank categories (one per difficulty tier)
// into a playable puzzle object matching the existing puzzle schema
// (src/puzzles.js / src/data/systemPuzzles.js), WITHOUT any changes to
// Game.jsx, ReviewConnections.jsx, or any other UI component — they only
// ever see the same `{ level, title, explanation, remember, items }`
// category shape they already render.
//
// Why a puzzle only ever has one true solution by construction: every
// tile is a plain string, and each bank category owns its 4 tile strings
// independently. As long as the 4 categories chosen for one puzzle don't
// share any tile text (case-insensitively), each of the 16 tiles maps to
// exactly one category — so there is exactly one way to fully partition
// the board, even when several tiles are THEMATICALLY related to more
// than one category (that thematic overlap is what makes a guess
// tempting, not what makes the puzzle ambiguous). `categoriesCompatible`
// below is the one check this relies on.
import { scoreCategory, CONNECTION_TYPES } from '../data/connectionBank.js'

const LEVEL_BY_DIFFICULTY = { easy: 1, medium: 2, hard: 3, expert: 4 }
const DIFFICULTY_BY_LEVEL = { 1: 'easy', 2: 'medium', 3: 'hard', 4: 'expert' }

export function normalizeTile(text) {
  return String(text).trim().toLowerCase()
}

// True if none of the 4 categories share a tile's text with any other.
export function categoriesCompatible(categories) {
  const seen = new Set()
  for (const cat of categories) {
    for (const tile of cat.tiles) {
      const key = normalizeTile(tile)
      if (seen.has(key)) return false
      seen.add(key)
    }
  }
  return true
}

// Internal-only score for a full 4-category combo. Higher is better.
// Rewards per-category quality plus DIVERSITY across the 4 categories —
// connection-type variety and organ-system spread — which is what keeps
// generated puzzles from feeling like four back-to-back "causes of X"
// lists (an explicit product requirement).
export function scoreCombo(categories) {
  const base = categories.reduce((sum, c) => sum + scoreCategory(c), 0)
  const uniqueTypes = new Set(categories.map((c) => c.connectionType)).size
  const uniqueSystems = new Set(categories.flatMap((c) => c.systems)).size
  return base + uniqueTypes * 3 + uniqueSystems
}

// Builds one playable puzzle object from exactly 4 bank categories
// (any order — they're sorted into levels by difficulty here).
export function assemblePuzzleFromCategories(categories, meta) {
  if (categories.length !== 4) throw new Error('assemblePuzzleFromCategories requires exactly 4 categories')
  if (!categoriesCompatible(categories)) {
    throw new Error('these categories share a duplicate tile and cannot form one puzzle')
  }
  const byDifficulty = {}
  categories.forEach((c) => {
    if (byDifficulty[c.difficulty]) {
      throw new Error(`two categories share difficulty "${c.difficulty}" — need exactly one per tier`)
    }
    byDifficulty[c.difficulty] = c
  })
  ;['easy', 'medium', 'hard', 'expert'].forEach((tier) => {
    if (!byDifficulty[tier]) throw new Error(`missing a "${tier}" category`)
  })

  const puzzleCategories = ['easy', 'medium', 'hard', 'expert'].map((tier) => {
    const c = byDifficulty[tier]
    return {
      level: LEVEL_BY_DIFFICULTY[tier],
      title: c.title,
      explanation: c.explanation,
      remember: c.remember,
      // Extra fields beyond {level,title,explanation,remember,items} are
      // ignored by Game.jsx/ReviewConnections.jsx (same pattern already
      // used for puzzle-level metadata), but carried through for future
      // concept-level Weak Spot tracking and the Dev Viewer.
      connectionType: c.connectionType,
      tags: c.tags,
      bankCategoryId: c.id,
      items: c.tiles.map((tile, i) => ({ term: tile, why: c.tileExplanations[i] })),
    }
  })

  const allSystems = [...new Set(categories.flatMap((c) => c.systems))]

  return {
    id: meta.id,
    number: meta.number,
    type: 'system',
    date: null,
    title: meta.title,
    systems: allSystems,
    topicTags: [...new Set(categories.flatMap((c) => c.tags))],
    status: 'published',
    source: 'Generated from the connection bank — verified categories, assembled for tile compatibility and type diversity.',
    categories: puzzleCategories,
  }
}

// Deterministic pseudo-random generator (mulberry32) so a given seed always
// produces the same puzzle set — useful for regenerating content
// reproducibly without re-reviewing every combination by hand.
export function makeRng(seed) {
  let a = seed >>> 0
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleWith(array, rng) {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Auto-generates `count` puzzles from the bank: one verified category per
// difficulty tier, no duplicate tiles within a puzzle, no category reused
// across the generated batch, and preferring (via scoreCombo) combos that
// mix connection types/systems rather than repeating the same pattern.
// Tries a bounded number of candidate combos per puzzle slot and keeps the
// best-scoring compatible one it finds.
export function autoGeneratePuzzles(bank, { count, seed = 1, titlePrefix = 'Pattern Recognition', startNumber = 1 } = {}) {
  const rng = makeRng(seed)
  const verified = bank.filter((c) => c.status === 'verified')
  const byTier = {
    easy: verified.filter((c) => c.difficulty === 'easy'),
    medium: verified.filter((c) => c.difficulty === 'medium'),
    hard: verified.filter((c) => c.difficulty === 'hard'),
    expert: verified.filter((c) => c.difficulty === 'expert'),
  }

  const used = new Set()
  const puzzles = []
  const romanish = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

  for (let n = 0; n < count; n++) {
    const available = {
      easy: byTier.easy.filter((c) => !used.has(c.id)),
      medium: byTier.medium.filter((c) => !used.has(c.id)),
      hard: byTier.hard.filter((c) => !used.has(c.id)),
      expert: byTier.expert.filter((c) => !used.has(c.id)),
    }
    if (!available.easy.length || !available.medium.length || !available.hard.length || !available.expert.length) {
      break // ran out of unused categories in some tier
    }

    let best = null
    const ATTEMPTS = 40
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const combo = [
        shuffleWith(available.easy, rng)[0],
        shuffleWith(available.medium, rng)[0],
        shuffleWith(available.hard, rng)[0],
        shuffleWith(available.expert, rng)[0],
      ]
      if (!categoriesCompatible(combo)) continue
      const score = scoreCombo(combo)
      if (!best || score > best.score) best = { combo, score }
    }

    if (!best) break // couldn't find any compatible combo in this tier pool

    best.combo.forEach((c) => used.add(c.id))
    const number = startNumber + n
    const puzzle = assemblePuzzleFromCategories(best.combo, {
      id: `generated-${String(number).padStart(4, '0')}`,
      number,
      title: `${titlePrefix} ${romanish[n] || number}`,
    })
    puzzles.push(puzzle)
  }

  return puzzles
}

// ---------------------------------------------------------------------
// Runtime per-system assembly (the Organ System Library's PLAY button).
// Unlike autoGeneratePuzzles (offline, writes a static file), this runs
// live in the browser: every PLAY press can produce a fresh combination,
// and it takes the player's concept mastery into account so puzzles lean
// toward what they haven't mastered yet rather than repeating solved
// ground forever.
// ---------------------------------------------------------------------

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const MASTERY_BIAS = { unseen: 2, learning: 1, mastered: 0 }

function categoryMasteryWeight(category, mastery) {
  const state = mastery[category.id]?.state || 'unseen'
  return MASTERY_BIAS[state] ?? 1
}

// One pool per difficulty tier for a system, "organ-pure" by construction:
// categories whose primarySystem IS this system come first; if a tier has
// none of those, fall back only to categories where this system appears as
// a defensible secondarySystem (an intentionally cross-system category,
// e.g. a pituitary-adenoma category tagged primarySystem: Endocrine,
// secondarySystems: [Neurology] is a legitimate Neurology-tier fallback).
// There is NO fallback to the full unrelated verified pool — a tier with
// neither primary nor secondary content for this system is simply empty,
// and assembleSystemPuzzle below returns null rather than ever padding a
// system-specific puzzle with an unrelated category (this was the actual
// root cause of unrelated categories, e.g. a cranial-nerve-palsy category,
// appearing inside a system puzzle they don't belong in).
function tierPools(bank, system) {
  const verified = bank.filter((c) => c.status === 'verified')
  const tiers = ['easy', 'medium', 'hard', 'expert']
  const pools = {}
  tiers.forEach((tier) => {
    const ofTier = verified.filter((c) => c.difficulty === tier)
    const primary = ofTier.filter((c) => c.primarySystem === system)
    const secondary = ofTier.filter((c) => c.primarySystem !== system && (c.secondarySystems || []).includes(system))
    pools[tier] = primary.length > 0 ? primary : secondary
  })
  return pools
}

// Builds one fresh puzzle for a system, biased toward categories the
// player hasn't mastered yet. `mastery` is the object from
// storage.getConceptMastery(); pass {} for a player with no history.
export function assembleSystemPuzzle(bank, system, { mastery = {}, rng = Math.random } = {}) {
  const pools = tierPools(bank, system)
  if (['easy', 'medium', 'hard', 'expert'].some((tier) => pools[tier].length === 0)) {
    return null // not enough verified content anywhere to complete a puzzle
  }

  // Prefer not-yet-mastered categories per tier, but never let a tier go
  // empty just because everything in it happens to be mastered.
  const biasedPools = {}
  ;['easy', 'medium', 'hard', 'expert'].forEach((tier) => {
    const nonMastered = pools[tier].filter((c) => (mastery[c.id]?.state || 'unseen') !== 'mastered')
    biasedPools[tier] = nonMastered.length > 0 ? nonMastered : pools[tier]
  })

  const pick = (arr) => arr[Math.floor(rng() * arr.length)]

  let best = null
  const ATTEMPTS = 60
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const combo = [pick(biasedPools.easy), pick(biasedPools.medium), pick(biasedPools.hard), pick(biasedPools.expert)]
    if (!categoriesCompatible(combo)) continue
    const score = scoreCombo(combo) + combo.reduce((sum, c) => sum + categoryMasteryWeight(c, mastery), 0)
    if (!best || score > best.score) best = { combo, score }
  }
  if (!best) return null

  const number = Date.now() % 1000000
  return assemblePuzzleFromCategories(best.combo, {
    id: `system-live-${slugify(system)}-${number}`,
    number,
    title: system,
  })
}

export { LEVEL_BY_DIFFICULTY, DIFFICULTY_BY_LEVEL, CONNECTION_TYPES, shuffleWith }
