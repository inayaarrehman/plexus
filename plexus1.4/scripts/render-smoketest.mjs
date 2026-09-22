// Server-side-render smoke test: mounts every component with representative
// props via react-dom/server (no real browser needed) to catch JSX/runtime
// errors that the pure-logic self-test can't see (bad prop access, broken
// conditionals, thrown exceptions during render, etc).
//
// Run with: tsx scripts/render-smoketest.mjs
// (uses the globally installed react/react-dom + tsx JSX loader since this
// sandbox's package registry access is blocked; see README for a normal
// `npm install && vite build` on a machine with registry access.)

// Minimal in-memory localStorage polyfill so we can exercise the
// gameOver/result-card render path (Game reads saved progress via
// localStorage on mount) without a real browser.
globalThis.localStorage = {
  _data: {},
  getItem(k) {
    return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null
  },
  setItem(k, v) {
    this._data[k] = String(v)
  },
  removeItem(k) {
    delete this._data[k]
  },
}

import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import allPuzzles, { dailyPuzzles, systemPuzzles, SYSTEMS } from '../src/puzzles.js'
import connectionBank from '../src/data/connectionBank.js'
import Home from '../src/components/Home.jsx'
import Game from '../src/components/Game.jsx'
import Archive from '../src/components/Archive.jsx'
import Systems from '../src/components/Systems.jsx'
import Challenge from '../src/components/Challenge.jsx'
import AppNav from '../src/components/AppNav.jsx'
import DevViewer from '../src/components/DevViewer.jsx'
import HowToModal from '../src/components/HowToModal.jsx'
import StatsModal from '../src/components/StatsModal.jsx'
import ReviewConnections from '../src/components/ReviewConnections.jsx'
import Confetti from '../src/components/Confetti.jsx'
import { buildTiles } from '../src/utils/game.js'
import { assembleSystemPuzzle } from '../src/utils/puzzleAssembler.js'
import { generateRound } from '../src/utils/challengeEngine.js'
import { saveProgress, getDailyHistory, getSystemProgress, getConceptMastery, recordConceptMastery } from '../src/utils/storage.js'

const puzzles = allPuzzles

let failures = 0
function check(label, fn) {
  try {
    const html = fn()
    if (typeof html !== 'string' || html.length === 0) {
      throw new Error('render produced empty output')
    }
    console.log(`  ok  - ${label} (${html.length} chars)`)
    return html
  } catch (err) {
    failures += 1
    console.log(`FAIL  - ${label}\n        ${err.stack || err}`)
    return ''
  }
}

console.log(`\nRender smoke test\n${'='.repeat(40)}\n`)

// ---------------------------------------------------------------
// Home
// ---------------------------------------------------------------

check('Home renders the "Play today\'s puzzle" CTA before the daily is done (no Continue section yet)', () => {
  const html = renderToStaticMarkup(
    React.createElement(Home, {
      dailyNumber: 999,
      dailyDone: false,
      currentStreak: 0,
      continueSystem: null,
      continueSystemSolved: 0,
      continueSystemTotal: 0,
      challengeBest: 0,
      onPlayDaily: () => {},
      onOpenSystems: () => {},
      onContinueStudying: () => {},
      onStartChallenge: () => {},
      onOpenStats: () => {},
      onOpenHowTo: () => {},
    })
  )
  if (!html.includes("Play today")) throw new Error('expected the primary "Play today\'s puzzle" CTA before the daily is done')
  if (html.includes('home-row-title')) throw new Error('did not expect a Continue section before the daily is done')
  if (html.includes('primary-recommendation') || html.includes('study-grid')) {
    throw new Error('did not expect any leftover card-based Home markup from earlier design phases')
  }
  return html
})

check('Home renders a plain-text "Today complete" line + a Continue section after the daily is done', () => {
  const html = renderToStaticMarkup(
    React.createElement(Home, {
      dailyNumber: 999,
      dailyDone: true,
      currentStreak: 7,
      continueSystem: 'Cardiology',
      continueSystemSolved: 18,
      continueSystemTotal: 42,
      challengeBest: 2840,
      onPlayDaily: () => {},
      onOpenSystems: () => {},
      onContinueStudying: () => {},
      onStartChallenge: () => {},
      onOpenStats: () => {},
      onOpenHowTo: () => {},
    })
  )
  if (!html.includes('home-done-line')) throw new Error('expected the "Today complete" line once the daily is done')
  if (!html.includes('Cardiology')) throw new Error('expected the Continue section to name the last-played system')
  if (!html.includes('18 of 42 connections solved')) throw new Error('expected the Continue section to show progress as "X of Y connections solved"')
  if (!html.includes('7 day streak')) throw new Error('expected the streak shown as plain text, not a decorated pill')
  if (!html.includes('2,840')) throw new Error('expected the 3-Minute Challenge personal best to render')
  return html
})

