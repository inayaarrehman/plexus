// Section 13: after finishing the Daily Puzzle, highlight ONE particularly
// interesting Hard/Expert relationship with its one-sentence explanation.
// Only ever called once the puzzle is already fully solved (gameOver &&
// won), so this never spoils anything — every category is already visible
// to the player by the time this shows.
export function pickConnectionOfDay(puzzle) {
  if (!puzzle || !Array.isArray(puzzle.categories)) return null
  const expert = puzzle.categories.find((c) => c.level === 4)
  const hard = puzzle.categories.find((c) => c.level === 3)
  const chosen = expert || hard
  if (!chosen) return null
  return { title: chosen.title, explanation: chosen.explanation }
}
