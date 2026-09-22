import React, { useState, useMemo } from 'react'
import allPuzzles, { DIFFICULTY, validatePuzzle } from '../puzzles.js'
import connectionBank, { validateBankCategory, DIFFICULTY_TIERS, BANK_STATUS, CONNECTION_TYPES } from '../data/connectionBank.js'
import { SYSTEMS } from '../data/constants.js'
import PuzzleSignature from './PuzzleSignature.jsx'
import { puzzleVerdict, analyzeOverlap } from '../utils/puzzleQuality.js'
import { categoryArchetype, archetypeDistribution } from '../utils/archetypes.js'
import { curateDailyCandidates } from '../utils/dailyCuration.js'
import { getPlexusCandidates } from '../utils/threads.js'
import { shuffleWith, makeRng } from '../utils/puzzleAssembler.js'

const levelColor = (level) => DIFFICULTY.find((d) => d.level === level)?.color || '#888'

function PuzzleDetail({ puzzle }) {
  const errors = validatePuzzle(puzzle)
  return (
    <div className="dev-detail">
      <div className="dev-detail-meta">
        <span className={`dev-status dev-status-${puzzle.status}`}>{puzzle.status}</span>
        <span>
          <strong>ID:</strong> {puzzle.id}
        </span>
        <span>
          <strong>#</strong>
          {puzzle.number}
        </span>
        <span>
          <strong>Type:</strong> {puzzle.type}
          {puzzle.date ? ` (${puzzle.date})` : ''}
        </span>
        <span>
          <strong>Systems:</strong> {(puzzle.systems || []).join(', ') || '—'}
        </span>
        <span>
          <strong>Tags:</strong> {(puzzle.topicTags || []).join(', ') || '—'}
        </span>
        <span>
          <strong>Source:</strong> {puzzle.source || '—'}
        </span>
      </div>

      {errors.length > 0 && (
        <div className="dev-errors">
          <strong>Validation errors:</strong>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="dev-categories">
        {(puzzle.categories || [])
          .slice()
          .sort((a, b) => a.level - b.level)
          .map((cat, i) => (
            <div className="dev-category" key={i} style={{ borderLeftColor: levelColor(cat.level) }}>
              <div className="dev-category-title" style={{ color: levelColor(cat.level) }}>
                {DIFFICULTY.find((d) => d.level === cat.level)?.name} — {cat.title}
              </div>
              {(cat.connectionType || cat.bankCategoryId) && (
                <p className="dev-category-sub">
                  {cat.connectionType ? `type: ${cat.connectionType}` : ''}
                  {cat.connectionType && cat.bankCategoryId ? ' · ' : ''}
                  {cat.bankCategoryId ? `from bank: ${cat.bankCategoryId}` : ''}
                </p>
              )}
              <p className="accordion-explanation">{cat.explanation}</p>
              <ul className="accordion-item-list">
                {(cat.items || []).map((it, j) => (
                  <li key={j}>
                    <strong>{it.term}</strong>
                    <span>{it.why}</span>
                  </li>
                ))}
              </ul>
              <p className="remember-line">
                <span className="remember-label">Remember this</span>
                {cat.remember}
              </p>
            </div>
          ))}
      </div>
    </div>
  )
}

function BankCategoryDetail({ category }) {
  const errors = validateBankCategory(category)
  return (
    <div className="dev-detail">
      <div className="dev-detail-meta">
        <span className={`dev-status dev-status-${category.status}`}>{category.status}</span>
        <span className="bank-difficulty-badge">{category.difficulty}</span>
        <span>
          <strong>ID:</strong> {category.id}
        </span>
        <span>
          <strong>Type:</strong> {category.connectionType}
        </span>
        <span>
          <strong>Primary system:</strong> {category.primarySystem || '—'}
        </span>
        <span>
          <strong>Secondary systems:</strong> {(category.secondarySystems || []).join(', ') || '—'}
        </span>
        <span>
          <strong>All systems:</strong> {(category.systems || []).join(', ') || '—'}
        </span>
        <span>
          <strong>Tags:</strong> {(category.tags || []).join(', ') || '—'}
        </span>
      </div>

      {category.source && (
        <p className="dev-category-sub">
          Source: {category.source.sourceTitle}
          {category.source.sourceURL ? ` — ${category.source.sourceURL}` : ''}
          {category.source.dateReviewed ? ` (reviewed ${category.source.dateReviewed})` : ''}
        </p>
      )}

      {category.overlapTags && category.overlapTags.length > 0 && (
        <p className="dev-category-sub">Plausible false-grouping concepts: {category.overlapTags.join(', ')}</p>
      )}

      {category.notes && (
        <div className="dev-errors">
          <strong>Potential issue / note:</strong>
          <p style={{ margin: '6px 0 0' }}>{category.notes}</p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="dev-errors">
          <strong>Validation errors:</strong>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="accordion-explanation">{category.explanation}</p>
      <ul className="accordion-item-list">
        {(category.tiles || []).map((tile, i) => (
          <li key={i}>
            <strong>{tile}</strong>
            <span>{category.tileExplanations?.[i]}</span>
          </li>
        ))}
      </ul>
      <p className="remember-line">
        <span className="remember-label">Remember this</span>
        {category.remember}
      </p>
    </div>
  )
}

// Daily Puzzle Preview (Section 3) — internal/admin curation, never shown
// to players. Generates ranked candidate Dailies (verified content only)
// and lays out everything a human needs to answer "is this a good Plexus
// puzzle?": signature, shuffled board, the four intended categories with
// difficulty + archetype, systems, overlap warnings, an internal quality
// score and validation verdict, and Approve/Reject/Regenerate/Flag actions
// (local — no backend to write to in this build).
function DailyPreview() {
  const [seed, setSeed] = useState(1)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [actions, setActions] = useState({}) // puzzle key -> 'approved' | 'rejected' | 'flagged'

  const candidates = useMemo(() => curateDailyCandidates(connectionBank, { count: 8, seed }), [seed])
  const cand = candidates[selectedIdx] || candidates[0] || null

  const setAction = (key, value) => setActions((prev) => ({ ...prev, [key]: value }))
  const regenerate = () => {
    setSeed((s) => s + 1)
    setSelectedIdx(0)
  }

  if (!cand) return <p className="section-sub">No candidates could be assembled from the current verified bank.</p>

  const { puzzle, verdict } = cand
  const key = puzzle.categories.map((c) => c.bankCategoryId).join('|')
  const overlap = analyzeOverlap(puzzle)
  const shuffledTiles = shuffleWith(
    puzzle.categories.flatMap((c) => c.items.map((it) => it.term)),
    makeRng((seed * 7 + selectedIdx) >>> 0)
  )
  const ordered = puzzle.categories.slice().sort((a, b) => a.level - b.level)

  return (
    <>
      <p className="section-sub">
        Ranked candidate Dailies assembled from verified categories only. Runtime Daily selection stays deterministic by
        date — this is the authoring/curation layer.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="secondary-btn" onClick={regenerate}>
          Regenerate
        </button>
      </div>

      <div className="dev-layout">
        <div className="dev-list">
          {candidates.map((c, i) => {
            const k = c.puzzle.categories.map((x) => x.bankCategoryId).join('|')
            return (
              <button
                key={k}
                className={`dev-list-row ${selectedIdx === i ? 'active' : ''}`}
                onClick={() => setSelectedIdx(i)}
              >
                <span className={`dev-status dev-status-${c.verdict.status === 'approve' ? 'published' : c.verdict.status === 'reject' ? 'rejected' : 'reviewed'}`}>
                  {c.verdict.status}
                </span>
                <span>score {c.verdict.score}</span>
                <span className="dev-list-title">{c.puzzle.systems.join(', ')}</span>
                {actions[k] && <span className="dev-list-title">→ {actions[k]}</span>}
              </button>
            )
          })}
        </div>

        <div className="dev-main">
          <div className="dev-detail-meta" style={{ alignItems: 'center' }}>
            <PuzzleSignature seed={puzzle.id} resolved size={44} />
            <span>
              <strong>Quality score:</strong> {verdict.score}/100 ({verdict.status})
            </span>
            <span>
              <strong>Overlap:</strong> {overlap.classification}
            </span>
            <span>
              <strong>Systems:</strong> {puzzle.systems.join(', ')}
            </span>
          </div>

          {(verdict.flags.length > 0 || overlap.problems.length > 0) && (
            <div className="dev-errors">
              <strong>Warnings:</strong>
              <ul>
                {overlap.problems.map((p, i) => (
                  <li key={`p${i}`}>overlap: {p}</li>
                ))}
                {verdict.flags.map((f, i) => (
                  <li key={`f${i}`}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="dev-category-sub">
            Shuffled board: {shuffledTiles.join(' · ')}
          </p>

          <div className="dev-categories">
            {ordered.map((cat, i) => (
              <div className="dev-category" key={i} style={{ borderLeftColor: levelColor(cat.level) }}>
                <div className="dev-category-title" style={{ color: levelColor(cat.level) }}>
                  {DIFFICULTY.find((d) => d.level === cat.level)?.name} — {cat.title}
                </div>
                <p className="dev-category-sub">
                  archetype: {categoryArchetype(cat)} · type: {cat.connectionType} · from: {cat.bankCategoryId}
                </p>
                <p className="accordion-explanation">{cat.explanation}</p>
              </div>
            ))}
          </div>

          {overlap.temptations.length > 0 && (
            <p className="dev-category-sub">
              Intentional temptations: {overlap.temptations.map((t) => `${t.from}→${t.toward}`).join(', ')}
            </p>
          )}

          <div className="dev-quality-dims">
            {Object.entries(verdict.dimensions).map(([k, v]) => (
              <span className="dev-dim" key={k}>
                {k}: {Math.round(v * 100)}
              </span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <button className="secondary-btn" onClick={() => setAction(key, 'approved')}>
              Approve
            </button>
            <button className="secondary-btn" onClick={() => setAction(key, 'rejected')}>
              Reject
            </button>
            <button className="secondary-btn" onClick={regenerate}>
              Regenerate
            </button>
            <button className="secondary-btn" onClick={() => setAction(key, 'flagged')}>
              Flag
            </button>
            {actions[key] && <span className="section-sub">Marked: {actions[key]}</span>}
          </div>
        </div>
      </div>

      <h2 className="dev-heading" style={{ marginTop: 28 }}>
        Plexus-connection candidates
      </h2>
      <p className="section-sub">
        Verified Hard/Expert categories that read as cross-domain (a conservative flag for curator opt-in to the new{' '}
        <code>plexus</code> type — content is never relabelled automatically).
      </p>
      <div className="dev-categories">
        {getPlexusCandidates().map((c) => (
          <div className="dev-category" key={c.id} style={{ borderLeftColor: levelColor({ easy: 1, medium: 2, hard: 3, expert: 4 }[c.difficulty]) }}>
            <div className="dev-category-title">
              {c.difficulty} · {c.connectionType} · {c.systems.join('+')}
            </div>
            <p className="dev-category-sub">{c.title} :: {c.tiles.join(' / ')}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export default function DevViewer() {
  const [tab, setTab] = useState('puzzles') // 'puzzles' | 'bank' | 'daily'

  const [selectedId, setSelectedId] = useState(null)
  const [jsonInput, setJsonInput] = useState('')
  const [parsedPreview, setParsedPreview] = useState(null)
  const [parseError, setParseError] = useState('')

  const [selectedBankId, setSelectedBankId] = useState(null)
  const [bankJsonInput, setBankJsonInput] = useState('')
  const [bankParsedPreview, setBankParsedPreview] = useState(null)
  const [bankParseError, setBankParseError] = useState('')
  const [bankStatusFilter, setBankStatusFilter] = useState('all')
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState('all')
  const [bankSystemFilter, setBankSystemFilter] = useState('all')
  const [bankTypeFilter, setBankTypeFilter] = useState('all')

  const selected = allPuzzles.find((p) => p.id === selectedId)
  const selectedBank = connectionBank.find((c) => c.id === selectedBankId)

  const handlePreview = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setParsedPreview(parsed)
      setParseError('')
    } catch (e) {
      setParsedPreview(null)
      setParseError(e.message)
    }
  }

  const handleBankPreview = () => {
    try {
      const parsed = JSON.parse(bankJsonInput)
      setBankParsedPreview(parsed)
      setBankParseError('')
    } catch (e) {
      setBankParsedPreview(null)
      setBankParseError(e.message)
    }
  }

  const filteredBank = connectionBank.filter(
    (c) =>
      (bankStatusFilter === 'all' || c.status === bankStatusFilter) &&
      (bankDifficultyFilter === 'all' || c.difficulty === bankDifficultyFilter) &&
      (bankSystemFilter === 'all' || c.primarySystem === bankSystemFilter || (c.secondarySystems || []).includes(bankSystemFilter)) &&
      (bankTypeFilter === 'all' || c.connectionType === bankTypeFilter)
  )

  // Content health summary: quick counts for the final report / at-a-glance
  // trust signal — how much of the bank is verified vs. still needs review,
  // and how many categories have a recorded medical source.
  const contentHealth = useMemo(() => {
    const total = connectionBank.length
    const verified = connectionBank.filter((c) => c.status === 'verified').length
    const needsReview = connectionBank.filter((c) => c.status === 'needs_review').length
    const withSource = connectionBank.filter((c) => c.source && c.source.sourceTitle).length
    return { total, verified, needsReview, withSource }
  }, [])

  return (
    <div className="app-shell dev-viewer">
      <h1 className="dev-heading">Dev Viewer</h1>
      <p className="section-sub">Internal only — not linked from app navigation.</p>

      <div className="dev-tabs">
        <button className={`dev-tab ${tab === 'puzzles' ? 'active' : ''}`} onClick={() => setTab('puzzles')}>
          Puzzles ({allPuzzles.length})
        </button>
        <button className={`dev-tab ${tab === 'bank' ? 'active' : ''}`} onClick={() => setTab('bank')}>
          Connection Bank ({connectionBank.length})
        </button>
        <button className={`dev-tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>
          Daily Preview
        </button>
      </div>

      {tab === 'daily' && <DailyPreview />}

      {tab === 'puzzles' && (
        <>
          <p className="section-sub">
            {allPuzzles.length} puzzles loaded ({allPuzzles.filter((p) => p.status === 'published').length} published).
          </p>

          <div className="dev-layout">
            <div className="dev-list">
              {allPuzzles.map((p) => (
                <button
                  key={p.id}
                  className={`dev-list-row ${selectedId === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <span className={`dev-status dev-status-${p.status}`}>{p.status}</span>
                  <span>
                    {p.type === 'daily' ? `Daily #${p.number}` : `${(p.systems || [])[0] || 'System'} #${p.number}`}
                  </span>
                  <span className="dev-list-title">{p.title}</span>
                </button>
              ))}
            </div>

            <div className="dev-main">
              {selected ? <PuzzleDetail puzzle={selected} /> : <p className="section-sub">Select a puzzle on the left.</p>}
            </div>
          </div>

          <h2 className="dev-heading" style={{ marginTop: 32 }}>
            Paste puzzle JSON to preview
          </h2>
          <textarea
            className="dev-json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste a puzzle object as JSON here..."
            rows={10}
          />
          <button className="secondary-btn" onClick={handlePreview} style={{ marginTop: 8 }}>
            Preview
          </button>
          {parseError && <p className="dev-parse-error">Invalid JSON: {parseError}</p>}
          {parsedPreview && (
            <div style={{ marginTop: 16 }}>
              <PuzzleDetail puzzle={parsedPreview} />
            </div>
          )}
        </>
      )}

      {tab === 'bank' && (
        <>
          <p className="section-sub">
            Raw connection categories, independent of any single puzzle. Auto-assembled puzzles (see Puzzles tab,
            source "Generated from the connection bank…") are built from these by{' '}
            <code>scripts/assemblePuzzles.mjs</code>. Only <code>verified</code> categories are ever eligible for
            generation, the Daily Puzzle, or an organ-specific puzzle.
          </p>

          <p className="section-sub dev-content-health">
            <strong>Content health:</strong> {contentHealth.verified}/{contentHealth.total} verified ·{' '}
            {contentHealth.needsReview} needs review · {contentHealth.withSource} with a recorded medical source.
          </p>

          <div className="dev-filters">
            <select value={bankStatusFilter} onChange={(e) => setBankStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              {BANK_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={bankDifficultyFilter} onChange={(e) => setBankDifficultyFilter(e.target.value)}>
              <option value="all">All difficulties</option>
              {DIFFICULTY_TIERS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select value={bankSystemFilter} onChange={(e) => setBankSystemFilter(e.target.value)}>
              <option value="all">All systems</option>
              {SYSTEMS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={bankTypeFilter} onChange={(e) => setBankTypeFilter(e.target.value)}>
              <option value="all">All connection types</option>
              {CONNECTION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="dev-layout">
            <div className="dev-list">
              {filteredBank.map((c) => (
                <button
                  key={c.id}
                  className={`dev-list-row ${selectedBankId === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedBankId(c.id)}
                >
                  <span className={`dev-status dev-status-${c.status}`}>{c.status}</span>
                  <span className="bank-difficulty-badge">{c.difficulty}</span>
                  <span className="dev-list-title">{c.title}</span>
                </button>
              ))}
              {filteredBank.length === 0 && <p className="section-sub">No categories match this filter.</p>}
            </div>

            <div className="dev-main">
              {selectedBank ? (
                <BankCategoryDetail category={selectedBank} />
              ) : (
                <p className="section-sub">Select a category on the left.</p>
              )}
            </div>
          </div>

          <h2 className="dev-heading" style={{ marginTop: 32 }}>
            Paste a connection-bank category to validate
          </h2>
          <p className="section-sub">
            Minimal shape: <code>{'{ id, title, tiles: [4], difficulty, systems: [], connectionType, explanation, tileExplanations: [4], remember, tags: [], status }'}</code>
          </p>
          <textarea
            className="dev-json-input"
            value={bankJsonInput}
            onChange={(e) => setBankJsonInput(e.target.value)}
            placeholder="Paste a connection-bank category object as JSON here..."
            rows={10}
          />
          <button className="secondary-btn" onClick={handleBankPreview} style={{ marginTop: 8 }}>
            Validate
          </button>
          {bankParseError && <p className="dev-parse-error">Invalid JSON: {bankParseError}</p>}
          {bankParsedPreview && (
            <div style={{ marginTop: 16 }}>
              <BankCategoryDetail category={bankParsedPreview} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
