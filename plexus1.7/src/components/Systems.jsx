import React, { useMemo, useState, useCallback } from 'react'
import { SYSTEMS, DIFFICULTY } from '../puzzles.js'
import { categoriesForSystem, systemMasteryCounts } from '../utils/mastery.js'
import { systemTopology, resolveTopology } from '../utils/systemTopology.js'
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

// The abstract Plexus network drawn inside each system node (§7–10). Pure
// SVG, deterministic per system, and now the PRIMARY visual element of the
// node — a fraction of its nodes/paths resolve to reflect real X/Y progress.
// Decorative — hidden from assistive tech. One subtle identity cue (§12): a
// single faint "tail" reaches from the outermost node toward the node's edge,
// so the network reads as a branch of one larger Plexus, not a closed motif.
function Topology({ system, fraction, empty }) {
  const topo = useMemo(() => systemTopology(system), [system])
  const state = useMemo(() => resolveTopology(topo, fraction, { empty }), [topo, fraction, empty])
  // Tail: from the first-resolving node, extend outward (away from centre)
  // toward the viewBox edge. Deterministic, single line, kept very faint.
  const tail = useMemo(() => {
    const src = topo.nodes[topo.order[0]] || topo.nodes[0]
    const dx = src.x - 50
    const dy = src.y - 50
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    // Travel outward until just shy of the viewBox edge, so the tail
    // terminates NEAR an edge without shooting past it (§12).
    const tx = ux > 0 ? (100 - src.x) / ux : ux < 0 ? (0 - src.x) / ux : Infinity
    const ty = uy > 0 ? (100 - src.y) / uy : uy < 0 ? (0 - src.y) / uy : Infinity
    const t = Math.min(tx, ty) * 0.86
    return { x1: src.x, y1: src.y, x2: src.x + ux * t, y2: src.y + uy * t }
  }, [topo])
  return (
    <svg className="system-topology" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="system-topology-inner">
        <line className="topo-tail" x1={tail.x1} y1={tail.y1} x2={tail.x2} y2={tail.y2} />
        {topo.links.map((link, i) => {
          const [a, b] = link
          const on = state.isLinkOn(link)
          return (
            <line
              key={`l${i}`}
              className={`topo-link ${on ? 'is-on' : ''}`}
              x1={topo.nodes[a].x}
              y1={topo.nodes[a].y}
              x2={topo.nodes[b].x}
              y2={topo.nodes[b].y}
            />
          )
        })}
        {topo.nodes.map((n, i) => {
          const on = state.isNodeOn(i)
          return <circle key={`n${i}`} className={`topo-node ${on ? 'is-on' : ''}`} cx={n.x} cy={n.y} r={on ? 6.5 : 5} />
        })}
      </g>
    </svg>
  )
}

// Almost-subconscious silhouette variation (§13): three near-identical
// squircle treatments, chosen deterministically from the name so a system
// always keeps the same one. Differences are tiny corner-radius shifts —
// never blobs, never per-system arbitrary shapes.
function shapeVariant(system) {
  let s = 0
  for (let i = 0; i < system.length; i++) s += system.charCodeAt(i)
  return `var-${['a', 'b', 'c'][s % 3]}`
}

// One tactile Plexus node in the grid. The node itself IS the button (§3):
// no inner card, no badges. Press gives a restrained physical response
// (§14–15) and a light haptic on release (§17); Coming-Soon systems render
// as unformed, muted nodes with no haptic (§18–19).
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
      className={`system-node ${shapeVariant(system)} ${empty ? 'is-empty' : ''} ${pressed ? 'is-pressed' : ''} ${complete ? 'is-complete' : ''}`}
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
      <span className="system-node-topo">
        <Topology system={system} fraction={fraction} empty={empty} />
      </span>
      <span className="system-node-label">
        <span className="system-node-name">{system}</span>
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
          <div className="system-detail-accent" style={{ backgroundColor: accent }} aria-hidden="true" />
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
