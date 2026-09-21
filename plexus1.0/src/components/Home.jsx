import React from 'react'
import { SYSTEMS } from '../puzzles.js'
import BrandMark from './BrandMark.jsx'

const SYSTEMS_PREVIEW = SYSTEMS.slice(0, 4).join(' · ') + ' · ...'

export default function Home({
  dailyNumber,
  dailyDone,
  currentStreak,
  continueSystem,
  continueSystemSolved,
  continueSystemTotal,
  challengeBest,
  onPlayDaily,
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

  return (
    <div className="home">
      {/* One restrained background device (Section 7): an oversized,
          extremely low-opacity brand mark, mostly off-canvas. Purely
          decorative — never meant to be consciously noticed. */}
      <BrandMark size={320} className="home-bg-mark" decorative />

      <div className="home-topbar">
        <button className="text-link home-topbar-link" onClick={onOpenStats}>
          Stats
        </button>
        <button className="text-link home-topbar-link" onClick={onOpenHowTo}>
          How to play
        </button>
      </div>

      <section className="home-section home-hero-section">
        <div className="home-wordmark-row">
          <BrandMark size={30} decorative />
          <h1 className="home-title">Plexus</h1>
        </div>
        <p className="home-meta">
          Daily <span className="home-daily-number">No. {String(dailyNumber).padStart(3, '0')}</span> &middot; {todayLabel}
        </p>
        <p className="home-tagline">16 concepts. 4 hidden connections.</p>

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
      </section>

      {dailyDone && continueSystem && (
        <section className="home-section">
          <h2 className="home-section-heading home-section-heading-plum">Continue</h2>
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
        <h2 className="home-section-heading home-section-heading-teal">5-Minute Challenge</h2>
        <p className="home-row-sub">A fast mix of medical association rounds.</p>
        {challengeBest > 0 && <p className="home-row-sub">Personal best: {challengeBest.toLocaleString()}</p>}
        <button className="secondary-btn" onClick={onStartChallenge}>
          Start
        </button>
      </section>

      <section className="home-section">
        <h2 className="home-section-heading home-section-heading-cobalt">Explore</h2>
        <p className="home-row-sub">{SYSTEMS_PREVIEW}</p>
        <button className="text-link home-link" onClick={onOpenSystems}>
          Browse systems
          <span className="home-link-arrow" aria-hidden="true">
            &rarr;
          </span>
        </button>
      </section>
    </div>
  )
}
