import React, { useMemo, useState, useCallback } from 'react'
import { SYSTEMS, DIFFICULTY } from '../puzzles.js'
import { categoriesForSystem, systemMasteryCounts } from '../utils/mastery.js'
import { getSystemGlyph, resolveGlyph } from '../utils/systemGlyphs.js'
import { haptics } from '../utils/haptics.js'

// Section 5: each system takes ONE accent from the shared four-colour
// Plexus palette, cycled by position (Coral → Teal → Cobalt → Plum, repeat)
// rather than a unique hue per system. Colour is visual rhythm, not medical
// classification, so Cardiology and GI can share coral.
const ACCENT_COLORS = DIFFICULTY.map((d) => d.color)
function systemAccent(system) {
  const idx = SYSTEMS.indexOf(system)
  return ACCENT_COLORS[idx % ACCENT_COLORS.length] || ACCENT_COLORS[0]
}

// The detail-view progress chain — a short node chain (●—●—○—○—○) echoing
// the Plexus mark, kept ONLY on the system detail page. It was deliberately
// removed from the grid nodes (§12): the abstract topology already carries
// progress there, and topology + chain + X/Y read as crowded.
const CHAIN = 5
function ProgressBar({ value, max, accent }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  let filled = max > 0 ? Math.round((value / max) * CHAIN) : 0
  if (value > 0 && filled === 0) filled = 1
  if (value < max && filled === CHAIN) filled = CHAIN - 1
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

// The anatomical Plexus glyph drawn inside each system tile — the star of the
// page (§30). A hand-authored constellation (systemGlyphs.js) suggesting the
// organ/system form from nodes + paths. The FULL network is always faintly
// visible (§20); a deterministic prefix resolves in proportion to real X/Y,
// and a path brightens only once both its endpoints have (§22), so the network
// "comes alive" through the anatomy. Decorative — hidden from assistive tech.
// `tone` picks the ink: 'light' over a coloured tile, 'accent' on seafoam.
function Glyph({ system, fraction, empty, tone = 'light' }) {
  const glyph = useMemo(() => getSystemGlyph(system), [system])
  const state = useMemo(() => resolveGlyph(glyph, fraction, { empty }), [glyph, fraction, empty])
  return (
    <svg
      className={`system-glyph tone-${tone}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <g className="system-glyph-inner">
        {glyph.links.map((link, i) => {
          const [a, b] = link
          const on = state.isLinkOn(link)
          return (
            <line
              key={`l${i}`}
              className={`glyph-link ${on ? 'is-on' : ''}`}
              x1={glyph.nodes[a].x}
              y1={glyph.nodes[a].y}
              x2={glyph.nodes[b].x}
              y2={glyph.nodes[b].y}
            />
          )
        })}
        {glyph.nodes.map((n, i) => {
          const on = state.isNodeOn(i)
          return <circle key={`n${i}`} className={`glyph-node ${on ? 'is-on' : ''}`} cx={n.x} cy={n.y} r={on ? 4.4 : 3.6} />
        })}
      </g>
    </svg>
  )
}

// Render a system name with a clean break opportunity after any "/" so long
// compound labels wrap at the slash ("Biochemistry/ Genetics") rather than
// mid-word (§13/§32). Display-only — the underlying system string is untouched.
function nameWithBreaks(system) {
  const parts = system.split('/')
  return parts.flatMap((part, i) =>
    i < parts.length - 1
      ? [part, '/', <wbr key={`w${i}`} />]
      : [part]
  )
}

// One tactile Plexus node in the grid. The node itself IS the button (§24):
// no inner card, no badges. Press gives a restrained physical response
// (§29) and a light haptic on release (§17); Coming-Soon systems render as
// unformed, muted tiles with no haptic (§35).
function SystemNode({ system, total, solved, accent, onEnter }) {
  const [pressed, setPressed] = useState(false)
  const empty = total === 0
  const fraction = total > 0 ? solved / total : 0
  const complete = !empty && solved >= total

  const release = useCallback(() => setPressed(false), [])
  const label = empty
    ? `${system}. Coming soon.`
    : `${system}. ${solved} of ${total} connections completed.`

  return (
    <button
      type="button"
      className={`system-node ${empty ? 'is-empty' : ''} ${pressed ? 'is-pressed' : ''} ${complete ? 'is-complete' : ''}`}
      style={{ '--node-accent': accent }}
      aria-label={label}
      aria-disabled={empty || undefined}
      onPointerDown={() => !empty && setPressed(true)}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onClick={() => {
        if (empty) return
        haptics.select()
        onEnter(system)
      }}
    >
      <span className="system-node-glyph">
        <Glyph system={system} fraction={fraction} empty={empty} />
      </span>
      <span className="system-node-label">
        <span className="system-node-name">{nameWithBreaks(system)}</span>
        {empty ? (
          <span className="system-node-soon">Coming soon</span>
        ) : (
          <span className="system-node-count">
            {solved}<span className="system-node-slash">/</span>{total}
          </span>
        )}
      </span>
    </button>
  )
}

export default function Systems({ bank, mastery, onPlaySystem, onBack, playNotice, onDismissPlayNotice }) {
  const [selected, setSelected] = useState(null)
  const [entering, setEntering] = useState(false)

  const rows = useMemo(
    () =>
      SYSTEMS.map((system) => {
        const { total, solved } = systemMasteryCounts(bank, system, mastery)
        return { system, total, solved }
      }),
    [bank, mastery]
  )

  // Restrained system-entry transition (§16): the tapped node's accent
  // briefly washes outward, then the system page appears. Kept simple — a
  // CSS animation on mount, no shared-element routing. Reduced-motion users
  // get the page immediately (the wash class is a no-op under the media query).
  const enterSystem = useCallback((system) => {
    setSelected(system)
    setEntering(true)
  }, [])

  if (selected) {
    const { total, solved } = systemMasteryCounts(bank, selected, mastery)
    const accent = systemAccent(selected)
    // §16/§1/§2: a deliberately clean system page — heading, exact progress,
    // the Plexus progress line, and Play. Territories and the raw "Your
    // {system} / Recent" metadata dump were removed; the whitespace is intended
    // and is NOT backfilled with another analytics section (§19).
    return (
      <div
        className={`systems system-detail-view ${entering ? 'is-entering' : ''}`}
        style={{ '--node-accent': accent }}
        onAnimationEnd={() => setEntering(false)}
      >
        <div className="system-enter-wash" aria-hidden="true" />
        <div className="game-header">
          <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Back to systems">
            &larr; Systems
          </button>
          <div className="game-header-title">
            <span>{selected}</span>
          </div>
          <div />
        </div>

        <div className="system-detail">
          <div className="system-detail-sig" aria-hidden="true">
            <Glyph system={selected} fraction={total > 0 ? solved / total : 0} empty={total === 0} tone="accent" />
          </div>
          <h1 className="system-detail-title">{selected}</h1>
          <p className="system-detail-count">
            {solved} of {total} connections solved
          </p>
          <ProgressBar value={solved} max={total} accent={accent} />
          {playNotice && (
            <p className="system-play-notice" role="status">
              {playNotice}{' '}
              <button className="link-btn" onClick={onDismissPlayNotice}>
                Dismiss
              </button>
            </p>
          )}
          <button
            className="system-play-btn"
            style={{ '--node-accent': accent }}
            onClick={() => onPlaySystem(selected)}
          >
            Play <span className="system-play-arrow" aria-hidden="true">&rarr;</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="systems">
      <div className="systems-head">
        <button className="icon-btn systems-back" onClick={onBack} aria-label="Back">
          &larr;
        </button>
        <h1 className="systems-title">Systems</h1>
      </div>

      <div className="system-grid">
        {rows.map(({ system, total, solved }) => (
          <SystemNode
            key={system}
            system={system}
            total={total}
            solved={solved}
            accent={systemAccent(system)}
            onEnter={enterSystem}
          />
        ))}
      </div>
    </div>
  )
}

export { categoriesForSystem }
