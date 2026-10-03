import React from 'react'

// The reusable Plexus line primitive (Sections 7 & 15): a thin, understated
// rule with one small branch and node in the middle — editorial linework
// inspired by branching structures, not a neuron / vessel / ECG / circuit /
// subway map. The horizontal rules are plain CSS (so they stay crisp and
// stretch responsively); only the little branch+node in the centre is SVG,
// at a fixed size so the node stays perfectly round at any width. Purely
// decorative and non-interactive, so it's always aria-hidden. Used sparingly
// — only at a few meaningful section transitions, never as every divider.
export default function PlexusLine({ className = '' }) {
  return (
    <div className={`plexus-divider ${className}`} aria-hidden="true">
      <span className="plexus-divider-rule" />
      <svg className="plexus-divider-mark" width="46" height="14" viewBox="0 0 46 14" fill="none">
        <path d="M0 7 H21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        <path d="M21 7 Q28 7 31 3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        <path d="M31 7 H46" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
        <circle cx="33" cy="2.6" r="1.9" fill="currentColor" opacity="0.75" />
        <circle cx="21" cy="7" r="1.6" fill="currentColor" opacity="0.6" />
      </svg>
      <span className="plexus-divider-rule" />
    </div>
  )
}