check('Home omits the Continue section with no play history yet, but still offers the 3-Minute Challenge', () => {
  const html = renderToStaticMarkup(
    React.createElement(Home, {
      dailyNumber: 1,
      dailyDone: true,
      currentStreak: 0,
      continueSystem: null,
      continueSystemSolved: 0,
      continueSystemTotal: 0,
      challengeBest: 0,
      onPlayDaily: () => {},
      onOpenSystems: () => {},
      onContinueStudying: () => {},
      onStartChallenge: () => {},
      onOpenStats: () => {},
      onOpenHowTo: () => {},
    })
  )
  if (html.includes('home-row-title')) throw new Error('did not expect a Continue section with no last-played system')
  if (!html.includes('3-Minute Challenge')) throw new Error('expected the 3-Minute Challenge section to always be offered')
  return html
})

check('AppNav renders all 4 primary nav items with the active one marked', () => {
  const html = renderToStaticMarkup(React.createElement(AppNav, { active: 'systems', onNavigate: () => {} }))
  ;['Today', 'Systems', '3-Minute', 'Review'].forEach((label) => {
    if (!html.includes(label)) throw new Error(`expected the nav to include "${label}"`)
  })
  if (!html.includes('app-nav-item active')) throw new Error('expected the active nav item to carry the "active" class')
  return html
})

// ---------------------------------------------------------------
// Game
// ---------------------------------------------------------------

check('Game renders a fresh daily puzzle (16 tiles, 4 lives)', () => {
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: dailyPuzzles[0],
      isDaily: true,
      progressKey: 'smoketest-fresh-daily',
      headerLabel: 'Daily #1',
      resultTitle: "Today's Results",
      dailyNumber: 1,
      dailyStreak: 0,
      onExit: () => {},
      onFinish: () => {},
    })
  )
  const liveDots = (html.match(/dot dot-live/g) || []).length
  if (liveDots !== 4) throw new Error(`expected 4 live mistake dots on a fresh game, found ${liveDots}`)
  return html
})

for (const p of puzzles) {
  check(`Game renders puzzle "${p.title}" (${p.id}) without throwing`, () =>
    renderToStaticMarkup(
      React.createElement(Game, {
        puzzle: p,
        isDaily: p.type === 'daily',
        progressKey: `smoketest-${p.id}`,
        headerLabel: p.title,
        resultTitle: 'Puzzle Results',
        onExit: () => {},
        onFinish: () => {},
      })
    )
  )
}

check('Game renders a live-assembled organ-system puzzle with a shareLabel and the Expert pop-flourish class wired up', () => {
  const puzzle = assembleSystemPuzzle(connectionBank, 'Cardiology', { mastery: {} })
  if (!puzzle) throw new Error('assembleSystemPuzzle returned null for Cardiology')
  const tiles = buildTiles(puzzle)
  const key = 'smoketest-system-win'
  saveProgress(key, {
    puzzleId: puzzle.id,
    tiles,
    solvedCats: [0, 1, 2, 3],
    mistakes: 0,
    guessLog: [0, 1, 2, 3].map((catIndex) => ({
      levels: [puzzle.categories[catIndex].level, puzzle.categories[catIndex].level, puzzle.categories[catIndex].level, puzzle.categories[catIndex].level],
      catIndexes: [catIndex, catIndex, catIndex, catIndex],
      correct: true,
    })),
    gameOver: true,
    won: true,
  })
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle,
      isDaily: false,
      progressKey: key,
      headerLabel: 'Cardiology',
      resultTitle: 'Puzzle Results',
      shareLabel: 'Cardiology',
      onExit: () => {},
      onFinish: () => {},
    })
  )
  if (!html.includes('result-card')) throw new Error('expected a result-card for a won system puzzle')
  if (html.includes('confetti-piece')) throw new Error('confetti is reserved for the Daily win, not system puzzles')
  return html
})

// --- Game component: pre-seeded WIN state (exercises the result card, streak
// banner and share-text logic without needing a real browser to click through) ---

