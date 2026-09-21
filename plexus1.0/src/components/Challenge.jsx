import React, { useEffect, useRef, useState } from 'react'
import {
  ROUND_TYPES,
  BASE_POINTS,
  WRONG_PENALTY,
  getMultiplier,
  speedBonus,
  computeActionPoints,
  generateRound,
} from '../utils/challengeEngine.js'
import { getChallengeStats, recordChallengeResult, recordWeakSpots } from '../utils/storage.js'

const DURATION_MS = 5 * 60 * 1000
const TRANSITION_MS = 420

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

  const nextRound = (prevType) => {
    const r = generateRound(bank, { roundTypes: ROUND_TYPES, avoidType: prevType })
    if (!r) {
      finishRef.current()
      return
    }
    setRound(r)
    setSelected([])
    setFeedback(null)
    setResolvedOption(null)
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
    nextRound(null)
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

  const handleToggle = (text) => {
    if (feedback || phase !== 'playing') return
    setSelected((prev) => {
      if (prev.includes(text)) return prev.filter((t) => t !== text)
      if (prev.length >= 4) return prev
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
        nextRound('miniConnections')
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
      nextRound('rapidAssociation')
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
      const tag = round.categoryTitle || round.anchor
      applyIncorrect(tag, round.correctAnswer, round.explanation, round.systems)
    }
    setTimeout(() => {
      setRoundsCompleted((n) => n + 1)
      nextRound(round.type)
    }, TRANSITION_MS)
  }

  // -------------------------------------------------------------------
  // Intro
  // -------------------------------------------------------------------
  if (phase === 'intro') {
    return (
      <div className="challenge challenge-intro">
        <h1 className="challenge-title">5-Minute Challenge</h1>
        <p className="challenge-lede">Five minutes. As many connections as you can find.</p>
        <p className="challenge-mixes">Connections · Impostor · Rapid Association · Complete the Connection</p>
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
        <h2 className="challenge-results-heading">5-Minute Challenge</h2>
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
    </div>
  )
}
