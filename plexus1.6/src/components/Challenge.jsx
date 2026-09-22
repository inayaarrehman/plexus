import React, { useEffect, useRef, useState } from 'react'
import {
  ROUND_TYPES,
  BASE_POINTS,
  WRONG_PENALTY,
  getMultiplier,
  speedBonus,
  computeActionPoints,
  composeNextRound,
} from '../utils/challengeEngine.js'
import { getChallengeStats, recordChallengeResult, recordWeakSpots } from '../utils/storage.js'

// The timed mode is 3 minutes (formerly 5). Kept as a single constant so
// there are no other "five minute" assumptions hiding in the component.
const DURATION_MS = 3 * 60 * 1000
// Fast between-round transition (Section 15): brief visual confirmation
// then straight to the next round — detailed explanations wait until after
// the session, so the player spends the 3 minutes thinking, not waiting.
const TRANSITION_MS = 380

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function topEntry(counts) {
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}

export default function Challenge({ bank, onExit, onPhaseChange }) {
  const [phase, setPhase] = useState('intro') // 'intro' | 'playing' | 'results'
  const [round, setRound] = useState(null)
  const [selected, setSelected] = useState([])
  const [feedback, setFeedback] = useState(null) // 'correct' | 'incorrect' | null
  const [resolvedOption, setResolvedOption] = useState(null)
  // Per-round UI state for the expanded modes (all reset each round).
  const [assignments, setAssignments] = useState({}) // Split: tile text -> 'a' | 'b'
  const [activeConcept, setActiveConcept] = useState(null) // Match the Link: selected concept
  const [matches, setMatches] = useState({}) // Match the Link: concept -> label
  const [chainOrder, setChainOrder] = useState([]) // Chain: ordered step texts

  const [timeLeftMs, setTimeLeftMs] = useState(DURATION_MS)
  const [score, setScore] = useState(0)
  const [comboStreak, setComboStreak] = useState(0)
  const [highestMultiplier, setHighestMultiplier] = useState(1)
  const [totalActions, setTotalActions] = useState(0)
  const [correctActions, setCorrectActions] = useState(0)
  const [roundsCompleted, setRoundsCompleted] = useState(0)
  const [responseTimes, setResponseTimes] = useState([])
  const [misses, setMisses] = useState({}) // tag -> { count, missText, explanation }
  const [systemsCorrect, setSystemsCorrect] = useState({})
  const [systemsMissed, setSystemsMissed] = useState({})

  const [personalBest, setPersonalBest] = useState(() => getChallengeStats().personalBest)
  const [isNewBest, setIsNewBest] = useState(false)
  const [resultsExtra, setResultsExtra] = useState({ strongestSystem: null, reviewSystem: null })
  const [showReviewMisses, setShowReviewMisses] = useState(false)

  const lockRef = useRef(false)
  const roundStartRef = useRef(null)
  const endAtRef = useRef(null)
  const timerRef = useRef(null)
  const finishRef = useRef(() => {})

  const bumpSystems = (setter, systems) => {
    if (!systems || systems.length === 0) return
    setter((prev) => {
      const next = { ...prev }
      systems.forEach((s) => {
        next[s] = (next[s] || 0) + 1
      })
      return next
    })
  }

  const recordMiss = (tag, missText, explanation) => {
    if (!tag) return
    setMisses((prev) => {
      const existing = prev[tag]
      return {
        ...prev,
        [tag]: {
          count: (existing?.count || 0) + 1,
          missText: missText ?? existing?.missText ?? null,
          explanation: explanation ?? existing?.explanation ?? null,
        },
      }
    })
  }

  // The session composer picks the next validated round that differs most
  // from the last couple shown (format / system / concept), so a 3-minute
  // run feels intentionally varied rather than randomly generated.
  const recentRef = useRef([])
  const nextRound = () => {
    const r = composeNextRound(bank, { roundTypes: ROUND_TYPES, recent: recentRef.current })
    if (!r) {
      finishRef.current()
      return
    }
    recentRef.current = [{ type: r.type, systems: r.systems, conceptTags: r.conceptTags }, ...recentRef.current].slice(0, 3)
    setRound(r)
    setSelected([])
    setFeedback(null)
    setResolvedOption(null)
    setAssignments({})
    setActiveConcept(null)
    setMatches({})
    setChainOrder([])
    roundStartRef.current = Date.now()
    lockRef.current = false
  }

  const startChallenge = () => {
    setScore(0)
    setComboStreak(0)
    setHighestMultiplier(1)
    setTotalActions(0)
    setCorrectActions(0)
    setRoundsCompleted(0)
    setResponseTimes([])
    setMisses({})
    setSystemsCorrect({})
    setSystemsMissed({})
    setIsNewBest(false)
    setShowReviewMisses(false)
    endAtRef.current = Date.now() + DURATION_MS
    setTimeLeftMs(DURATION_MS)
    setPhase('playing')
    nextRound()
  }

  useEffect(() => {
    if (phase !== 'playing') return undefined
    timerRef.current = setInterval(() => {
      const remaining = endAtRef.current - Date.now()
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setTimeLeftMs(0)
        finishRef.current()
        return
      }
      setTimeLeftMs(remaining)
    }, 200)
    return () => clearInterval(timerRef.current)
  }, [phase])

  // Keep `finish` current across renders so the timer's interval callback
  // (set up once per `phase`) always sees the latest score/stats.
  useEffect(() => {
    finishRef.current = () => {
      setPhase('results')
      const missEntries = Object.keys(misses)
      if (missEntries.length > 0) {
        recordWeakSpots(missEntries.map((tag) => ({ tag, solved: false })))
      }
      const accuracy = totalActions > 0 ? Math.round((correctActions / totalActions) * 100) : 0
      const avgResponseMs = responseTimes.length
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0
      const summary = {
        score,
        roundsAttempted: roundsCompleted,
        roundsCorrect: correctActions,
        accuracy,
        avgResponseMs,
        conceptTagsMissed: missEntries,
        organSystemsMissed: Object.keys(systemsMissed),
        highestMultiplier,
        completedAt: new Date().toISOString(),
      }
      const { stats, isNewBest: newBest } = recordChallengeResult(summary)
      setPersonalBest(stats.personalBest)
      setIsNewBest(newBest)
      setResultsExtra({
        strongestSystem: topEntry(systemsCorrect),
        reviewSystem: topEntry(systemsMissed),
      })
    }
  })

  useEffect(() => () => clearInterval(timerRef.current), [])

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  const applyCorrect = (basePoints, responseMs, systems) => {
    const multiplier = getMultiplier(comboStreak)
    const points = computeActionPoints({ correct: true, basePoints, multiplier, responseMs })
    setScore((s) => Math.max(0, s + points))
    setCorrectActions((n) => n + 1)
    setComboStreak((n) => n + 1)
    setHighestMultiplier((m) => Math.max(m, multiplier))
    bumpSystems(setSystemsCorrect, systems)
    return points
  }

  const applyIncorrect = (tag, missText, explanation, systems) => {
    setScore((s) => Math.max(0, s + WRONG_PENALTY))
    setComboStreak(0)
    recordMiss(tag, missText, explanation)
    bumpSystems(setSystemsMissed, systems)
  }

  const handleToggle = (text, max = 4) => {
    if (feedback || phase !== 'playing') return
    setSelected((prev) => {
      if (prev.includes(text)) return prev.filter((t) => t !== text)
      if (prev.length >= max) return prev
      return [...prev, text]
    })
  }

  const finishAction = (correct) => {
    setTotalActions((n) => n + 1)
    const responseMs = Date.now() - (roundStartRef.current || Date.now())
    setResponseTimes((arr) => [...arr, responseMs])
    setFeedback(correct ? 'correct' : 'incorrect')
    return responseMs
  }

  const handleMiniSubmit = () => {
    if (selected.length !== 4 || lockRef.current) return
    const groupA = round.tiles.filter((t) => t.groupId === 'a').map((t) => t.text)
    const groupB = round.tiles.filter((t) => t.groupId === 'b').map((t) => t.text)
    const isGroupA = selected.every((s) => groupA.includes(s))
    const isGroupB = selected.every((s) => groupB.includes(s))

    if (isGroupA || isGroupB) {
      lockRef.current = true
      const responseMs = finishAction(true)
      const multiplier = getMultiplier(comboStreak)
      const bonus = speedBonus(responseMs)
      const pointsFirstGroup = Math.round((BASE_POINTS.miniConnections + bonus) * multiplier)
      const pointsSecondGroup = Math.round(BASE_POINTS.miniConnections * multiplier)
      setScore((s) => Math.max(0, s + pointsFirstGroup + pointsSecondGroup))
      setCorrectActions((n) => n + 1)
      setComboStreak((n) => n + 1)
      setHighestMultiplier((m) => Math.max(m, multiplier))
      bumpSystems(setSystemsCorrect, round.systems)
      setSelected([])
      setTimeout(() => {
        setRoundsCompleted((n) => n + 1)
        nextRound()
      }, TRANSITION_MS + 100)
      return
    }

    // Wrong guess: penalize, tag any involved concepts, but keep the round
    // going — the player should not lose the board over one bad guess.
    lockRef.current = true
    finishAction(false)
    setScore((s) => Math.max(0, s + WRONG_PENALTY))
    setComboStreak(0)
    const involvedGroupIds = new Set(
      selected.map((s) => round.tiles.find((t) => t.text === s)?.groupId).filter(Boolean)
    )
    involvedGroupIds.forEach((gid) => {
      const g = round.groups[gid]
      recordMiss(g.tag, null, g.explanation)
    })
    bumpSystems(setSystemsMissed, round.systems)
    setTimeout(() => {
      setFeedback(null)
      setSelected([])
      lockRef.current = false
    }, TRANSITION_MS)
  }

  const handleRapidSubmit = () => {
    if (selected.length !== 4 || lockRef.current) return
    lockRef.current = true
    const correctSet = new Set(round.correctAnswers)
    const correct = selected.every((s) => correctSet.has(s))
    const responseMs = finishAction(correct)
    if (correct) {
      applyCorrect(BASE_POINTS.rapidAssociation, responseMs, round.systems)
    } else {
      applyIncorrect(round.anchor, round.correctAnswers.join(', '), round.explanation, round.systems)
    }
    setTimeout(() => {
      setRoundsCompleted((n) => n + 1)
      nextRound()
    }, TRANSITION_MS)
  }

  const handleMultiSubmit = () => {
    if (round?.type === 'miniConnections') handleMiniSubmit()
    else if (round?.type === 'rapidAssociation') handleRapidSubmit()
  }

  const handleChoiceClick = (option) => {
    if (lockRef.current || feedback || phase !== 'playing') return
    lockRef.current = true
    const responseMs = finishAction(!!option.correct)
    setResolvedOption(option.text)
    const basePoints = BASE_POINTS[round.type]
    if (option.correct) {
      applyCorrect(basePoints, responseMs, round.systems)
    } else {
      const tag = round.categoryTitle || round.anchor || round.labelA || round.anchorLabel
      applyIncorrect(tag, round.correctAnswer, round.explanation, round.systems)
    }
    setTimeout(() => {
      setRoundsCompleted((n) => n + 1)
      nextRound()
    }, TRANSITION_MS)
  }

  // Shared resolver for the expanded modes: one correct/incorrect verdict,
  // brief confirmation, then straight to the next round (no explanations
  // mid-round — those wait for results, keeping the 3 minutes fast).
  const resolveRound = (correct, { missTag, missText, explanation } = {}) => {
    if (lockRef.current) return
    lockRef.current = true
    const responseMs = finishAction(correct)
    if (correct) applyCorrect(BASE_POINTS[round.type], responseMs, round.systems)
    else applyIncorrect(missTag, missText, explanation, round.systems)
    setTimeout(() => {
      setRoundsCompleted((n) => n + 1)
      nextRound()
    }, TRANSITION_MS)
  }

  // Link Two: pick exactly the two that share the named relationship.
  const handleLinkTwoSubmit = () => {
    if (selected.length !== 2 || lockRef.current) return
    const correctSet = new Set(round.correctAnswers)
    const correct = selected.every((s) => correctSet.has(s))
    resolveRound(correct, { missTag: round.anchorLabel, missText: round.correctAnswers.join(', '), explanation: round.explanation })
  }

  // Same or Different: one tap answers.
  const handleSameOrDifferent = (answer) => {
    if (lockRef.current || feedback) return
    setResolvedOption(answer)
    resolveRound(answer === round.answer, { missTag: round.conceptTags?.[0], missText: round.answer, explanation: round.explanation })
  }

  // Split: assign each tile to a bucket, then submit.
  const assignTile = (text, group) => {
    if (feedback) return
    setAssignments((prev) => ({ ...prev, [text]: prev[text] === group ? undefined : group }))
  }
  const handleSplitSubmit = () => {
    if (lockRef.current) return
    const allAssigned = round.tiles.every((t) => assignments[t.text] === 'a' || assignments[t.text] === 'b')
    if (!allAssigned) return
    const correct = round.tiles.every((t) => assignments[t.text] === t.group)
    resolveRound(correct, { missTag: round.labelA, missText: `${round.labelA} / ${round.labelB}`, explanation: round.explanation })
  }

  // Match the Link: tap a concept, then tap its link.
  const assignMatch = (label) => {
    if (feedback || !activeConcept) return
    setMatches((prev) => ({ ...prev, [activeConcept]: label }))
    setActiveConcept(null)
  }
  const handleMatchSubmit = () => {
    if (lockRef.current) return
    if (round.concepts.some((c) => !matches[c])) return
    const correct = round.concepts.every((c) => matches[c] === round.answer[c])
    resolveRound(correct, { missTag: round.conceptTags?.[0], missText: 'the correct links', explanation: round.explanation })
  }

  // Chain: tap steps into order (tap a placed step to pull it back).
  const placeChainStep = (text) => {
    if (feedback) return
    setChainOrder((prev) => (prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]))
  }
  const handleChainSubmit = () => {
    if (lockRef.current || chainOrder.length !== round.order.length) return
    const correct = round.order.every((step, i) => chainOrder[i] === step)
    resolveRound(correct, { missTag: round.title, missText: round.order.join(' → '), explanation: round.explanation })
  }

  // -------------------------------------------------------------------
  // Intro
  // -------------------------------------------------------------------
  if (phase === 'intro') {
    return (
      <div className="challenge challenge-intro">
        <h1 className="challenge-title">3-Minute Challenge</h1>
        <p className="challenge-lede">Three minutes. How many connections can you find?</p>
        <p className="challenge-mixes">Group · classify · sequence · link · overlap</p>
        {personalBest > 0 && <p className="challenge-best">Personal best: {personalBest.toLocaleString()}</p>}
        <button className="primary-btn challenge-start-btn" onClick={startChallenge}>
          Start
        </button>
        <button className="text-link" onClick={onExit}>
          Back
        </button>
      </div>
    )
  }

  // -------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------
  if (phase === 'results') {
    const accuracy = totalActions > 0 ? Math.round((correctActions / totalActions) * 100) : 0
    const missEntries = Object.entries(misses)
    return (
      <div className="challenge challenge-results">
        <h2 className="challenge-results-heading">3 Minutes</h2>
        <div className="challenge-final-score">{score.toLocaleString()}</div>
        {isNewBest ? (
          <div className="challenge-new-best">New personal best</div>
        ) : (
          <p className="challenge-best">Personal best: {personalBest.toLocaleString()}</p>
        )}
        <p className="challenge-results-line">
          {roundsCompleted} round{roundsCompleted === 1 ? '' : 's'} &middot; {accuracy}% accuracy
        </p>
        {resultsExtra.strongestSystem && (
          <p className="challenge-results-line">
            <span className="challenge-results-label">Strongest</span> {resultsExtra.strongestSystem}
          </p>
        )}
        {resultsExtra.reviewSystem && (
          <p className="challenge-results-line">
            <span className="challenge-results-label">Review</span> {resultsExtra.reviewSystem}
          </p>
        )}

        <div className="challenge-results-actions">
          <button className="primary-btn" onClick={startChallenge}>
            Play again
          </button>
          {missEntries.length > 0 && (
            <button className="secondary-btn" onClick={() => setShowReviewMisses((v) => !v)}>
              {showReviewMisses ? 'Hide misses' : 'Review misses'}
            </button>
          )}
        </div>

        {showReviewMisses && (
          <div className="challenge-review-misses">
            {missEntries.map(([tag, info]) => (
              <div className="challenge-miss-item" key={tag}>
                <div className="challenge-miss-tag">{tag.toUpperCase()}</div>
                {info.missText && (
                  <div className="challenge-miss-text">
                    You missed: <strong>{info.missText}</strong>
                  </div>
                )}
                {info.explanation && <p className="challenge-miss-explanation">{info.explanation}</p>}
                <p className="challenge-miss-note">Saved to Weak Spots.</p>
              </div>
            ))}
          </div>
        )}

        <button className="text-link" onClick={onExit}>
          Done
        </button>
      </div>
    )
  }

  // -------------------------------------------------------------------
  // Playing
  // -------------------------------------------------------------------
  if (!round) return null

  const isUrgent = timeLeftMs <= 60000
  const multiplierDisplay = comboStreak >= 2 ? getMultiplier(comboStreak).toFixed(1) : null

  return (
    <div className="challenge challenge-playing">
      <div className="challenge-header">
        <span className={`challenge-timer ${isUrgent ? 'urgent' : ''}`}>{formatTime(timeLeftMs)}</span>
        <span className="challenge-live-score">
          {score.toLocaleString()}
          {multiplierDisplay && <span className="challenge-multiplier">×{multiplierDisplay}</span>}
        </span>
      </div>

      {(round.type === 'miniConnections' || round.type === 'rapidAssociation') && (
        <>
          {round.type === 'rapidAssociation' && <p className="challenge-anchor">{round.anchor}</p>}
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="tile-grid challenge-tile-grid">
            {(round.type === 'miniConnections' ? round.tiles : round.options).map((t) => {
              const text = t.text
              const isSelected = selected.includes(text)
              return (
                <button
                  key={text}
                  className={`tile ${isSelected ? 'tile-selected' : ''} ${feedback === 'incorrect' && isSelected ? 'tile-shake' : ''}`}
                  onClick={() => handleToggle(text)}
                  disabled={!!feedback}
                >
                  {text}
                </button>
              )
            })}
          </div>
          {selected.length === 4 && !feedback && (
            <button className="primary-btn challenge-submit-btn" onClick={handleMultiSubmit}>
              Submit
            </button>
          )}
        </>
      )}

      {round.type === 'impostor' && (
        <>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-choice-list">
            {round.options.map((o) => (
              <button
                key={o.text}
                className={`challenge-choice ${
                  feedback && o.text === resolvedOption ? (o.correct ? 'is-correct' : 'is-incorrect') : ''
                }`}
                onClick={() => handleChoiceClick(o)}
                disabled={!!feedback}
              >
                {o.text}
              </button>
            ))}
          </div>
        </>
      )}

      {(round.type === 'completeConnection' || round.type === 'commonLink') && (
        <>
          <div className="challenge-shown">
            {round.shown.map((t, i) => (
              <div className="challenge-shown-item" key={i}>
                {t}
              </div>
            ))}
          </div>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-choice-list">
            {round.options.map((o) => (
              <button
                key={o.text}
                className={`challenge-choice ${
                  feedback && o.text === resolvedOption ? (o.correct ? 'is-correct' : 'is-incorrect') : ''
                }`}
                onClick={() => handleChoiceClick(o)}
                disabled={!!feedback}
              >
                {o.text}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Which belongs to both? (Double Agent) */}
      {round.type === 'doubleAgent' && (
        <>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-two-labels">
            <span>{round.labelA}</span>
            <span className="challenge-two-amp">&amp;</span>
            <span>{round.labelB}</span>
          </div>
          <div className="challenge-choice-list">
            {round.options.map((o) => (
              <button
                key={o.text}
                className={`challenge-choice ${
                  feedback && o.text === resolvedOption ? (o.both ? 'is-correct' : 'is-incorrect') : ''
                }`}
                onClick={() => handleChoiceClick({ ...o, correct: o.both })}
                disabled={!!feedback}
              >
                {o.text}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Complete the chain */}
      {round.type === 'completeTheChain' && (
        <>
          <p className="challenge-anchor">{round.title}</p>
          <div className="challenge-chain-seq">
            {round.sequence.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="challenge-chain-arrow" aria-hidden="true">→</span>}
                <span className={`challenge-chain-cell ${s === null ? 'is-blank' : ''}`}>{s === null ? '?' : s}</span>
              </React.Fragment>
            ))}
          </div>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-choice-list">
            {round.options.map((o) => (
              <button
                key={o.text}
                className={`challenge-choice ${
                  feedback && o.text === resolvedOption ? (o.correct ? 'is-correct' : 'is-incorrect') : ''
                }`}
                onClick={() => handleChoiceClick(o)}
                disabled={!!feedback}
              >
                {o.text}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Link two */}
      {round.type === 'linkTwo' && (
        <>
          <p className="challenge-anchor">{round.prompt}</p>
          <p className="challenge-prompt">Pick two.</p>
          <div className="tile-grid challenge-tile-grid">
            {round.options.map((o) => {
              const isSel = selected.includes(o.text)
              return (
                <button
                  key={o.text}
                  className={`tile ${isSel ? 'tile-selected' : ''} ${feedback === 'incorrect' && isSel ? 'tile-shake' : ''}`}
                  onClick={() => handleToggle(o.text, 2)}
                  disabled={!!feedback}
                >
                  {o.text}
                </button>
              )
            })}
          </div>
          {selected.length === 2 && !feedback && (
            <button className="primary-btn challenge-submit-btn" onClick={handleLinkTwoSubmit}>
              Submit
            </button>
          )}
        </>
      )}

      {/* Same or different */}
      {round.type === 'sameOrDifferent' && (
        <>
          <div className="challenge-sod-pair">
            <span className="challenge-sod-concept">{round.pair[0]}</span>
            <span className="challenge-sod-concept">{round.pair[1]}</span>
          </div>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-sod-actions">
            <button
              className={`secondary-btn ${feedback && resolvedOption === 'same' ? (round.answer === 'same' ? 'is-correct' : 'is-incorrect') : ''}`}
              onClick={() => handleSameOrDifferent('same')}
              disabled={!!feedback}
            >
              Same
            </button>
            <button
              className={`secondary-btn ${feedback && resolvedOption === 'different' ? (round.answer === 'different' ? 'is-correct' : 'is-incorrect') : ''}`}
              onClick={() => handleSameOrDifferent('different')}
              disabled={!!feedback}
            >
              Different
            </button>
          </div>
        </>
      )}

      {/* Split */}
      {round.type === 'split' && (
        <>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-split-labels">
            <span className="challenge-split-label split-a">A · {round.labelA}</span>
            <span className="challenge-split-label split-b">B · {round.labelB}</span>
          </div>
          <div className="tile-grid challenge-tile-grid">
            {round.tiles.map((t) => {
              const g = assignments[t.text]
              return (
                <button
                  key={t.text}
                  className={`tile challenge-split-tile ${g ? 'assigned-' + g : ''} ${
                    feedback ? (g === t.group ? 'is-correct' : 'is-incorrect') : ''
                  }`}
                  onClick={() => cycleTile(t.text)}
                  disabled={!!feedback}
                >
                  {t.text}
                  {g && <span className={`challenge-split-badge ${g}`}>{g === 'a' ? 'A' : 'B'}</span>}
                </button>
              )
            })}
          </div>
          {round.tiles.every((t) => assignments[t.text]) && !feedback && (
            <button className="primary-btn challenge-submit-btn" onClick={handleSplitSubmit}>
              Submit
            </button>
          )}
        </>
      )}

      {/* Match the link */}
      {round.type === 'matchTheLink' && (
        <>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-match-concepts">
            {round.concepts.map((c) => (
              <button
                key={c}
                className={`challenge-match-concept ${activeConcept === c ? 'active' : ''} ${matches[c] ? 'assigned' : ''}`}
                onClick={() => !feedback && setActiveConcept(c)}
                disabled={!!feedback}
              >
                <span className="challenge-match-concept-text">{c}</span>
                {matches[c] && <span className="challenge-match-assigned">{matches[c]}</span>}
              </button>
            ))}
          </div>
          <div className="challenge-match-labels">
            {round.labels.map((l) => (
              <button
                key={l}
                className="challenge-match-label"
                onClick={() => assignMatch(l)}
                disabled={!!feedback || !activeConcept}
              >
                {l}
              </button>
            ))}
          </div>
          {round.concepts.every((c) => matches[c]) && !feedback && (
            <button className="primary-btn challenge-submit-btn" onClick={handleMatchSubmit}>
              Submit
            </button>
          )}
        </>
      )}

      {/* Chain */}
      {round.type === 'chain' && (
        <>
          <p className="challenge-anchor">{round.title}</p>
          <p className="challenge-prompt">{round.prompt}</p>
          <div className="challenge-chain-steps">
            {round.steps.map((s) => {
              const pos = chainOrder.indexOf(s)
              return (
                <button
                  key={s}
                  className={`challenge-chain-step-btn ${pos >= 0 ? 'placed' : ''}`}
                  onClick={() => placeChainStep(s)}
                  disabled={!!feedback}
                >
                  {pos >= 0 && <span className="challenge-chain-num">{pos + 1}</span>}
                  {s}
                </button>
              )
            })}
          </div>
          {chainOrder.length === round.order.length && !feedback && (
            <button className="primary-btn challenge-submit-btn" onClick={handleChainSubmit}>
              Submit
            </button>
          )}
        </>
      )}
    </div>
  )
}
