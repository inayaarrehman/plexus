import React from 'react'

// Understated text navigation — no icons, no cards. Rendered above Home,
// Systems and Archive/Review; deliberately NOT rendered around an active
// Daily Puzzle or a running 3-Minute Challenge, which stay full-screen and
// distraction-free (the same treatment Game.jsx already used before this
// nav existed).
const ITEMS = [
  { key: 'home', label: 'Today' },
  { key: 'systems', label: 'Systems' },
  { key: 'challenge', label: '3-Minute' },
  { key: 'archive', label: 'Review' },
]

export default function AppNav({ active, onNavigate }) {
  return (
    <nav className="app-nav" aria-label="Primary">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          className={`app-nav-item ${active === item.key ? 'active' : ''}`}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
