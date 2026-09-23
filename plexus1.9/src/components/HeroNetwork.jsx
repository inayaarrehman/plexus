import React, { useMemo } from 'react'
import { DIFFICULTY } from '../puzzles.js'

// The ambient homepage network (Sections 4–5, 14–15). Deliberately confined
// to the hero's lower-right and bleeding off the right edge (the hero clips
// it), so it reads as "part of a larger structure" WITHOUT ever crossing the
// wordmark, Daily line, CTA, topbar or nav — its nodes are clustered in the
// right portion of its own box, leaving the left (which may sit over text)
// empty and transparent. Purely decorative: aria-hidden, pointer-events
// none, behind content. Its complexity is a quiet, deterministic artifact of
// how many Dailies have been completed (more history → a slightly richer
// network, hard-capped) — no label, no score, never reduced by a missed day.
const COLORS = DIFFICULTY.map((d) => d.color)

function hash(str) {
  let h = 2166136261 >>> 0
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// dailiesCompleted → node count, clamped to a sparse 5..11 so a long-term
// user never ends up with a spiderweb.
export function heroNodeCount(dailiesCompleted = 0) {
  return Math.max(5, Math.min(5 + dailiesCompleted, 11))
}

export default function HeroNetwork({ dailiesCompleted = 0, className = '' }) {
  const count = heroNodeCount(dailiesCompleted)
  const { nodes, links } = useMemo(() => {
    const rnd = mulberry32(hash(`plexus-home-${count}`))
    const pts = []
    for (let i = 0; i < count; i++) {
      // Cluster to the RIGHT but keep nodes off the very crop edge (x 50..90)
      // so whole nodes stay visible and only the connecting paths bleed away —
      // the off-canvas placement reads as deliberate, not accidentally cropped
      // (§5). The empty left of the box still sits harmlessly over hero text.
      pts.push({ x: 50 + rnd() * 40, y: 10 + rnd() * 80 })
    }
    // Sparse: connect each node to its nearest neighbour, plus a couple of
    // seeded chords — enough to read as a network, never a web.
    const edges = []
    for (let i = 1; i < pts.length; i++) {
      let best = 0
      let bestD = Infinity
      for (let j = 0; j < i; j++) {
        const d = (pts[i].x - pts[j].x) ** 2 + (pts[i].y - pts[j].y) ** 2
        if (d < bestD) {
          bestD = d
          best = j
        }
      }
      edges.push([i, best])
    }
    return { nodes: pts, links: edges }
  }, [count])

  return (
    <svg className={`hero-network ${className}`} viewBox="0 0 100 100" preserveAspectRatio="xMaxYMid meet" fill="none" aria-hidden="true">
      <g className="hero-network-links">
        {links.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.5" />
        ))}
      </g>
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="2.4" fill={COLORS[i % COLORS.length]} />
      ))}
    </svg>
  )
}
