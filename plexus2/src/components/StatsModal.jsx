import React from 'react'
import Modal from './Modal.jsx'

export default function StatsModal({ stats, onClose }) {
  const winPct = stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0
  const maxDist = Math.max(1, ...stats.mistakeDistribution)

  return (
    <Modal onClose={onClose} title="Your stats">
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-num">{stats.gamesPlayed}</div>
          <div className="stat-label">Played</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{winPct}%</div>
          <div className="stat-label">Win rate</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{stats.currentStreak}</div>
          <div className="stat-label">Streak</div>
        </div>
        <div className="stat-box">
          <div className="stat-num">{stats.maxStreak}</div>
          <div className="stat-label">Best streak</div>
        </div>
      </div>

      <h3 className="stats-subhead">Mistakes per solved puzzle</h3>
      <div className="dist-chart">
        {stats.mistakeDistribution.map((count, i) => (
          <div className="dist-row" key={i}>
            <span className="dist-row-label">{i}</span>
            <div className="dist-bar-track">
              <div
                className="dist-bar-fill"
                style={{ width: `${(count / maxDist) * 100}%` }}
              >
                <span className="dist-bar-count">{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
