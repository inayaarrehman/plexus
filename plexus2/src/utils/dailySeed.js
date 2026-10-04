// ---------------------------------------------------------------------
// Deterministic Daily seed + seeded daily builder
// ---------------------------------------------------------------------
// One canonical seed string per date — e.g. "PLEXUS-2026-10-03" — so the same
// date always produces the same ordered puzzle, on any device and on the
// server. This is what lets the Supabase `daily_puzzles` table store a seed +
// the materialized puzzle_data, and what guarantees "everyone gets the same
// official puzzle for a given date." Race Mode reuses the same seeded-RNG
// primitive (see utils/raceEngine.js).
//
// NOTE: this does NOT change how today's Daily is selected in the current app
// (getDailyPuzzleForDate still serves the authored daily pool). It is an
// additive, reproducible generator used by the Supabase daily pipeline and the
// import/seeding script.

import { dateKey } from './game.js'
import { seededRng, comboUsable, scoreCombo, assemblePuzzleFromCategories } from './puzzleAssembler.js'

// "PLEXUS-YYYY-MM-DD" for a Date or a yyyy-mm-dd string.
export function dailySeedString(dateOrKey) {
  const key = typeof dateOrKey === 'string' ? dateOrKey : dateKey(dateOrKey)
  return `PLEXUS-${key}`
}

// Build one deterministic 4-category Daily from a seed string, drawing one
// verified category per difficulty tier from the bank. Same seed → identical
// puzzle (categories and order). Returns a playable puzzle object matching the
// existing schema, or null if the bank lacks a full tier set.
export function buildDailyFromSeed(bank, seedStr, { number = 0, date = null } = {}) {
  const rng = seededRng(seedStr)
  const verified = bank.filter((c) => c.status === 'verified')
  const byTier = {
    easy: verified.filter((c) => c.difficulty === 'easy'),
    medium: verified.filter((c) => c.difficulty === 'medium'),
    hard: verified.filter((c) => c.difficulty === 'hard'),
    expert: verified.filter((c) => c.difficulty === 'expert'),
  }
  if (['easy', 'medium', 'hard', 'expert'].some((t) => byTier[t].length === 0)) return null

  const pick = (arr) => arr[Math.floor(rng() * arr.length)]
  let best = null
  for (let attempt = 0; attempt < 60; attempt++) {
    const combo = [pick(byTier.easy), pick(byTier.medium), pick(byTier.hard), pick(byTier.expert)]
    if (!comboUsable(combo)) continue
    const score = scoreCombo(combo)
    if (!best || score > best.score) best = { combo, score }
  }
  if (!best) return null

  const key = date || (seedStr.startsWith('PLEXUS-') ? seedStr.slice('PLEXUS-'.length) : null)
  const puzzle = assemblePuzzleFromCategories(best.combo, {
    id: `daily-${key || seedStr}`,
    number,
    title: 'Daily Plexus',
  })
  puzzle.type = 'daily'
  puzzle.date = key
  puzzle.seed = seedStr
  return puzzle
}
