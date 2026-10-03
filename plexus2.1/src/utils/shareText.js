// Builds the spoiler-free share text. Keeps the useful mechanic shared by
// most grouping-puzzle games (one line per guess, so a friend can see the
// attempt pattern without seeing the answers) but renders it in the app's
// own visual language rather than NYT Connections' colored-square emoji
// grid: our own four shapes (matching the same shape/difficulty pairing
// used on-screen, not colors — this also means the shared text is legible
// to a color-blind recipient and renders identically everywhere, since
// emoji-square color can vary by platform/font), our own header format,
// and a footer line NYT's format doesn't have at all.
import { DIFFICULTY } from '../data/constants.js'

const SHAPE_BY_LEVEL = DIFFICULTY.reduce((acc, d) => {
  acc[d.level] = d.shape
  return acc
}, {})

function guessRows(guessLog) {
  return guessLog.map((g) => g.levels.map((lv) => SHAPE_BY_LEVEL[lv] || '?').join(' ')).join('\n')
}

export function buildShareText({ isDaily, dailyNumber, puzzleTitle, shareLabel, guessLog, won, mistakes, dailyStreak }) {
  const rows = guessRows(guessLog)

  if (isDaily) {
    const header = `PLEXUS · ${String(dailyNumber ?? '').padStart(3, '0')}`
    const missLine = won ? (mistakes === 0 ? 'Perfectly connected.' : `${mistakes} miss${mistakes === 1 ? '' : 'es'}`) : 'Not solved today'
    const streakLine = won && dailyStreak > 0 ? `\n${dailyStreak} day streak` : ''
    return `${header}\n${rows}\n${missLine}${streakLine}`
  }

  const header = shareLabel ? `PLEXUS · ${shareLabel}` : `PLEXUS · ${puzzleTitle}`
  const missLine = won ? (mistakes === 0 ? 'Perfectly connected.' : `${mistakes} miss${mistakes === 1 ? '' : 'es'}`) : 'Not solved'
  return `${header}\n${rows}\n${missLine}`
}
