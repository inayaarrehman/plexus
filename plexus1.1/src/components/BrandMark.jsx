import React from 'react'

// The Plexus mark: four colored nodes joined by connecting paths around a
// central hub — a small "network" (a plexus is an interconnected network).
// It reads as "separate concepts, hidden relationships, one connection"
// without borrowing a brain, neuron, stethoscope, ECG line, DNA, cross, or
// any hospital imagery, and without looking like a generic 3-node "share"
// icon: the four outer nodes sit in a deliberately asymmetric quad, each in
// one of the four brand colors, wired both around the ring and in to the
// centre. Deliberately simple so it still resolves at favicon size.
//
// Two states, one component:
//   • static (default) — the resolved network, used beside the wordmark,
//     as the faint homepage background device, and anywhere app identity
//     is needed.
//   • assembling (`animate`) — the nodes arrive and the paths draw
//     themselves between them, the signature Plexus "the connections
//     complete" moment shown on puzzle completion. ~850ms, elegant, and
//     fully disabled under prefers-reduced-motion by the global rule in
//     styles.css.
const NODES = [
  { cx: 12, cy: 14, r: 4.6, cls: 'plexus-node-1', fill: 'var(--difficulty-easy, #bb4c34)' },
  { cx: 36, cy: 10, r: 4.6, cls: 'plexus-node-2', fill: 'var(--difficulty-medium, #0f7a76)' },
  { cx: 39, cy: 34, r: 4.6, cls: 'plexus-node-3', fill: 'var(--difficulty-hard, #3568c4)' },
  { cx: 16, cy: 38, r: 4.6, cls: 'plexus-node-4', fill: 'var(--difficulty-expert, #8c4fc2)' },
]
const HUB = { cx: 26, cy: 24, r: 3 }
// Outer ring, then the four spokes into the hub.
const PATHS = [
  [12, 14, 36, 10],
  [36, 10, 39, 34],
  [39, 34, 16, 38],
  [16, 38, 12, 14],
  [12, 14, 26, 24],
  [36, 10, 26, 24],
  [39, 34, 26, 24],
  [16, 38, 26, 24],
]

export default function BrandMark({ size = 40, className = '', animate = false, decorative = false }) {
  return (
    <svg
      className={`brand-mark ${animate ? 'brand-mark-assemble' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Plexus'}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <g className="plexus-paths">
        {PATHS.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            className="plexus-path"
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </g>
      {NODES.map((n) => (
        <g key={n.cls} className={`plexus-node ${n.cls}`}>
          <circle cx={n.cx} cy={n.cy} r={n.r} fill={n.fill} />
        </g>
      ))}
      <circle className="plexus-hub" cx={HUB.cx} cy={HUB.cy} r={HUB.r} fill="currentColor" />
    </svg>
  )
}
