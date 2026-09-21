import React, { useMemo, useState } from 'react'
import { SYSTEMS, DIFFICULTY } from '../puzzles.js'
import { categoriesForSystem, systemMasteryCounts, systemMasterySummary, systemTerritories } from '../utils/mastery.js'

// Section 11: each system gets ONE subtle accent from the same shared
// brand palette, cycling through the four colors rather than inventing
// sixteen unique hues — Cardiology and Pharmacology can share a color;
// the point is a small personality touch per system, not a rainbow map.
const ACCENT_COLORS = DIFFICULTY.map((d) => d.color)
function systemAccent(system) {
  const idx = SYSTEMS.indexOf(system)
  return ACCENT_COLORS[idx % ACCENT_COLORS.length] || ACCENT_COLORS[0]
}

// Section 18: a Plexus-native progress indicator — a short chain of
// connected nodes (●—●—●—○—○) that fill as connections are solved —
// instead of a plain bar. It's a five-node summary of the ratio (the
// exact "solved / total" number is always shown alongside it for
// clarity); the whole thing carries the accurate percentage as a real
// progressbar for assistive tech.
const CHAIN = 5
function ProgressBar({ value, max, accent }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  let filled = max > 0 ? Math.round((value / max) * CHAIN) : 0
  if (value > 0 && filled === 0) filled = 1 // any progress lights at least one node
  if (value < max && filled === CHAIN) filled = CHAIN - 1 // full chain only when complete
  if (max > 0 && value >= max) filled = CHAIN
  return (
    <div
      className="node-progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      style={accent ? { '--node-fill': accent } : undefined}
    >
      {Array.from({ length: CHAIN }).map((_, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className={`node-link ${i < filled ? 'is-on' : ''}`} aria-hidden="true" />}
          <span className={`node-dot ${i < filled ? 'is-on' : ''}`} aria-hidden="true" />
        </React.Fragment>
      ))}
    </div>
  )
}

export default function Systems({ bank, mastery, onPlaySystem, onBack, playNotice, onDismissPlayNotice }) {
  const [selected, setSelected] = useState(null)

  const rows = useMemo(
    () =>
      SYSTEMS.map((system) => {
        const { total, solved } = systemMasteryCounts(bank, system, mastery)
        return { system, total, solved }
      }),
    [bank, mastery]
  )

  if (selected) {
    const { total, solved } = systemMasteryCounts(bank, selected, mastery)
    const { strong, needsWork, recent } = systemMasterySummary(bank, selected, mastery)
    const territories = systemTerritories(bank, selected, mastery)
    return (
      <div className="systems">
        <div className="game-header">
          <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Back">
            &larr; Systems
          </button>
          <div className="game-header-title">
            <span>{selected}</span>
          </div>
          <div />
        </div>

        <div className="system-detail">
          <div className="system-detail-accent" style={{ backgroundColor: systemAccent(selected) }} aria-hidden="true" />
          <h1 className="system-detail-title">{selected}</h1>
          <p className="system-detail-count">
            {solved} of {total} connections solved
          </p>
          <ProgressBar value={solved} max={total} accent={systemAccent(selected)} />
          {playNotice && (
            <p className="system-play-notice" role="status">
              {playNotice}{' '}
              <button className="link-btn" onClick={onDismissPlayNotice}>
                Dismiss
              </button>
            </p>
          )}
          <button className="primary-btn system-play-btn" onClick={() => onPlaySystem(selected)}>
            Play
          </button>
        </div>

        {territories.length > 0 && (
          <div className="system-territories">
            <h2 className="home-section-heading">Territories</h2>
            <p className="territories-sub">Kinds of connections in {selected} — filled ones you&rsquo;ve made.</p>
            <div className="territory-chips">
              {territories.map((t) => (
                <span
                  key={t.name}
                  className={`territory-chip ${t.encountered > 0 ? 'is-encountered' : ''}`}
                  style={{ '--row-accent': systemAccent(selected) }}
                >
                  {t.name}
                  <span className="territory-count">
                    {t.encountered}/{t.total}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {(strong.length > 0 || needsWork.length > 0 || recent.length > 0) && (
          <div className="your-system">
            <h2 className="home-section-heading">Your {selected}</h2>
            {strong.length > 0 && (
              <div className="your-system-row">
                <span className="your-system-label strong">Strong</span>
                <span className="your-system-values">{strong.join(', ')}</span>
              </div>
            )}
            {needsWork.length > 0 && (
              <div className="your-system-row">
                <span className="your-system-label needs-work">Needs work</span>
                <span className="your-system-values">{needsWork.join(', ')}</span>
              </div>
            )}
            {recent.length > 0 && (
              <div className="your-system-row">
                <span className="your-system-label recent">Recent</span>
                <span className="your-system-values">{recent.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="systems">
      <div className="game-header">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          &larr; Back
        </button>
        <div className="game-header-title">
          <span>Systems</span>
        </div>
        <div />
      </div>

      <div className="system-compact-list">
        {rows.map(({ system, total, solved }) => {
          const empty = total === 0
          return (
            <button
              key={system}
              className={`system-row ${empty ? 'system-row-empty' : ''}`}
              onClick={() => !empty && setSelected(system)}
              disabled={empty}
              style={{ '--row-accent': systemAccent(system) }}
            >
              <span className="system-row-name">{system}</span>
              {empty ? (
                <span className="system-row-soon">Coming soon</span>
              ) : (
                <>
                  <ProgressBar value={solved} max={total} accent={systemAccent(system)} />
                  <span className="system-row-count">
                    {solved}/{total}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { categoriesForSystem }