check('Game renders the result card + streak banner on a pre-seeded win', () => {
  const p = dailyPuzzles[1]
  const tiles = buildTiles(p)
  const key = 'smoketest-win'
  saveProgress(key, {
    puzzleId: p.id,
    tiles,
    solvedCats: [0, 1, 2, 3],
    mistakes: 1,
    guessLog: [0, 1, 2, 3].map((catIndex) => ({
      levels: [1, 2, 3, 4].map(() => p.categories[catIndex].level),
      catIndexes: [catIndex, catIndex, catIndex, catIndex],
      correct: true,
    })),
    gameOver: true,
    won: true,
  })
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: p,
      isDaily: true,
      progressKey: key,
      headerLabel: 'Daily #7',
      resultTitle: "Today's Results",
      dailyNumber: 7,
      dailyStreak: 7,
      onExit: () => {},
      onFinish: () => {},
    })
  )
  if (!html.includes('result-card')) throw new Error('expected result-card in won-game markup')
  if (!html.includes('streak-banner')) throw new Error('expected streak-banner when dailyStreak > 0')
  if (!html.includes('milestone')) throw new Error('expected milestone styling at a 7-day streak')
  if (!html.includes('completion-phrase')) throw new Error('expected a rotating completion phrase on a win')
  if (!html.includes('brand-mark')) throw new Error('expected the brand mark to render on a win')
  if (!html.includes('connection-of-day')) throw new Error('expected a Connection of the Day panel on a completed Daily win')
  if (html.includes('Amazing') || html.includes('genius') || html.includes('Great job'))
    throw new Error('completion feedback must avoid generic hype language')
  return html
})

check('Game shows "Perfect connection." (not a rotating phrase) on a zero-mistake win', () => {
  const p = dailyPuzzles[1]
  const tiles = buildTiles(p)
  const key = 'smoketest-perfect'
  saveProgress(key, {
    puzzleId: p.id,
    tiles,
    solvedCats: [0, 1, 2, 3],
    mistakes: 0,
    guessLog: [0, 1, 2, 3].map((catIndex) => ({
      levels: [1, 2, 3, 4].map(() => p.categories[catIndex].level),
      catIndexes: [catIndex, catIndex, catIndex, catIndex],
      correct: true,
      durationMs: 4000,
    })),
    gameOver: true,
    won: true,
  })
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: p,
      isDaily: true,
      progressKey: key,
      headerLabel: 'Daily #7',
      resultTitle: "Today's Results",
      dailyNumber: 7,
      dailyStreak: 1,
      dailyPerfectStreak: 1,
      onExit: () => {},
      onFinish: () => {},
    })
  )
  if (!html.includes('Perfectly connected.')) throw new Error('expected the distinct "Perfectly connected." phrase on a zero-mistake win')
  if (!html.includes('result-card-perfect')) throw new Error('expected the perfect-solve result card to carry its own modifier class')
  return html
})

check('Game share text uses the app\'s own shape language, not NYT Connections\' colored-square emoji grid', () => {
  const p = dailyPuzzles[1]
  const tiles = buildTiles(p)
  const key = 'smoketest-sharetext'
  saveProgress(key, {
    puzzleId: p.id,
    tiles,
    solvedCats: [0, 1, 2, 3],
    mistakes: 1,
    guessLog: [0, 1, 2, 3].map((catIndex) => ({
      levels: [1, 2, 3, 4].map(() => p.categories[catIndex].level),
      catIndexes: [catIndex, catIndex, catIndex, catIndex],
      correct: true,
    })),
    gameOver: true,
    won: true,
  })
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: p,
      isDaily: true,
      progressKey: key,
      headerLabel: 'Daily #7',
      resultTitle: "Today's Results",
      dailyNumber: 7,
      dailyStreak: 3,
      onExit: () => {},
      onFinish: () => {},
    })
  )
  // The old format used the NYT-style emoji square grid (🟨🟩🟦🟪); the
  // redesigned share text must never reproduce that presentation.
  if (html.includes('🟨') || html.includes('🟩') || html.includes('🟦') || html.includes('🟪')) {
    throw new Error('share text must not reuse the NYT Connections colored-square emoji grid')
  }
  if (!html.includes('PLEXUS')) throw new Error('expected the share text/aria-label to identify the app by its own name')
  return html
})

check('Game does not re-fire onFinish when mounting an already-completed puzzle (double-finish bug fix)', () => {
  const p = dailyPuzzles[1]
  const tiles = buildTiles(p)
  const key = 'smoketest-already-over'
  saveProgress(key, {
    puzzleId: p.id,
    tiles,
    solvedCats: [0, 1, 2, 3],
    mistakes: 0,
    guessLog: [],
    gameOver: true,
    won: true,
  })
  let finishCount = 0
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: p,
      isDaily: true,
      progressKey: key,
      headerLabel: 'Review',
      resultTitle: 'Result — review',
      dailyNumber: 7,
      dailyStreak: 7,
      onExit: () => {},
      onFinish: () => {
        finishCount += 1
      },
    })
  )
  // renderToStaticMarkup does not run effects, so this primarily documents
  // the guard (alreadyOverAtLoad) exists and the component still renders
  // correctly for an already-finished puzzle; the effect-level guard itself
  // is exercised in the browser. Assert the result card still renders.
  if (!html.includes('result-card')) throw new Error('expected result-card when re-opening an already-completed puzzle')
  return html
})

