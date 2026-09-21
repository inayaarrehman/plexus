import React, { useEffect, useMemo, useRef, useState } from 'react'
import { DIFFICULTY } from '../puzzles.js'
import { buildTiles, isFullMatch, isOneAway, shuffle, attemptKey, isDuplicateAttempt, MAX_MISTAKES, STREAK_MILESTONES } from '../utils/game.js'
import { loadProgress, saveProgress } from '../utils/storage.js'
import { getCompletionPhrase } from '../utils/completionPhrases.js'
import { buildShareText } from '../utils/shareText.js'
import { computeDailyMicroStat } from '../utils/dailyMicroStat.js'
import { pickConnectionOfDay } from '../utils/connectionOfDay.js'
import Confetti from './Confetti.jsx'
import BrandMark from './BrandMark.jsx'
import PuzzleSignature from './PuzzleSignature.jsx'
import PlexusLine from './PlexusLine.jsx'
import ReviewConnections from './ReviewConnections.jsx'
import { haptics } from '../utils/haptics.js'

const levelColor = (level) => DIFFICULTY.find((d) => d.level === level)?.color || '#888'
const levelShape = (level) => DIFFICULTY.find((d) => d.level === level)?.shape || '?'
const levelShapeLabel = (level) => DIFFICULTY.find((d) => d.level === level)?.shapeLabel || ''

