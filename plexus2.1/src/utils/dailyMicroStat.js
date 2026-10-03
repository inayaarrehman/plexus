// Section 15: after finishing the Daily Puzzle, show at most ONE small,
// understated stat — never a dashboard, never more than one line. Picked
// in priority order (most special/rare first) so the same finish always
// produces the same single stat rather than several competing for space.
export function computeDailyMicroStat({ mistakes, guessLog, dailyPerfectStreak }) {
  if (mistakes === 0 && dailyPerfectStreak >= 3) {
    return `${dailyPerfectStreak}-day perfect streak.`
  }

  const firstCorrect = guessLog.find((g) => g.correct)
  if (firstCorrect && firstCorrect.levels[0] === 4) {
    return 'Solved Expert first.'
  }

  if (mistakes === 0) {
    return 'No mistakes today.'
  }

  const durations = guessLog.filter((g) => g.correct && typeof g.durationMs === 'number').map((g) => g.durationMs)
  if (durations.length) {
    const fastestMs = Math.min(...durations)
    // Only worth mentioning if it's genuinely quick — a multi-minute "fast"
    // group isn't an interesting stat.
    if (fastestMs > 0 && fastestMs < 20000) {
      return `Fastest group: ${(fastestMs / 1000).toFixed(1)}s.`
    }
  }

  return null
}
