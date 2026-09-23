import React, { useMemo, useState } from 'react'
import { SYSTEMS } from '../puzzles.js'
import { getDailyPuzzleForDate } from '../utils/dailyPuzzle.js'
import BrandMark from './BrandMark.jsx'
import HeroNetwork from './HeroNetwork.jsx'
import SolvedRecap from './SolvedRecap.jsx'

const SYSTEMS_PREVIEW = SYSTEMS.slice(0, 4).join(' · ') + ' · …'

export default function Home({
  dailyNumber,
  dailyDone,
  currentStreak,
  continueSystem,
  continueSystemSolved,
  continueSystemTotal,
  challengeBest,
  dailiesCompleted = 0,
  onPlayDaily,
  onOpenBoard,
  onOpenSystems,
  onContinueStudying,
  onStartChallenge,
  onOpenStats,
  onOpenHowTo,
}) {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  // Hidden-delight recap: only once today's Daily is done does the logo
  // become interactive and expose today's four solved connections.
  const [recapOpen, setRecapOpen] = useState(false)
  const todayCategories = useMemo(
    () => (dailyDone ? getDailyPuzzleForDate(new Date())?.categories || [] : []),
    [dailyDone]
  )

  // Connection of the day (§4): a tiny verified takeaway lifted from today's
  // completed Daily — an existing category's title + its `remember` line. No
  // AI text, no invention, no card; deterministic pick by the Daily number so
  // it's stable all day. Only shown once the Daily is done and content exists.
  const connectionOfDay = useMemo(() => {
    if (!dailyDone || todayCategories.length === 0) return null
    const withRemember = todayCategories.filter((c) => c.remember)
    if (withRemember.length === 0) return null
    return withRemember[dailyNumber % withRemember.length]
  }, [dailyDone, todayCategories, dailyNumber])

  return (
    <div className="home">
      <div className="home-topbar">
        <button className="text-link home-topbar-link" onClick={onOpenStats}>
          Stats
        </button>
        <button className="text-link home-topbar-link" onClick={onOpenHowTo}>
          How to play
        </button>
      </div>

      <section className="home-section home-hero-section">
        {/* Ambient network, confined to the lower-right and clipped off the
            edge — never over the wordmark / Daily line / CTA. */}
        <HeroNetwork dailiesCompleted={dailiesCompleted} />

        <div className="home-wordmark-row">
          {dailyDone ? (
            <button
              className="home-logo-btn"
              onClick={() => setRecapOpen((o) => !o)}
              aria-label="Recap today’s connections"
              aria-expanded={recapOpen}
            >
              <BrandMark size={30} decorative />
            </button>
          ) : (
            <BrandMark size={30} decorative />
          )}
          <h1 className="home-title">Plexus</h1>
        </div>
        <p className="home-meta">
          Daily <span className="home-daily-number">No. {String(dailyNumber).padStart(3, '0')}</span> &middot; {todayLabel}
        </p>

        {!dailyDone ? (
          <button className="play-today-btn" onClick={onPlayDaily}>
            Play today&rsquo;s puzzle
            <span className="play-today-btn-arrow" aria-hidden="true">
              &rarr;
            </span>
          </button>
        ) : (
          <p className="home-done-line">
            Today complete
            {currentStreak > 0 ? (
              <>
                {' '}
                &middot; <span className="home-streak-count">{currentStreak} day streak</span>
              </>
            ) : null}
          </p>
        )}

        {/* Open Board is only a resume affordance for an in-progress board;
            removed entirely once today is complete (§1) — revisit via Review. */}
        {onOpenBoard && !dailyDone && (
          <div className="home-openboard">
            <button className="text-link home-openboard-link" onClick={onOpenBoard}>
              Open Board
              <span className="home-link-arrow" aria-hidden="true">
                &rarr;
              </span>
            </button>
            <span className="home-openboard-hint">Solved connections stay in play until you&rsquo;ve found all four.</span>
          </div>
        )}

        {connectionOfDay && (
          <div className="home-cotd">
            <span className="home-cotd-label">Connection of the day</span>
            <p className="home-cotd-title">{connectionOfDay.title}</p>
            <p className="home-cotd-note">{connectionOfDay.remember}</p>
          </div>
        )}
      </section>

      {dailyDone && continueSystem && (
        <section className="home-section">
          <h2 className="home-section-heading">Continue</h2>
          <p className="home-row-title">{continueSystem}</p>
          <p className="home-row-sub">
            {continueSystemSolved} of {continueSystemTotal} connections solved
          </p>
          <button className="secondary-btn" onClick={onContinueStudying}>
            Continue
          </button>
        </section>
      )}

      <section className="home-section">
        <h2 className="home-section-heading">3 Minutes</h2>
        <p className="home-row-sub">A fast mix of medical association rounds.</p>
        {challengeBest > 0 && <p className="home-row-sub">Personal best: {challengeBest.toLocaleString()}</p>}
        <button className="text-link home-link" onClick={onStartChallenge}>
          Start
          <span className="home-link-arrow" aria-hidden="true">
            &rarr;
          </span>
        </button>
      </section>

      <section className="home-section">
        <h2 className="home-section-heading">Explore by system</h2>
        <p className="home-row-sub">{SYSTEMS_PREVIEW}</p>
        <button className="text-link home-link" onClick={onOpenSystems}>
          Browse systems
          <span className="home-link-arrow" aria-hidden="true">
            &rarr;
          </span>
        </button>
      </section>

      {/* Rendered outside the clipped hero so the fixed overlay isn't
          affected by the hero's overflow/stacking context. */}
      {recapOpen && <SolvedRecap categories={todayCategories} onClose={() => setRecapOpen(false)} />}
    </div>
  )
}