export default function Game({
  puzzle,
  isDaily,
  progressKey,
  headerLabel,
  resultTitle,
  shareLabel,
  dailyNumber,
  dailyStreak,
  dailyPerfectStreak = 0,
  onExit,
  onFinish,
  onKnowledgeSignal,
}) {
  const initial = useMemo(() => {
    const saved = loadProgress(progressKey)
    if (saved && saved.puzzleId === puzzle.id) return saved
    return {
      puzzleId: puzzle.id,
      tiles: buildTiles(puzzle),
      solvedCats: [],
      mistakes: 0,
      guessLog: [],
      gameOver: false,
      won: false,
    }
  }, [progressKey, puzzle])

  // Whether this puzzle was ALREADY completed before this component mounted
  // (e.g. reopening "Review today" or an Archive day). Captured once so we
  // never re-report a finish — and re-inflate stats — just from reopening
  // an already-solved puzzle.
  const alreadyOverAtLoad = useRef(initial.gameOver)

  const [tiles, setTiles] = useState(initial.tiles)
  const [solvedCats, setSolvedCats] = useState(initial.solvedCats)
  const [mistakes, setMistakes] = useState(initial.mistakes)
  const [guessLog, setGuessLog] = useState(initial.guessLog)
  const [gameOver, setGameOver] = useState(initial.gameOver)
  const [won, setWon] = useState(initial.won)

  const [selected, setSelected] = useState([])
  const [shakeIds, setShakeIds] = useState([])
  const [oneAwayIds, setOneAwayIds] = useState([])
  const [message, setMessage] = useState('')
  const [popCatIndex, setPopCatIndex] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const finishReported = useRef(false)
  const msgTimer = useRef(null)
  // For the "Fastest group" daily micro-stat only — an approximate, purely
  // informational timing, not a scored/competitive metric. Resets each
  // mount, which is fine for a one-line fun-fact rather than a leaderboard.
  const lastSolveTimeRef = useRef(Date.now())

  // Persist progress on every meaningful change.
  useEffect(() => {
    saveProgress(progressKey, {
      puzzleId: puzzle.id,
      tiles,
      solvedCats,
      mistakes,
      guessLog,
      gameOver,
      won,
    })
  }, [progressKey, puzzle.id, tiles, solvedCats, mistakes, guessLog, gameOver, won])

  useEffect(() => {
    if (gameOver && !finishReported.current && !alreadyOverAtLoad.current) {
      finishReported.current = true
      onFinish({ won, mistakes, guessLog, puzzle })
    }
  }, [gameOver, won, mistakes, guessLog, puzzle, onFinish])

  const flashMessage = (text, ms = 1500) => {
    setMessage(text)
    clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setMessage(''), ms)
  }

  useEffect(() => () => clearTimeout(msgTimer.current), [])

  const remainingTiles = tiles.filter((t) => !solvedCats.includes(t.catIndex))

  const toggleTile = (tile) => {
    if (gameOver) return
    const already = selected.find((t) => t.text === tile.text && t.catIndex === tile.catIndex)
    if (!already && selected.length < 4) haptics.select() // proposing a connection
    setSelected((prev) => {
      const dup = prev.find((t) => t.text === tile.text && t.catIndex === tile.catIndex)
      if (dup) return prev.filter((t) => t !== dup)
      if (prev.length >= 4) return prev
      return [...prev, tile]
    })
  }

  const handleShuffle = () => {
    setTiles((prev) => {
      const unsolved = prev.filter((t) => !solvedCats.includes(t.catIndex))
      const solved = prev.filter((t) => solvedCats.includes(t.catIndex))
      return [...solved, ...shuffle(unsolved)]
    })
  }

  const handleDeselect = () => setSelected([])

  const handleSubmit = () => {
    if (selected.length !== 4 || gameOver) return
    // Duplicate detection is keyed on the four tiles' STABLE identities
    // (order-independent, exact), not on which categories they came from —
    // see isDuplicateAttempt/attemptKey. This is the fix for false
    // "Already tried this combo" warnings.
    const key = attemptKey(selected)
    const alreadyGuessed = isDuplicateAttempt(guessLog, selected)

    const levels = selected.map((t) => t.level).sort((a, b) => a - b)
    const catIndexes = selected.map((t) => t.catIndex)

    if (isFullMatch(selected)) {
      const catIndex = selected[0].catIndex
      const now = Date.now()
      const durationMs = now - lastSolveTimeRef.current
      lastSolveTimeRef.current = now
      setSolvedCats((prev) => [...prev, catIndex])
      setGuessLog((prev) => [
        ...prev,
        { levels: [selected[0].level, selected[0].level, selected[0].level, selected[0].level], catIndexes, correct: true, durationMs, attemptKey: key },
      ])
      setPopCatIndex(catIndex)
      haptics.correct() // connection formed
      setTimeout(() => setPopCatIndex(null), 700)
      setSelected([])
      flashMessage('Connected')

      if (solvedCats.length + 1 === 4) {
        setTimeout(() => {
          haptics.complete() // the network completes
          setWon(true)
          setGameOver(true)
        }, 500)
      }
      return
    }

    // Wrong guess. The haptic is identical for every wrong guess (including
    // One Away) so it can never signal how close the selection was.
    setGuessLog((prev) => [...prev, { levels, catIndexes, correct: false, attemptKey: key }])
    haptics.incorrect()
    const oneAway = isOneAway(selected)
    // One Away gets its own subtle feedback (a synchronized pulse) instead
    // of the plain shake — applied identically to all 4 selected tiles, on
    // purpose: it must never single out which 3 belong together.
    if (oneAway) {
      setOneAwayIds(selected.map((t) => t.text))
      setTimeout(() => setOneAwayIds([]), 600)
    } else {
      setShakeIds(selected.map((t) => t.text))
      setTimeout(() => setShakeIds([]), 500)
    }

    if (alreadyGuessed) {
      flashMessage('Already tried that combo')
    } else if (oneAway) {
      flashMessage('One link away')
    } else {
      flashMessage('Not quite')
    }

    const newMistakes = mistakes + 1
    setMistakes(newMistakes)
    if (newMistakes >= MAX_MISTAKES) {
      setSelected([])
      setTimeout(() => {
        setSolvedCats([0, 1, 2, 3])
        setGameOver(true)
        setWon(false)
      }, 500)
    }
  }

  const mistakesLeft = MAX_MISTAKES - mistakes

  const isMilestone = isDaily && won && STREAK_MILESTONES.includes(dailyStreak)

  const completionPhrase = useMemo(
    () => (gameOver && won ? getCompletionPhrase({ puzzleId: puzzle.id, mistakes }) : ''),
    [gameOver, won, puzzle.id, mistakes]
  )
  const isPerfect = won && mistakes === 0

  const dailyMicroStat = useMemo(
    () => (isDaily && gameOver && won ? computeDailyMicroStat({ mistakes, guessLog, dailyPerfectStreak }) : null),
    [isDaily, gameOver, won, mistakes, guessLog, dailyPerfectStreak]
  )

  const connectionOfDay = useMemo(
    () => (isDaily && gameOver && won ? pickConnectionOfDay(puzzle) : null),
    [isDaily, gameOver, won, puzzle]
  )

  const shareText = useMemo(
    () =>
      buildShareText({
        isDaily,
        dailyNumber,
        puzzleTitle: puzzle.title,
        shareLabel,
        guessLog,
        won,
        mistakes,
        dailyStreak,
      }),
    [isDaily, dailyNumber, puzzle.title, shareLabel, guessLog, won, mistakes, dailyStreak]
  )

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMessage('Copy failed — select and copy manually')
    }
  }

  const orderedSolvedCats = puzzle.categories
    .map((c, i) => ({ ...c, catIndex: i }))
    .filter((c) => solvedCats.includes(c.catIndex))
    .sort((a, b) => solvedCats.indexOf(a.catIndex) - solvedCats.indexOf(b.catIndex))

  return (
    <div className="game">
      <div className="game-header">
        <button className="icon-btn" onClick={onExit} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>{headerLabel}</span>
        </div>
        <div className="mistakes-indicator" aria-label={`${mistakesLeft} mistakes remaining`}>
          {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
            <span key={i} className={`dot ${i < mistakesLeft ? 'dot-live' : 'dot-spent'}`} />
          ))}
        </div>
      </div>

      {message && <div className="toast">{message}</div>}

      {/* The Daily's deterministic Puzzle Signature: loose nodes while the
          board is unsolved, its connected form once won — the puzzle's own
          tiny identity, transforming in place. Decorative only. */}
      {isDaily && (
        <div className="daily-id-row">
          <PuzzleSignature seed={puzzle.id} resolved={gameOver && won} size={34} animate={gameOver && won} />
          <span className="daily-id-label">Daily {String(dailyNumber ?? '').padStart(3, '0')}</span>
        </div>
      )}

      {/* Solved categories render as Plexus Strands: four concept-nodes on
          one connecting path, in the category's colour. Once the whole
          board is solved the stack draws together (strand-stack-complete)
          and leads into the completion mark on the result card below. */}
      <div className={`strand-stack ${gameOver ? 'strand-stack-complete' : ''}`}>
        {orderedSolvedCats.map((c) => (
          <div
            key={c.catIndex}
            className={`strand ${popCatIndex === c.catIndex ? 'strand-form' : ''} ${
              popCatIndex === c.catIndex && c.level === 4 ? 'strand-form-expert' : ''
            }`}
            style={{ '--strand-color': levelColor(c.level) }}
          >
            <div className="strand-head">
              <span className="strand-badge" aria-label={levelShapeLabel(c.level)}>
                {levelShape(c.level)}
              </span>
              <span className="strand-title">{c.title}</span>
            </div>
            <ol className="strand-nodes">
              {c.items.map((it) => (
                <li className="strand-node" key={it.term}>
                  <span className="strand-dot" aria-hidden="true" />
                  <span className="strand-term">{it.term}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {!gameOver && (
        <>
          {solvedCats.length === 0 && selected.length === 0 && (
            <p className="board-hint">Find what connects.</p>
          )}
          <div className="tile-grid">
            {remainingTiles.map((tile) => {
              const isSelected = selected.some((t) => t.text === tile.text && t.catIndex === tile.catIndex)
              const isShaking = shakeIds.includes(tile.text)
              const isOneAwayPulse = oneAwayIds.includes(tile.text)
              return (
                <button
                  key={tile.text}
                  className={`tile ${isSelected ? 'tile-selected' : ''} ${
                    isSelected && selected.length >= 2 ? 'tile-proposing' : ''
                  } ${isSelected && selected.length === 4 ? 'tile-grouped' : ''} ${
                    isShaking ? 'tile-break' : ''
                  } ${isOneAwayPulse ? 'tile-oneaway-pulse' : ''}`}
                  onClick={() => toggleTile(tile)}
                >
                  {tile.text}
                </button>
              )
            })}
          </div>

          <div className="game-controls">
            <button className="secondary-btn" onClick={handleShuffle}>
              Shuffle
            </button>
            <button className="secondary-btn" onClick={handleDeselect} disabled={selected.length === 0}>
              Deselect
            </button>
            <button className="primary-btn" onClick={handleSubmit} disabled={selected.length !== 4}>
              Submit
            </button>
          </div>
        </>
      )}

      {gameOver && (
        <div className={`result-card ${won ? 'result-card-won' : ''} ${isPerfect ? 'result-card-perfect' : ''}`}>
          {/* Restrained by design: confetti is reserved for the Daily win,
              not every puzzle completion — see product direction on
              avoiding constant/loot-box-style celebration. */}
          {isDaily && won && <Confetti />}

          {won && <BrandMark size={40} className="result-brandmark" animate decorative />}

          <h2>{resultTitle || (isDaily ? "Today's Results" : 'Puzzle Results')}</h2>

          {won && <p className="completion-phrase">{completionPhrase}</p>}

          <div className="result-grid" role="img" aria-label={`${guessLog.length} guesses: ${shareText}`}>
            {guessLog.map((g, i) => (
              <div className="result-grid-row" key={i}>
                {g.levels.map((lv, j) => (
                  <span key={j} className="result-square" style={{ backgroundColor: levelColor(lv) }}>
                    {levelShape(lv)}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <p className="result-summary">
            {won
              ? `Solved with ${mistakes} mistake${mistakes === 1 ? '' : 's'}.`
              : 'Out of guesses — here are the groups you missed.'}
          </p>

          {isDaily && dailyStreak > 0 && (
            <div className={`streak-banner ${isMilestone ? 'milestone' : ''}`}>
              {dailyStreak} day streak{isMilestone ? '!' : ''}
            </div>
          )}

          {dailyMicroStat && <p className="daily-micro-stat">{dailyMicroStat}</p>}

          <div className="result-actions">
            <button className="primary-btn" onClick={handleShare}>
              {copied ? 'Copied!' : 'Share Results'}
            </button>
            <button className="secondary-btn" onClick={() => setShowReview((v) => !v)}>
              {showReview ? 'Hide Review' : 'Review Connections'}
            </button>
            <button className="secondary-btn" onClick={onExit}>
              Keep Playing
            </button>
          </div>

          {showReview && <ReviewConnections puzzle={puzzle} onKnowledgeSignal={onKnowledgeSignal} />}

          {connectionOfDay && <PlexusLine className="result-divider" />}
          {connectionOfDay && (
            <div className="connection-of-day">
              <h3 className="connection-of-day-heading">Connection of the day</h3>
              <p className="connection-of-day-title">{connectionOfDay.title}</p>
              <p className="connection-of-day-explanation">{connectionOfDay.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
