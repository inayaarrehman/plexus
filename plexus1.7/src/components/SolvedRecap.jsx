import React, { useState } from 'react'
import { DIFFICULTY } from '../puzzles.js'
import BrandMark from './BrandMark.jsx'

const levelColor = (level) => DIFFICULTY.find((d) => d.level === level)?.color || 'var(--text)'

// The hidden-delight recap (Sections 16–22): after today's Daily is solved,
// tapping the Plexus logo briefly expands the mark into today's four solved
// Strands — a compact "these were today's four connections" memory, NOT a
// new screen, NOT a Review, and explicitly NOT any generated fifth/meta
// connection between them. Uses the REAL solved categories. Vertical layout
// with a connecting line so it stays readable at 390px; tapping a Strand
// optionally reveals its four concepts. Closes on backdrop tap, the ×, or
// re-tapping the logo (handled by the parent).
export default function SolvedRecap({ categories, onClose }) {
  const [openTitle, setOpenTitle] = useState(null)
  const ordered = (categories || []).slice().sort((a, b) => a.level - b.level)

  return (
    <div className="recap-backdrop" onClick={onClose}>
      <div className="recap-pop" role="dialog" aria-label="Today's connections" onClick={(e) => e.stopPropagation()}>
        <div className="recap-head">
          <BrandMark size={26} animate decorative />
          <span className="recap-head-label">Today&rsquo;s connections</span>
          <button className="recap-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <ol className="recap-strands">
          {ordered.map((cat) => {
            const isOpen = openTitle === cat.title
            const terms = (cat.items || []).map((it) => it.term)
            return (
              <li className="recap-strand" key={cat.title} style={{ '--strand-color': levelColor(cat.level) }}>
                <button
                  className="recap-strand-row"
                  onClick={() => setOpenTitle(isOpen ? null : cat.title)}
                  aria-expanded={isOpen}
                >
                  <span className="recap-strand-node" aria-hidden="true" />
                  <span className="recap-strand-title">{cat.title}</span>
                </button>
                {isOpen && terms.length > 0 && <p className="recap-strand-terms">{terms.join(' · ')}</p>}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
