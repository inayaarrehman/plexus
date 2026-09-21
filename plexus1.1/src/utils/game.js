// Deterministic day key + daily puzzle index, so everyone playing "today"
// gets the same puzzle, and it changes at local midnight.
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Days since a fixed epoch, used to rotate through the puzzle bank.
const EPOCH = new Date(2024, 0, 1) // Jan 1, 2024
export function dayNumber(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffMs = start - EPOCH
  return Math.floor(diffMs / 86400000)
}

export function getDailyPuzzleIndex(puzzleCount, d = new Date()) {
  const n = dayNumber(d)
  return ((n % puzzleCount) + puzzleCount) % puzzleCount
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
