import React, { useMemo } from 'react'
import { DIFFICULTY } from '../puzzles.js'
import { puzzleSignature } from '../utils/puzzleSignature.js'

const NODE_COLORS = DIFFICULTY.map((d) => d.color)

// The Daily's deterministic "Puzzle Signature" (Section 4). Same nodes in
// both states: `resolved={false}` shows loose, unconnected nodes; when
// resolved, the connecting paths appear — the unconnected→connected story
// in miniature. Decorative only (geometry is seeded from the id, never the
// content), and always aria-hidden — it carries no information a screen
// reader needs. Draws the paths with a short "draw" when `animate`.
export default function PuzzleSignature({ seed, resolved = false, size = 40, animate = false, nodeCount, className = '' }) {
  const { nodes, links } = useMemo(
    () => puzzleSignature(seed, nodeCount ? { nodeCount } : undefined),
    [seed, nodeCount]
  )
  return (
    <svg
      className={`puzzle-signature ${resolved ? 'is-resolved' : 'is-unresolved'} ${animate ? 'is-animate' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      {resolved && (
        <g className="sig-links">
          {links.map(([a, b], i) => (
            <line
              key={i}
              className="sig-link"
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.4"
            />
          ))}
        </g>
      )}
      <g className="sig-nodes">
        {nodes.map((n, i) => (
          <circle
            key={i}
            cx={n.x}
            cy={n.y}
            r={resolved ? 4.2 : 3.2}
            fill={NODE_COLORS[i % NODE_COLORS.length]}
            opacity={resolved ? 1 : 0.7}
          />
        ))}
      </g>
    </svg>
  )
}
