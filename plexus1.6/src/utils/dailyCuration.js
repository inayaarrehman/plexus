// ---------------------------------------------------------------------
// Daily curation (Sections 3 & 5)
// ---------------------------------------------------------------------
// Ranks candidate Daily combinations by quality so Daily can represent the
// BEST Plexus experience rather than a random draw. Runtime Daily selection
// (getDailyPuzzleForDate) stays DETERMINISTIC by date on purpose — archive
// history and Puzzle Signatures depend on "Daily 042 is the same for
// everyone, forever." This module is the authoring/curation layer on top:
// it scores candidates (puzzleQualityScore), avoids recently-used concepts
// and archetypes, and feeds the admin Daily Preview. It never fabricates
// content — candidates are assembled only from verified bank categories.
import { assemblePuzzleFromCategories, categoriesCompatible, makeRng } from './puzzleAssembler.js'
import { puzzleVerdict } from './puzzleQuality.js'
import { categoryArchetype } from './archetypes.js'
import { getDailyHistoryList } from './storage.js'
import { getPuzzleById } from '../puzzles.js'

// What has Daily leaned on lately — concepts, archetypes and systems drawn
// from the player's most recent completed Dailies, so curation can steer
// away from repetition within a short window.
export function recentDailyContext({ limit = 8 } = {}) {
  const list = getDailyHistoryList().slice(0, limit)
  const concepts = new Set()
  const archetypes = new Set()
  const systems = new Set()
  for (const entry of list) {
    const p = getPuzzleById(entry.puzzleId)
    if (!p) continue
    for (const c of p.categories || []) {
      ;(c.tags || []).forEach((t) => concepts.add(String(t).toLowerCase()))
      if (c.title) concepts.add(c.title.toLowerCase())
      archetypes.add(categoryArchetype(c))
    }
    ;(p.systems || []).forEach((s) => systems.add(s))
  }
  return { concepts: [...concepts], archetypes: [...archetypes], systems: [...systems] }
}

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)]

// Generate and rank candidate Daily puzzles. Returns [{ puzzle, verdict }]
// sorted best-first, deduped by their set of source categories.
export function curateDailyCandidates(bank, { count = 6, seed = 1, recent } = {}) {
  const ctx = recent || { concepts: [], archetypes: [] }
  const rng = makeRng(seed >>> 0)
  const verified = bank.filter((c) => c.status === 'verified')
  const byTier = { easy: [], medium: [], hard: [], expert: [] }
  verified.forEach((c) => {
    if (byTier[c.difficulty]) byTier[c.difficulty].push(c)
  })
  if (['easy', 'medium', 'hard', 'expert'].some((t) => byTier[t].length === 0)) return []

  const seen = new Set()
  const out = []
  const ATTEMPTS = 600
  for (let i = 0; i < ATTEMPTS && out.length < count * 3; i++) {
    const combo = [pick(byTier.easy, rng), pick(byTier.medium, rng), pick(byTier.hard, rng), pick(byTier.expert, rng)]
    if (combo.some((x) => !x)) continue
    if (!categoriesCompatible(combo)) continue
    const key = combo.map((c) => c.id).sort().join('|')
    if (seen.has(key)) continue
    seen.add(key)
    let puzzle
    try {
      puzzle = assemblePuzzleFromCategories(combo, { id: `cand-${i}`, number: i, title: 'Candidate' })
    } catch {
      continue
    }
    const verdict = puzzleVerdict(puzzle, { recentConcepts: ctx.concepts, recentArchetypes: ctx.archetypes })
    out.push({ puzzle, verdict })
  }
  // Best first: approved above review above reject, then by score.
  const rank = { approve: 2, review: 1, reject: 0 }
  return out
    .sort((a, b) => rank[b.verdict.status] - rank[a.verdict.status] || b.verdict.score - a.verdict.score)
    .slice(0, count)
}
