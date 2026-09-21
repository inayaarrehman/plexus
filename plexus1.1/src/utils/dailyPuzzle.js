import dailyPuzzles from '../data/dailyPuzzles.js'
import { dateKey, dayNumber } from './game.js'

// Resolves which Daily Puzzle a given date should show. Everyone who opens
// the app on the same date gets the same puzzle:
//   1. If a daily puzzle has an explicit `date` match, use it (the normal
//      case for any date that's been specifically authored).
//   2. Otherwise fall back to a deterministic rotation through the
//      published daily pool, keyed by day number, so a date with no
//      explicit entry yet (e.g. tomorrow, or a far-past demo date) still
//      resolves to *something* rather than breaking the app. Once more
//      daily puzzles are authored with explicit dates, this fallback is
//      used less and less.
export function getDailyPuzzleForDate(date) {
  const key = dateKey(date)
  const published = dailyPuzzles.filter((p) => p.status === 'published')
  const explicit = published.find((p) => p.date === key)
  if (explicit) return explicit
  if (published.length === 0) return null
  const n = dayNumber(date)
  const idx = ((n % published.length) + published.length) % published.length
  return published[idx]
}

export function isFutureDateKey(dateStr) {
  return dateStr > dateKey(new Date())
}
