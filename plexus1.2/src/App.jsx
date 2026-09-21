import React, { useEffect, useMemo, useState } from 'react'
import connectionBank from './data/connectionBank.js'
import Home from './components/Home.jsx'
import Game from './components/Game.jsx'
import Archive from './components/Archive.jsx'
import Systems from './components/Systems.jsx'
import Challenge from './components/Challenge.jsx'
import AppNav from './components/AppNav.jsx'
import HowToModal from './components/HowToModal.jsx'
import StatsModal from './components/StatsModal.jsx'
import DevViewer from './components/DevViewer.jsx'
import { dateKey, dayNumber } from './utils/game.js'
import { getDailyPuzzleForDate } from './utils/dailyPuzzle.js'
import { assembleSystemPuzzle } from './utils/puzzleAssembler.js'
import { systemMasteryCounts } from './utils/mastery.js'
import {
  loadStats,
  recordResult,
  loadProgress,
  getDailyHistory,
  recordDailyHistory,
  getSystemProgress,
  recordSystemAttempt,
  recordWeakSpots,
  recordKnowledgeSignal,
  recordNearMissConfusions,
  getConceptMastery,
  recordConceptMastery,
  getChallengeStats,
} from './utils/storage.js'

// Builds Weak Spot data points from one finished attempt: every category
// touched by a wrong guess (the "concepts involved"), plus every category's
// final solved/unsolved status. Keyed by category title so the same concept
// aggregates across different puzzles.
function buildWeakSpotResults(puzzle, guessLog) {
  const results = []
  const solvedSet = new Set()
  guessLog.forEach((g) => {
    if (g.correct) {
      const catIndex = g.catIndexes[0]
      solvedSet.add(catIndex)
      results.push({ tag: puzzle.categories[catIndex].title, solved: true })
    } else {
      const uniqueCats = [...new Set(g.catIndexes)]
      uniqueCats.forEach((ci) => {
        results.push({ tag: puzzle.categories[ci].title, solved: false })
      })
    }
  })
  puzzle.categories.forEach((cat, i) => {
    if (!solvedSet.has(i)) {
      results.push({ tag: cat.title, solved: false })
    }
  })
  return results
}

// Near Miss Memory (Section 14): scans the finished attempt's wrong
// guesses for "one away" mix-ups (3 tiles from one category + 1 from
// another) and returns the confused-category-title pairs so
// recordNearMissConfusions can track which two concepts keep getting
// mixed up together, across attempts — not shown to the player yet, just
// recorded for a future Weak Spots feature to draw on.
function buildNearMissResults(puzzle, guessLog) {
  const pairs = []
  guessLog.forEach((g) => {
    if (g.correct) return
    const counts = {}
    g.catIndexes.forEach((ci) => {
      counts[ci] = (counts[ci] || 0) + 1
    })
    const entries = Object.entries(counts)
    const majority = entries.find(([, c]) => c === 3)
    const minority = entries.find(([, c]) => c === 1)
    if (majority && minority) {
      const a = puzzle.categories[Number(majority[0])]?.title
      const b = puzzle.categories[Number(minority[0])]?.title
      if (a && b) pairs.push({ a, b })
    }
  })
  return pairs
}

// Builds concept-mastery data points, one per category that actually came
// from the connection bank (assembled puzzles carry a `bankCategoryId` on
// each category; hand-written Daily Puzzle categories don't, and are
// simply skipped here — mastery tracking only applies to bank content).
// "Clean" means solved correctly with no wrong guess ever touching it.
function buildMasteryResults(puzzle, guessLog) {
  const results = []
  puzzle.categories.forEach((cat, catIndex) => {
    if (!cat.bankCategoryId) return
    const wasWronglyTouched = guessLog.some((g) => !g.correct && g.catIndexes.includes(catIndex))
    const wasCorrectlySolved = guessLog.some((g) => g.correct && g.catIndexes[0] === catIndex)
    results.push({
      bankCategoryId: cat.bankCategoryId,
      solved: wasCorrectlySolved,
      cleanSolve: wasCorrectlySolved && !wasWronglyTouched,
    })
  })
  return results
}

