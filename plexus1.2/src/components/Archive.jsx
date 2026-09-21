import React, { useMemo, useState } from 'react'
import { getDailyPuzzleForDate, isFutureDateKey } from '../utils/dailyPuzzle.js'
import { dateKey } from '../utils/game.js'
import { getSavedConnections, toggleSavedConnection } from '../utils/storage.js'
import PuzzleSignature from './PuzzleSignature.jsx'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

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
      <p className="section-sub">Each day is a Plexus signature. Completed Dailies connect; the rest wait quietly.</p>

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
              <PuzzleSignature seed={d.puzzle ? d.puzzle.id : d.key} resolved={d.completed} size={46} />
              <span className="monthly-cell-day">{d.day}</span>
            </button>
          )
        })}
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