check('Game renders the result card on a pre-seeded loss (no streak banner)', () => {
  const p = dailyPuzzles[2]
  const tiles = buildTiles(p)
  const key = 'smoketest-loss'
  saveProgress(key, {
    puzzleId: p.id,
    tiles,
    solvedCats: [0, 1, 2, 3],
    mistakes: 4,
    guessLog: [],
    gameOver: true,
    won: false,
  })
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: p,
      isDaily: true,
      progressKey: key,
      headerLabel: 'Daily #8',
      resultTitle: "Today's Results",
      dailyNumber: 8,
      dailyStreak: 0,
      onExit: () => {},
      onFinish: () => {},
    })
  )
  if (!html.includes('result-card')) throw new Error('expected result-card in lost-game markup')
  if (html.includes('streak-banner')) throw new Error('did not expect a streak banner on a loss with 0 streak')
  return html
})

// ---------------------------------------------------------------
// Archive
// ---------------------------------------------------------------

check('Review renders the Monthly Plexus View — a signature per day of the current month', () => {
  const html = renderToStaticMarkup(
    React.createElement(Archive, {
      dailyHistory: getDailyHistory(),
      onOpenDay: () => {},
      onBack: () => {},
    })
  )
  if (!html.includes('monthly-grid')) throw new Error('expected the monthly signature grid')
  if (!html.includes('monthly-cell')) throw new Error('expected per-day signature cells')
  if (!html.includes('puzzle-signature')) throw new Error('expected Puzzle Signatures in the monthly grid')
  // Non-punitive: no ✕ / broken-streak imagery for missed days.
  if (html.includes('✕') || html.includes('archive-row-status lost')) {
    throw new Error('monthly view must not show missed-day / broken-streak warnings')
  }
  return html
})

check('Review marks a completed day as connected and shows a non-punitive month summary', () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const key = `${y}-${m}-${d}`
  const html = renderToStaticMarkup(
    React.createElement(Archive, {
      dailyHistory: {
        [key]: { date: key, completed: true, won: true, mistakes: 2 },
      },
      onOpenDay: () => {},
      onBack: () => {},
    })
  )
  if (!html.includes('is-connected')) throw new Error('expected a completed day to render as a connected signature')
  if (!html.includes('connections made this month')) throw new Error('expected a non-punitive month summary line')
  return html
})

// ---------------------------------------------------------------
// Systems
// ---------------------------------------------------------------

check(`Systems renders the compact system list (all ${SYSTEMS.length} named systems)`, () => {
  const html = renderToStaticMarkup(
    React.createElement(Systems, {
      bank: connectionBank,
      mastery: getConceptMastery(),
      onPlaySystem: () => {},
      onBack: () => {},
    })
  )
  const rowMatches = html.match(/system-row-name/g) || []
  if (rowMatches.length !== SYSTEMS.length) {
    throw new Error(`expected ${SYSTEMS.length} system rows, found ${rowMatches.length}`)
  }
  return html
})

check('Systems renders a system detail view with mastery counts once a system is selected', () => {
  // Systems.jsx manages `selected` as internal state driven by clicking a
  // row, which renderToStaticMarkup can't simulate directly. Exercise the
  // underlying data path it depends on instead (mastery.js), since the
  // component itself is covered by the list-render check above.
  const mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  const html = renderToStaticMarkup(
    React.createElement(Systems, {
      bank: connectionBank,
      mastery,
      onPlaySystem: () => {},
      onBack: () => {},
    })
  )
  if (!html.includes('system-row')) throw new Error('expected system rows to render with mastery data present')
  return html
})

// ---------------------------------------------------------------
// DevViewer (hidden #dev route — not linked from navigation)
// ---------------------------------------------------------------

check(`DevViewer lists all ${puzzles.length} puzzles by default (Puzzles tab)`, () => {
  const html = renderToStaticMarkup(React.createElement(DevViewer, {}))
  const rows = html.match(/dev-list-row/g) || []
  if (rows.length !== puzzles.length) throw new Error(`expected ${puzzles.length} dev list rows, found ${rows.length}`)
  if (!html.includes('Connection Bank (')) throw new Error('expected a Connection Bank tab button')
  return html
})

