import React, { useState } from 'react'
import { DIFFICULTY } from '../puzzles.js'
import { getThreadForCategory } from '../utils/threads.js'
import { isConnectionSaved, toggleSavedConnection } from '../utils/storage.js'
import ThreadModal from './ThreadModal.jsx'

const levelColor = (level) => DIFFICULTY.find((d) => d.level === level)?.color || '#888'
const levelName = (level) => DIFFICULTY.find((d) => d.level === level)?.name || ''
const levelShape = (level) => DIFFICULTY.find((d) => d.level === level)?.shape || ''

// onKnowledgeSignal(tag, 'knew-it' | 'review-later') — Section 12's "I Knew
// That" feature: a lightweight, entirely optional signal the player can
// leave on any category during review. Never asked automatically, never
// scored — just another input for a future Weak Spots view.
export default function ReviewConnections({ puzzle, onKnowledgeSignal }) {
  const [openIndex, setOpenIndex] = useState(null)
  const [signaled, setSignaled] = useState({})
  const [activeThread, setActiveThread] = useState(null)
  // Reflects saved state per category so the toggle updates instantly;
  // seeded lazily from persistence the first time a category is checked.
  const [savedMap, setSavedMap] = useState({})

  const savedFor = (cat) => (cat.catIndex in savedMap ? savedMap[cat.catIndex] : isConnectionSaved(cat))
  const handleSave = (cat) => {
    const nowSaved = toggleSavedConnection(cat)
    setSavedMap((prev) => ({ ...prev, [cat.catIndex]: nowSaved }))
  }

  const sendSignal = (tag, signal) => {
    if (!onKnowledgeSignal) return
    onKnowledgeSignal(tag, signal)
    setSignaled((prev) => ({ ...prev, [tag]: signal }))
  }

  const ordered = puzzle.categories
    .map((c, i) => ({ ...c, catIndex: i }))
    .sort((a, b) => a.level - b.level)

  return (
    <div className="review-panel">
      {ordered.map((cat) => {
        const isOpen = openIndex === cat.catIndex
        const thread = getThreadForCategory(cat)
        return (
          <div className="accordion-item" key={cat.catIndex}>
            <button
              className="accordion-header"
              style={{ borderLeftColor: levelColor(cat.level) }}
              onClick={() => setOpenIndex(isOpen ? null : cat.catIndex)}
              aria-expanded={isOpen}
            >
              <span className="accordion-level" style={{ color: levelColor(cat.level) }}>
                <span className="difficulty-shape" aria-hidden="true">
                  {levelShape(cat.level)}
                </span>
                {levelName(cat.level)}
              </span>
              <span className="accordion-title">{cat.title}</span>
              <span className="accordion-caret">{isOpen ? 'Hide why' : 'Why?'}</span>
            </button>
            {isOpen && (
              <div className="accordion-body">
                <p className="accordion-explanation">{cat.explanation}</p>
                <ul className="accordion-item-list">
                  {cat.items.map((item) => (
                    <li key={item.term}>
                      <strong>{item.term}</strong>
                      <span>{item.why}</span>
                    </li>
                  ))}
                </ul>
                <p className="remember-line">
                  <span className="remember-label">Remember this</span>
                  {cat.remember}
                </p>
                <button
                  className={`save-connection-btn ${savedFor(cat) ? 'is-saved' : ''}`}
                  onClick={() => handleSave(cat)}
                  aria-pressed={savedFor(cat)}
                >
                  <span className="save-connection-mark" aria-hidden="true">
                    {savedFor(cat) ? '★' : '☆'}
                  </span>
                  {savedFor(cat) ? 'Saved' : 'Save'}
                </button>
                {thread && (
                  <button className="follow-thread-btn" onClick={() => setActiveThread(thread)}>
                    <span className="follow-thread-label">
                      {thread.label} &middot; {thread.systems.slice(0, 3).join(' · ')}
                    </span>
                    <span className="follow-thread-cta">
                      Follow the thread <span aria-hidden="true">&rarr;</span>
                    </span>
                  </button>
                )}
                {onKnowledgeSignal && (
                  <div className="knowledge-signal-row">
                    <span className="knowledge-signal-label">Did you know this one?</span>
                    <button
                      className={`chip-btn ${signaled[cat.title] === 'knew-it' ? 'chip-btn-active' : ''}`}
                      onClick={() => sendSignal(cat.title, 'knew-it')}
                    >
                      Knew it
                    </button>
                    <button
                      className={`chip-btn ${signaled[cat.title] === 'review-later' ? 'chip-btn-active' : ''}`}
                      onClick={() => sendSignal(cat.title, 'review-later')}
                    >
                      Review later
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
      {activeThread && <ThreadModal thread={activeThread} onClose={() => setActiveThread(null)} />}
    </div>
  )
}
