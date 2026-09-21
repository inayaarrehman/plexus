import React, { useMemo, useState } from 'react'
import { getDailyPuzzleForDate, isFutureDateKey } from '../utils/dailyPuzzle.js'
import { dateKey } from '../utils/game.js'
import { getSavedConnections, toggleSavedConnection } from '../utils/storage.js'
import PuzzleSignature from './PuzzleSignature.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const MONTH_COLS = 7

// Deterministic, sparse peripheral connections for the Monthly Plexus
// (Sections 18–21). Only completed days participate; each connects only to
// spatially-adjacent completed days (immediate right / the row below), and
// every node's degree is capped at 2 — so the month grows into a structure
// rather than a spiderweb, never connecting every day to every other. Given
// the same completed set it renders identically (no randomness). Missed days
// are simply absent from the graph; the network routes around them.
function monthlyConnections(completedSet, cols = MONTH_COLS) {
  const edges = []
  const degree = {}
  const canLink = (i) => (degree[i] || 0) < 2
  const link = (a, b) => {
    edges.push([a, b])
    degree[a] = (degree[a] || 0) + 1
    degree[b] = (degree[b] || 0) + 1
  }
  const sorted = [...completedSet].sort((a, b) => a - b)
  for (const i of sorted) {
    // Prefer short, non-crossing neighbours in a stable priority order.
    const neighbours = [i + 1, i + cols, i + cols - 1, i + cols + 1]
    for (const n of neighbours) {
      if (!completedSet.has(n)) continue
      // i+1 must be on the same row to avoid a wrap-around line.
      if (n === i + 1 && Math.floor(n / cols) !== Math.floor(i / cols)) continue
      if (canLink(i) && canLink(n)) link(i, n)
      if (!canLink(i)) break
    }
  }
  return edges
}

// The Monthly Plexus View (Sections 19–21): the month as a field of Puzzle
// Signatures rather than a streak calendar. A completed Daily shows its
// signature CONNECTED (in its Plexus colours); an unplayed or future day
// stays a faint, unresolved outline. No ✕, no broken-streak imagery, no
// red warnings — missed days are simply quiet. The month gradually becomes
// a collection of connected signatures. Tapping a real day opens it.
export default function Archive({ dailyHistory, onOpenDay, onBack }) {
  const today = new Date()
  const todayKey = dateKey(today)
  const year = today.getFullYear()
  const month = today.getMonth()

  const days = useMemo(() => {
    const count = new Date(year, month + 1, 0).getDate()
    const list = []
    for (let d = 1; d <= count; d++) {
      const date = new Date(year, month, d)
      const key = dateKey(date)
      const puzzle = getDailyPuzzleForDate(date)
      const history = dailyHistory[key]
      list.push({
        day: d,
        date,
        key,
        puzzle,
        completed: !!history?.completed,
        won: history?.won,
        mistakes: history?.mistakes,
        isToday: key === todayKey,
        isFuture: isFutureDateKey(key),
      })
    }
    return list
  }, [dailyHistory, year, month, todayKey])

  const connectionsThisMonth = days.filter((d) => d.completed).length * 4

  // Deterministic monthly network geometry, memoized so it isn't recomputed
  // on unrelated renders. Coordinates are in a cols×rows grid space (×10 for
  // stroke resolution); the SVG stretches to the grid box (preserveAspectRatio
  // none), so line endpoints land on cell centres at any width.
  const network = useMemo(() => {
    const completedSet = new Set(days.filter((d) => d.completed).map((d) => d.day - 1))
    const rows = Math.ceil(days.length / MONTH_COLS)
    const edges = monthlyConnections(completedSet, MONTH_COLS).map(([a, b]) => {
      const ax = (a % MONTH_COLS) * 10 + 5
      const ay = Math.floor(a / MONTH_COLS) * 10 + 5
      const bx = (b % MONTH_COLS) * 10 + 5
      const by = Math.floor(b / MONTH_COLS) * 10 + 5
      return { ax, ay, bx, by }
    })
    return { edges, w: MONTH_COLS * 10, h: rows * 10 }
  }, [days])

  const [saved, setSaved] = useState(() => getSavedConnections())
  const unsave = (conn) => {
    toggleSavedConnection(conn)
    setSaved(getSavedConnections())
  }

  return (
    <div className="archive">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>Review</span>
        </div>
        <div />
      </div>

      <h1 className="monthly-title">{MONTH_NAMES[month]}</h1>
      <p className="section-sub">Revisit a Daily.</p>

      <div className="monthly-field">
        {network.edges.length > 0 && (
          <svg
            className="monthly-network"
            viewBox={`0 0 ${network.w} ${network.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            fill="none"
          >
            {network.edges.map((e, i) => (
              <line
                key={i}
                x1={e.ax}
                y1={e.ay}
                x2={e.bx}
                y2={e.by}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeLinecap="round"
                opacity="0.28"
              />
            ))}
          </svg>
        )}
        <div className="monthly-grid">
        {days.map((d) => {
          const tappable = d.completed || (!d.isFuture && !!d.puzzle)
          const label = `${MONTH_NAMES[month]} ${d.day}${d.completed ? ', completed' : d.isFuture ? '' : ', not played'}`
          return (
            <button
              key={d.key}
              className={`monthly-cell ${d.completed ? 'is-connected' : 'is-quiet'} ${d.isToday ? 'is-today' : ''} ${
                d.isFuture ? 'is-future' : ''
              }`}
              onClick={() => tappable && onOpenDay(d.key, d.puzzle, d.completed)}
              disabled={!tappable}
              aria-label={label}
            >
              <PuzzleSignature seed={d.puzzle ? d.puzzle.id : d.key} resolved={d.completed} size={38} />
              <span className="monthly-cell-day">{d.day}</span>
            </button>
          )
        })}
        </div>
      </div>

      <p className="monthly-summary">
        {connectionsThisMonth > 0
          ? `${connectionsThisMonth} connections made this month`
          : 'No connections yet this month — play today’s Daily to begin.'}
      </p>

      {saved.length > 0 && (
        <div className="saved-connections">
          <h2 className="home-section-heading">Saved connections</h2>
          <div className="saved-list">
            {saved.map((c) => (
              <div className="saved-item" key={c.key}>
                <div className="saved-item-head">
                  <span className="saved-item-title">{c.title}</span>
                  <button className="saved-unsave" onClick={() => unsave(c)} aria-label={`Unsave ${c.title}`}>
                    ★
                  </button>
                </div>
                {c.items && c.items.length > 0 && (
                  <p className="saved-item-terms">{c.items.map((it) => it.term).join(' · ')}</p>
                )}
                {c.remember && <p className="saved-item-remember">{c.remember}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
