// Deterministic day key + daily puzzle index, so everyone playing "today"
// gets the same puzzle, and it changes at local midnight.
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Whole days since a fixed epoch (Jan 1, 2024), used to rotate through the
// puzzle bank and to number the Daily. Computed in UTC so it is exact and
// DST-proof — local-midnight subtraction drifts by ±1 across daylight-saving
// transitions, which broke the challenge-link day-number round-trip.
const EPOCH_UTC = Date.UTC(2024, 0, 1)
export function dayNumber(d = new Date()) {
  const utc = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((utc - EPOCH_UTC) / 86400000)
}

export function getDailyPuzzleIndex(puzzleCount, d = new Date()) {
  const n = dayNumber(d)
  return ((n % puzzleCount) + puzzleCount) % puzzleCount
}

// Inverse of dayNumber: the local Date for a given day number. Used to
// resolve a "Challenge a friend" link (which carries only the day number)
// back to the exact same deterministic Daily — no answers in the link.
export function dateFromDayNumber(n) {
  return new Date(2024, 0, 1 + Number(n))
}

export function shuffle(array) {
  const arr = array.slice()
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Flatten a puzzle's categories into a shuffled tile list.
// Each tile: { text, level, catIndex }
export function buildTiles(puzzle) {
  const tiles = []
  puzzle.categories.forEach((cat, catIndex) => {
    cat.items.forEach((item) => {
      tiles.push({ text: item.term, level: cat.level, catIndex })
    })
  })
  return shuffle(tiles)
}

// Milestone streak lengths worth a special callout.
export const STREAK_MILESTONES = [7, 30, 50, 100]

// Given the currently-selected tiles (array of tile objects), determine if
// they all share the same catIndex.
export function isFullMatch(selectedTiles) {
  if (selectedTiles.length !== 4) return false
  const first = selectedTiles[0].catIndex
  return selectedTiles.every((t) => t.catIndex === first)
}

// "One away" detection: exactly 3 of the 4 selected share a category.
export function isOneAway(selectedTiles) {
  if (selectedTiles.length !== 4) return false
  const counts = {}
  selectedTiles.forEach((t) => {
    counts[t.catIndex] = (counts[t.catIndex] || 0) + 1
  })
  return Object.values(counts).some((c) => c === 3)
}

export const MAX_MISTAKES = 4

// A canonical, order-independent key for a set of selected tiles, built from
// STABLE per-puzzle tile identifiers. `tile.text` is unique within a puzzle
// (buildTiles derives it from item.term; the self-test asserts all 16 are
// unique), so it is the stable id here. Category indexes are deliberately
// NOT used for this: two different tile-sets that each happen to draw one
// tile from the same four categories are DIFFERENT attempts, and keying on
// catIndex was the cause of false "Already tried this combo" warnings.
export function attemptKey(tiles) {
  return tiles
    .map((t) => String(t.text).trim().toLowerCase())
    .sort()
    .join('\u0001')
}

// True only when this exact set of four tiles was already submitted as an
// INCORRECT guess in the current attempt. Order-independent and exact —
// never a fuzzy or 3-of-4 match. Correct guesses are excluded because their
// tiles leave the board and can never be reselected; entries without a
// stored key (e.g. progress saved before this fix) are simply skipped
// rather than ever producing a false positive.
export function isDuplicateAttempt(guessLog, tiles) {
  const key = attemptKey(tiles)
  return guessLog.some((g) => !g.correct && g.attemptKey === key)
}
