import React, { useMemo } from 'react'
import { getDailyPuzzleForDate } from '../utils/dailyPuzzle.js'
import { dateKey } from '../utils/game.js'

const WINDOW_DAYS = 30

function formatLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Archive({ dailyHistory, onOpenDay, onBack }) {
  const todayKey = dateKey(new Date())

  const rows = useMemo(() => {
    const list = []
    for (let i = 0; i < WINDOW_DAYS; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = dateKey(d)
      const puzzle = getDailyPuzzleForDate(d)
      const history = dailyHistory[key]
      list.push({
        date: key,
        label: i === 0 ? 'Today' : formatLabel(key),
        puzzle,
        completed: !!history?.completed,
        won: history?.won,
        mistakes: history?.mistakes,
      })
    }
    return list
  }, [dailyHistory])

  return (
    <div className="archive">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <div className="game-header-title">
          <span>Archive</span>
        </div>
        <div />
      </div>

      <p className="section-sub">Past Daily Puzzles. Completed days open in review; missed days are still playable.</p>

      <div className="archive-list">
        {rows.map((row) => {
          if (!row.puzzle) return null
          const isToday = row.date === todayKey
          return (
            <button
              key={row.date}
              className={`archive-row ${row.completed ? 'archive-row-done' : ''}`}
              onClick={() => onOpenDay(row.date, row.puzzle, row.completed)}
            >
              <span className="archive-row-date">
                {row.label}
                {isToday && !row.completed ? ' (play now)' : ''}
              </span>
              {row.completed ? (
                <span className={`archive-row-status ${row.won ? 'won' : 'lost'}`}>
                  {row.won ? '✓ Solved' : '✕ Missed'} · {row.mistakes} mistake{row.mistakes === 1 ? '' : 's'}
                </span>
              ) : (
                <span className="archive-row-status not-played">
                  {isToday ? 'Not played yet' : 'Missed — tap to play'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