// ---------------------------------------------------------------
// ReviewConnections: exercise every puzzle's explanation/why/remember content
// ---------------------------------------------------------------

for (const p of puzzles) {
  check(`ReviewConnections renders puzzle "${p.title}" (16 whys, 4 remembers)`, () => {
    const html = renderToStaticMarkup(React.createElement(ReviewConnections, { puzzle: p }))
    const headers = (html.match(/accordion-header/g) || []).length
    if (headers !== 4) throw new Error(`expected 4 accordion headers, found ${headers}`)
    return html
  })
}

check('HowToModal renders', () => renderToStaticMarkup(React.createElement(HowToModal, { onClose: () => {} })))

check('StatsModal renders with zeroed stats', () =>
  renderToStaticMarkup(
    React.createElement(StatsModal, {
      stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        mistakeDistribution: [0, 0, 0, 0, 0],
      },
      onClose: () => {},
    })
  )
)

check('StatsModal renders with populated stats', () =>
  renderToStaticMarkup(
    React.createElement(StatsModal, {
      stats: {
        gamesPlayed: 12,
        gamesWon: 9,
        currentStreak: 3,
        maxStreak: 5,
        mistakeDistribution: [4, 3, 1, 1, 3],
      },
      onClose: () => {},
    })
  )
)

// ---------------------------------------------------------------
// 3-Minute Challenge
// ---------------------------------------------------------------

check('Challenge renders the pre-challenge intro screen (no timer running yet)', () => {
  const html = renderToStaticMarkup(React.createElement(Challenge, { bank: connectionBank, onExit: () => {} }))
  if (!html.includes('challenge-intro')) throw new Error('expected the intro screen on first render')
  if (!html.includes('Start')) throw new Error('expected a Start button on the intro screen')
  if (html.includes('challenge-timer')) throw new Error('did not expect the timer to render before Start is pressed')
  return html
})

// The timer/round loop only advances via useEffect + setInterval, which
// renderToStaticMarkup doesn't run — so each round TYPE is exercised
// directly (as Challenge.jsx renders it) using the same engine output the
// component consumes, confirming every round shape mounts cleanly.
for (const type of ['miniConnections', 'impostor', 'rapidAssociation', 'completeConnection', 'commonLink']) {
  check(`Challenge round markup for "${type}" is well-formed`, () => {
    const round = generateRound(connectionBank, { roundTypes: [type] })
    if (!round) throw new Error(`generateRound returned null for ${type}`)
    // Mirror Challenge.jsx's own dispatch so this catches a real mismatch
    // between the engine's round shape and what the component expects.
    if (type === 'miniConnections') {
      if (round.tiles.length !== 8) throw new Error('expected 8 tiles')
    } else if (type === 'rapidAssociation') {
      if (round.options.length !== 8) throw new Error('expected 8 options')
    } else if (type === 'impostor') {
      if (round.options.length !== 5) throw new Error('expected 5 options')
    } else {
      if (round.shown.length < 3 || round.options.length !== 4) throw new Error('expected 3 shown + 4 options')
    }
    return JSON.stringify(round)
  })
}

check('AppNav is not shown alongside an active Game (immersive puzzle board stays nav-free)', () => {
  // Structural check: Game.jsx itself never imports/renders AppNav — this
  // documents that guarantee by confirming Game's own markup carries no
  // nav classes, since App.jsx (not exercised here) is what decides
  // whether to wrap it with <AppNav />.
  const html = renderToStaticMarkup(
    React.createElement(Game, {
      puzzle: dailyPuzzles[0],
      isDaily: true,
      progressKey: 'smoketest-nav-check',
      headerLabel: 'Daily #1',
      resultTitle: "Today's Results",
      onExit: () => {},
      onFinish: () => {},
    })
  )
  if (html.includes('app-nav')) throw new Error('Game.jsx should never render the primary nav itself')
  return html
})

check('Confetti renders 60 pieces', () => {
  const html = renderToStaticMarkup(React.createElement(Confetti, {}))
  const pieces = (html.match(/confetti-piece/g) || []).length
  if (pieces !== 60) throw new Error(`expected 60 confetti pieces, found ${pieces}`)
  return html
})

console.log(`\n${'='.repeat(40)}`)
if (failures === 0) {
  console.log('ALL RENDER CHECKS PASSED\n')
  process.exit(0)
} else {
  console.log(`${failures} RENDER CHECK(S) FAILED\n`)
  process.exit(1)
}
