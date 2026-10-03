import React, { useMemo } from 'react'
import { DIFFICULTY } from '../data/constants.js'

// Earned full-puzzle celebration (Sections 6–8), styled in the Plexus
// language: the four brand colors (coral / aqua / cobalt / plum) and a
// restrained mix of shapes — mostly small rectangles, with a few round
// "nodes" and short line segments — so it reads clearly as confetti while
// still feeling like Plexus, not a generic party effect. It renders only on
// a full puzzle win (see Game.jsx). Under prefers-reduced-motion it renders
// nothing (the mark + "Connected." carry the moment); it never animates a
// frozen frame.
const COLORS = DIFFICULTY.map((d) => d.color)
const SHAPES = ['rect', 'rect', 'rect', 'node', 'line'] // weighted toward rectangles

function prefersReducedMotion() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  } catch {
    return false
  }
}

export default function Confetti({ count = 60 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
        shape: SHAPES[i % SHAPES.length],
      })),
    [count]
  )

  if (prefersReducedMotion()) return null

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => {
        const style = {
          left: `${p.left}%`,
          backgroundColor: p.color,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
          transform: `rotate(${p.rotate}deg)`,
        }
        if (p.shape === 'node') {
          style.width = p.size
          style.height = p.size
        } else if (p.shape === 'line') {
          style.width = p.size * 2.2
          style.height = 2
        } else {
          style.width = p.size
          style.height = p.size * 0.5
        }
        return <span key={p.id} className={`confetti-piece confetti-${p.shape}`} style={style} />
      })}
    </div>
  )
}