export default function App() {
  const [isDevRoute, setIsDevRoute] = useState(() => window.location.hash === '#dev')
  useEffect(() => {
    const onHashChange = () => setIsDevRoute(window.location.hash === '#dev')
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const [view, setView] = useState('home') // 'home' | 'game' | 'archive' | 'systems' | 'challenge'
  const [gameCtx, setGameCtx] = useState(null)
  const [challengePhase, setChallengePhase] = useState('intro')
  const [showHowTo, setShowHowTo] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState(loadStats())
  const [refreshTick, setRefreshTick] = useState(0)
  const [systemPlayNotice, setSystemPlayNotice] = useState(null)

  const today = new Date()
  const todayKey = dateKey(today)
  const todayDayNumber = dayNumber(today)

  const dailyDone = useMemo(() => {
    const p = loadProgress(`daily-${todayKey}`)
    return !!p?.gameOver
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayKey, refreshTick])

  const mastery = useMemo(() => getConceptMastery(), [refreshTick])
  const systemProgress = useMemo(() => getSystemProgress(), [refreshTick])
  const continueSystem = dailyDone ? systemProgress.lastPlayedSystem : null
  const continueSystemCounts = useMemo(
    () =>
      continueSystem
        ? systemMasteryCounts(connectionBank, continueSystem, mastery)
        : { total: 0, solved: 0, mastered: 0 },
    [continueSystem, mastery]
  )
  const challengeBest = useMemo(() => getChallengeStats().personalBest, [refreshTick])
  // Total Dailies ever completed — feeds only the ambient homepage network
  // (Section 10). Derived from existing history; no new persistence.
  const dailiesCompleted = useMemo(() => {
    const h = getDailyHistory()
    return Object.values(h).filter((e) => e?.completed).length
  }, [refreshTick])

  useEffect(() => {
    if (view === 'home') setRefreshTick((t) => t + 1)
  }, [view])

  // Purely presentational: paint each screen its own full-viewport Plexus
  // environment colour by toggling a class on <body> (so the colour bleeds
  // past the centred app-shell rather than stopping at it). Home is
  // periwinkle, the Daily/Archive board is apricot, a system puzzle stays
  // in the seafoam Systems room, Review is plum, and the 3-Minute
  // Challenge is cobalt (deepened while a round is actually live). The
  // hidden #dev route stays on the plain neutral surface. Toggles CSS
  // classes only — no effect on any game logic or state.
  useEffect(() => {
    const b = document.body
    const gameMode = gameCtx?.mode
    const isDailyBoard = view === 'game' && (gameMode === 'daily' || gameMode === 'archive')
    const isSystemBoard = view === 'game' && gameMode === 'system'
    b.classList.toggle('bg-home', !isDevRoute && view === 'home')
    b.classList.toggle('env-daily', !isDevRoute && isDailyBoard)
    b.classList.toggle('env-systems', !isDevRoute && (view === 'systems' || isSystemBoard))
    b.classList.toggle('env-review', !isDevRoute && view === 'archive')
    b.classList.toggle('env-challenge', !isDevRoute && view === 'challenge')
    b.classList.toggle('bg-challenge-focus', !isDevRoute && view === 'challenge' && challengePhase === 'playing')
  }, [view, gameCtx, challengePhase, isDevRoute])

  const goHome = () => {
    setGameCtx(null)
    setView('home')
  }

  const navigate = (key) => {
    if (key === 'challenge') setChallengePhase('intro')
    setView(key)
  }

  const openArchiveDay = (dateStr, puzzle, wasCompleted) => {
    const isToday = dateStr === todayKey
    setGameCtx({
      puzzle,
      mode: isToday ? 'daily' : 'archive',
      progressKey: `daily-${dateStr}`,
      headerLabel: isToday ? `Daily #${todayDayNumber}` : `Archive · ${dateStr}`,
      resultTitle: isToday ? "Today's Results" : `Result — ${dateStr}`,
      dailyNumber: puzzle.number,
      dailyStreak: stats.currentStreak,
      dateForHistory: dateStr,
      isToday,
    })
    setView('game')
  }

  const openDailyToday = () => {
    const puzzle = getDailyPuzzleForDate(today)
    if (!puzzle) return
    openArchiveDay(todayKey, puzzle, dailyDone)
  }

  // Assembles a fresh puzzle for a system on the spot (the Organ System
  // Library's PLAY button) — no pre-generated file, no numbered puzzle to
  // pick. Biased away from already-mastered concepts via `mastery`.
  const playSystem = (system) => {
    const puzzle = assembleSystemPuzzle(connectionBank, system, { mastery })
    if (!puzzle) {
      // Organ-purity filtering (no fallback to unrelated categories) means
      // a thin system can genuinely have no eligible combination for some
      // tier right now — tell the player plainly instead of doing nothing.
      setSystemPlayNotice(`Not enough verified ${system} content yet for a full puzzle. Check back as more categories are added.`)
      return
    }
    setSystemPlayNotice(null)
    setGameCtx({
      puzzle,
      mode: 'system',
      progressKey: puzzle.id,
      headerLabel: system,
      resultTitle: 'Puzzle Results',
      system,
      isDaily: false,
    })
    setView('game')
  }

  const handleContinueStudying = () => {
    if (!continueSystem) {
      setView('systems')
      return
    }
    playSystem(continueSystem)
  }

  const handleFinish = ({ won, mistakes, guessLog, puzzle }) => {
    if (!gameCtx) return
    const { mode, dateForHistory, isToday, system } = gameCtx

    recordWeakSpots(buildWeakSpotResults(puzzle, guessLog))
    recordNearMissConfusions(buildNearMissResults(puzzle, guessLog))

    if (mode === 'daily' || mode === 'archive') {
      recordDailyHistory({
        date: dateForHistory,
        puzzleId: puzzle.id,
        puzzleNumber: puzzle.number,
        completed: true,
        won,
        mistakes,
        completedAt: new Date().toISOString(),
      })
      const updated = recordResult({ won, mistakes, isDaily: true, dailyKey: dateForHistory, countsTowardStreak: isToday })
      setStats(updated)
    } else if (mode === 'system') {
      recordConceptMastery(buildMasteryResults(puzzle, guessLog))
      const correctGuesses = guessLog.filter((g) => g.correct).length
      const totalGuesses = guessLog.length
      const solvedCount = new Set(guessLog.filter((g) => g.correct).map((g) => g.catIndexes[0])).size
      recordSystemAttempt({
        puzzleId: puzzle.id,
        system,
        won,
        mistakes,
        correctGuesses,
        totalGuesses,
        categoriesMissed: 4 - solvedCount,
      })
      const updated = recordResult({ won, mistakes, isDaily: false, countsTowardStreak: false })
      setStats(updated)
    }
    setRefreshTick((t) => t + 1)
  }

  if (isDevRoute) {
    return <DevViewer />
  }

  if (view === 'game' && gameCtx) {
    return (
      <div className="app-shell">
        <Game
          key={gameCtx.progressKey}
          puzzle={gameCtx.puzzle}
          isDaily={gameCtx.mode === 'daily' || gameCtx.mode === 'archive'}
          progressKey={gameCtx.progressKey}
          headerLabel={gameCtx.headerLabel}
          resultTitle={gameCtx.resultTitle}
          shareLabel={gameCtx.mode === 'system' ? gameCtx.system : undefined}
          dailyNumber={gameCtx.dailyNumber}
          dailyStreak={gameCtx.isToday ? stats.currentStreak : 0}
          dailyPerfectStreak={gameCtx.isToday ? stats.currentPerfectStreak : 0}
          onExit={goHome}
          onFinish={handleFinish}
          onKnowledgeSignal={recordKnowledgeSignal}
        />
      </div>
    )
  }

  if (view === 'challenge') {
    return (
      <div className="app-shell">
        {challengePhase !== 'playing' && <AppNav active="challenge" onNavigate={navigate} />}
        <Challenge bank={connectionBank} onExit={goHome} onPhaseChange={setChallengePhase} />
      </div>
    )
  }

  if (view === 'archive') {
    return (
      <div className="app-shell">
        <AppNav active="archive" onNavigate={navigate} />
        <Archive dailyHistory={getDailyHistory()} onOpenDay={openArchiveDay} onBack={goHome} />
      </div>
    )
  }

  if (view === 'systems') {
    return (
      <div className="app-shell">
        <AppNav active="systems" onNavigate={navigate} />
        <Systems
          bank={connectionBank}
          mastery={mastery}
          onPlaySystem={playSystem}
          onBack={goHome}
          playNotice={systemPlayNotice}
          onDismissPlayNotice={() => setSystemPlayNotice(null)}
        />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <AppNav active="home" onNavigate={navigate} />
      <Home
        dailyNumber={todayDayNumber}
        dailyDone={dailyDone}
        currentStreak={stats.currentStreak}
        continueSystem={continueSystem}
        continueSystemSolved={continueSystemCounts.solved}
        continueSystemTotal={continueSystemCounts.total}
        challengeBest={challengeBest}
        dailiesCompleted={dailiesCompleted}
        onPlayDaily={openDailyToday}
        onOpenSystems={() => setView('systems')}
        onContinueStudying={handleContinueStudying}
        onStartChallenge={() => navigate('challenge')}
        onOpenStats={() => setShowStats(true)}
        onOpenHowTo={() => setShowHowTo(true)}
      />
      {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
      {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}
    </div>
  )
}
