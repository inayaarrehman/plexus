import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  RACE_LENGTH,
  makeJoinCode,
  normalizeJoinCode,
  isValidJoinCode,
  buildRaceChallenge,
  raceLinkForCode,
  raceSync,
} from '../utils/raceEngine.js'
import { haptics } from '../utils/haptics.js'

// ---------------------------------------------------------------------
// Race Mode — "Race a friend through the same Plexus."
// ---------------------------------------------------------------------
// The challenge set is a deterministic function of the join code, so two
// players who enter the same code get the identical set in the identical
// order. Live opponent sync lives behind raceSync (a stub until a backend is
// added) — so the opponent panel reads "offline" rather than faking progress.
// A player can still run the seeded set for a real, timed, scored attempt.
// ---------------------------------------------------------------------

function fmtTime(ms) {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function Race({ bank, initialCode = '', onExit }) {
  const [phase, setPhase] = useState(initialCode ? 'join' : 'entry') // entry | join | lobby | countdown | playing | results
  const [code, setCode] = useState(initialCode ? normalizeJoinCode(initialCode) : '')
  const [joinInput, setJoinInput] = useState(initialCode ? normalizeJoinCode(initialCode) : '')
  const [isHost, setIsHost] = useState(false)
  const [copied, setCopied] = useState(false)

  // Round run state
  const [rounds, setRounds] = useState([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState([])
  const [verdict, setVerdict] = useState(null) // 'correct' | 'incorrect' | null
  const [shake, setShake] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [misses, setMisses] = useState([])
  const [countdown, setCountdown] = useState(3)
  const startRef = useRef(0)
  const [elapsedMs, setElapsedMs] = useState(0)
  const lockRef = useRef(false)
  const shakeTimer = useRef(null)

  useEffect(() => () => clearTimeout(shakeTimer.current), [])

  const createRace = () => {
    const c = makeJoinCode()
    setCode(c)
    setIsHost(true)
    raceSync.createRace(c) // stub (no-backend) — isolated boundary
    setPhase('lobby')
  }

  const confirmJoin = () => {
    const c = normalizeJoinCode(joinInput)
    if (!isValidJoinCode(c)) return
    setCode(c)
    setIsHost(false)
    raceSync.joinRace(c) // stub (no-backend) — isolated boundary
    setPhase('lobby')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(raceLinkForCode(code))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard blocked — show the code instead (already visible)
    }
  }

  const beginCountdown = () => {
    const built = buildRaceChallenge(bank, { code, length: RACE_LENGTH })
    setRounds(built)
    setIdx(0)
    setSelected([])
    setVerdict(null)
    setCorrectCount(0)
    setMisses([])
    setCountdown(3)
    setPhase('countdown')
  }

  // 3-2-1 countdown, then start.
  useEffect(() => {
    if (phase !== 'countdown') return undefined
    if (countdown <= 0) {
      startRef.current = Date.now()
      setPhase('playing')
      return undefined
    }
    const t = setTimeout(() => setCountdown((n) => n - 1), 700)
    return () => clearTimeout(t)
  }, [phase, countdown])

  const round = rounds[idx] || null

  const triggerWrong = () => {
    haptics.incorrect()
    clearTimeout(shakeTimer.current)
    setShake(false)
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => {
        setShake(true)
        shakeTimer.current = setTimeout(() => setShake(false), 340)
      })
    }
  }

  const advance = () => {
    const next = idx + 1
    if (next >= rounds.length) {
      setElapsedMs(Date.now() - startRef.current)
      setPhase('results')
      return
    }
    setIdx(next)
    setSelected([])
    setVerdict(null)
    lockRef.current = false
  }

  const resolve = (correct, missLabel, missAnswer) => {
    if (lockRef.current) return
    lockRef.current = true
    setVerdict(correct ? 'correct' : 'incorrect')
    if (correct) {
      setCorrectCount((n) => n + 1)
      haptics.correct()
    } else {
      setMisses((m) => [...m, { label: missLabel, answer: missAnswer }])
      triggerWrong()
    }
    setTimeout(advance, 480)
  }

  // Single-answer rounds: one tap answers.
  const answerSingle = (option) => {
    if (lockRef.current || verdict) return
    const label = round.categoryTitle || round.anchor || 'Connection'
    resolve(!!option.correct, label, round.correctAnswer)
  }

  // rapidAssociation: toggle up to 4, then submit.
  const toggle = (text) => {
    if (lockRef.current || verdict) return
    setSelected((prev) => {
      if (prev.includes(text)) return prev.filter((t) => t !== text)
      if (prev.length >= 4) return prev
      haptics.select()
      return [...prev, text]
    })
  }
  const submitRapid = () => {
    if (selected.length !== 4 || lockRef.current) return
    const correctSet = new Set(round.correctAnswers)
    const correct = selected.every((t) => correctSet.has(t))
    resolve(correct, round.anchor, round.correctAnswers.join(', '))
  }

  // ---------- Render ----------

  if (phase === 'entry' || phase === 'join') {
    return (
      <div className="race">
        <div className="game-header">
          <button className="icon-btn" onClick={onExit} aria-label="Back">
            &larr;
          </button>
          <div className="game-header-title"><span>Race</span></div>
          <div />
        </div>
        <h1 className="race-title">Race</h1>
        <p className="race-lede">Race a friend through the same Plexus.</p>

        <div className="race-entry-actions">
          <button className="race-primary-btn" onClick={createRace}>
            Create a race
          </button>
          <div className="race-join-row">
            <input
              className="race-code-input"
              value={joinInput}
              onChange={(e) => setJoinInput(normalizeJoinCode(e.target.value))}
              placeholder="Enter code"
              aria-label="Race join code"
              inputMode="text"
              autoCapitalize="characters"
              maxLength={4}
            />
            <button className="race-secondary-btn" onClick={confirmJoin} disabled={!isValidJoinCode(joinInput)}>
              Join
            </button>
          </div>
        </div>

        <p className="race-note">
          Both players enter the same code to get the identical challenge set. Live head-to-head
          sync is coming — for now you can run the seeded race and compare times.
        </p>
      </div>
    )
  }

  if (phase === 'lobby') {
    return (
      <div className="race">
        <div className="game-header">
          <button className="icon-btn" onClick={onExit} aria-label="Back">
            &larr;
          </button>
          <div className="game-header-title"><span>Race</span></div>
          <div />
        </div>
        <h1 className="race-title">Race lobby</h1>

        <div className="race-code-card">
          <span className="race-code-label">Join code</span>
          <span className="race-code-value">{code}</span>
          <button className="race-copy-btn" onClick={copyLink}>
            {copied ? 'Link copied' : 'Copy invite link'}
          </button>
        </div>

        <div className="race-players">
          <div className="race-player">
            <span className="race-player-name">You</span>
            <span className="race-player-status is-ready">Ready</span>
          </div>
          <div className="race-player">
            <span className="race-player-name">Opponent</span>
            <span className="race-player-status is-offline">Offline</span>
          </div>
        </div>

        <p className="race-note">{raceSync.backendNote} You can start the seeded race now — your
          friend running the same code gets the exact same questions.</p>

        <button className="race-primary-btn" onClick={beginCountdown}>
          Start race
        </button>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="race race-countdown-screen">
        <div className="race-countdown" aria-live="assertive">
          {countdown > 0 ? countdown : 'Go'}
        </div>
      </div>
    )
  }

  if (phase === 'playing' && round) {
    const total = rounds.length
    const isRapid = round.type === 'rapidAssociation'
    return (
      <div className={`race race-playing ${shake ? 'is-shake' : ''} ${verdict === 'incorrect' ? 'is-wrong' : ''}`}>
        <div className="race-live">
          <span className="race-live-you">You {correctCount}/{total}</span>
          <span className="race-live-opp">Opponent —/{total}</span>
        </div>
        <div className="race-progress-track" aria-hidden="true">
          <div className="race-progress-fill" style={{ width: `${(idx / total) * 100}%` }} />
        </div>

        <div className="race-round">
          {isRapid && <p className="race-anchor">{round.anchor}</p>}
          {round.type === 'commonLink' && (
            <>
              <p className="race-prompt">What links these?</p>
              <p className="race-shown">{round.shown.join(' · ')}</p>
            </>
          )}
          {round.type === 'completeConnection' && (
            <>
              <p className="race-prompt">Complete the connection</p>
              <p className="race-shown">{round.shown.join(' · ')}</p>
            </>
          )}
          {round.type === 'impostor' && (
            <>
              <p className="race-prompt">Remove the impostor</p>
              <p className="race-shown">{round.categoryTitle}</p>
            </>
          )}
          {isRapid && <p className="race-prompt">Select four</p>}

          <div className="race-options">
            {round.options.map((opt) => {
              const isSel = selected.includes(opt.text)
              return (
                <button
                  key={opt.text}
                  className={`race-option ${isSel ? 'is-selected' : ''}`}
                  onClick={() => (isRapid ? toggle(opt.text) : answerSingle(opt))}
                  disabled={!!verdict}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>

          {isRapid && (
            <button className="race-submit-btn" onClick={submitRapid} disabled={selected.length !== 4 || !!verdict}>
              Submit ({selected.length}/4)
            </button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const total = rounds.length || RACE_LENGTH
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
    return (
      <div className="race race-results">
        <h1 className="race-title">Race complete</h1>
        <div className="race-result-grid">
          <div className="race-result-stat">
            <span className="race-result-num">{fmtTime(elapsedMs)}</span>
            <span className="race-result-label">Your time</span>
          </div>
          <div className="race-result-stat">
            <span className="race-result-num">{correctCount}/{total}</span>
            <span className="race-result-label">Correct</span>
          </div>
          <div className="race-result-stat">
            <span className="race-result-num">{accuracy}%</span>
            <span className="race-result-label">Accuracy</span>
          </div>
        </div>

        <p className="race-note">
          Opponent was offline — compare your time with a friend running code <strong>{code}</strong>.
        </p>

        {misses.length > 0 && (
          <div className="race-misses">
            <h2 className="home-section-heading">Connections missed</h2>
            {misses.map((m, i) => (
              <div className="race-miss" key={i}>
                <span className="race-miss-label">{m.label}</span>
                {m.answer && <span className="race-miss-answer">{m.answer}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="race-results-actions">
          <button className="race-primary-btn" onClick={beginCountdown}>
            Race again
          </button>
          <button className="race-secondary-btn" onClick={onExit}>
            Done
          </button>
        </div>
      </div>
    )
  }

  // Fallback (e.g. no rounds could be built)
  return (
    <div className="race">
      <h1 className="race-title">Race</h1>
      <p className="race-note">Couldn&rsquo;t build a race right now. Please try again.</p>
      <button className="race-secondary-btn" onClick={onExit}>Back</button>
    </div>
  )
}
