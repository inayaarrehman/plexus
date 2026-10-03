import React, { useMemo, useState } from 'react'
import Modal from './Modal.jsx'

// A restrained Thread view (Sections 5 + 6): a tiny cross-system explainer
// showing how one concept recurs across areas of medicine. Every node is a
// VERIFIED bank category (passed in via the derived thread) — the UI adds
// no medical claims of its own. Members are grouped by their primary
// system and joined by a vertical connecting path; a node is tappable only
// when it has verified explanation text behind it, and expands to show
// that verified explanation + takeaway. No graph visualization.
export default function ThreadModal({ thread, onClose }) {
  const [openId, setOpenId] = useState(null)

  // Group members across the systems the thread actually spans, so the view
  // reads as a cross-system explainer. Systems are filled rarest-first and
  // each verified member is placed once, under the first (rarest) spanned
  // system it touches — so distinct concepts distribute across systems
  // instead of all collapsing under the one they happen to share.
  const groups = useMemo(() => {
    const touchCount = (sys) => thread.members.filter((m) => (m.systems || []).includes(sys)).length
    const order = [...thread.systems].sort((a, b) => touchCount(a) - touchCount(b))
    const placed = new Set()
    const bySystem = new Map(order.map((s) => [s, []]))
    for (const sys of order) {
      for (const m of thread.members) {
        if (placed.has(m.id)) continue
        if ((m.systems || []).includes(sys) || m.system === sys) {
          bySystem.get(sys).push(m)
          placed.add(m.id)
        }
      }
    }
    // Any member not matching a spanned system (shouldn't happen) falls back
    // to its own primary system so nothing is silently dropped.
    for (const m of thread.members) {
      if (placed.has(m.id)) continue
      if (!bySystem.has(m.system)) bySystem.set(m.system, [])
      bySystem.get(m.system).push(m)
      placed.add(m.id)
    }
    return [...bySystem.entries()].filter(([, members]) => members.length > 0).map(([system, members]) => ({ system, members }))
  }, [thread])

  return (
    <Modal title={thread.label.toUpperCase()} onClose={onClose}>
      <p className="thread-systems">{thread.systems.join(' · ')}</p>
      <p className="thread-lede">
        One concept, {thread.members.length} verified connections across {thread.systems.length} systems.
      </p>

      <div className="thread-body">
        {groups.map((group, gi) => (
          <div className="thread-group" key={group.system}>
            <div className="thread-system-label">{group.system}</div>
            {group.members.map((m) => {
              const canOpen = !!m.explanation
              const isOpen = openId === m.id
              return (
                <div className="thread-node-row" key={m.id}>
                  <span className="thread-node-dot" aria-hidden="true" />
                  <div className="thread-node-main">
                    <button
                      className="thread-node-title"
                      onClick={() => canOpen && setOpenId(isOpen ? null : m.id)}
                      aria-expanded={isOpen}
                      disabled={!canOpen}
                    >
                      {m.title}
                      {canOpen && <span className="thread-node-caret">{isOpen ? '−' : '+'}</span>}
                    </button>
                    {isOpen && (
                      <div className="thread-node-detail">
                        <p className="thread-node-explanation">{m.explanation}</p>
                        {m.remember && (
                          <p className="thread-node-remember">
                            <span className="remember-label">Remember this</span>
                            {m.remember}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {gi < groups.length - 1 && <div className="thread-connector" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </Modal>
  )
}
