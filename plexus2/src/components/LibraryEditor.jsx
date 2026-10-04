import React, { useEffect, useState, useCallback } from 'react'
import { SYSTEMS } from '../puzzles.js'
import { CONNECTION_TYPES, DIFFICULTY_TIERS, BANK_STATUS } from '../data/connectionBank.js'
import * as repo from '../lib/libraryRepo.js'
import { isSupabaseConfigured } from '../lib/supabaseClient.js'
import { isAdmin as checkAdmin, getCurrentUser, signInWithPassword, signOut } from '../lib/auth.js'

// ---------------------------------------------------------------------
// Plexus Editor (internal/admin) — Supabase-backed library management.
// ---------------------------------------------------------------------
// Lives inside the hidden #dev route. When Supabase is not configured it shows
// a clear setup notice instead of failing; when configured it reads/writes the
// concepts, connections and sources tables (RLS requires an admin session for
// writes). Comma-separated inputs map to Postgres text[] columns.

const csvToArr = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean)
const arrToCsv = (a) => (Array.isArray(a) ? a.join(', ') : '')

function Field({ label, children }) {
  return (
    <label className="led-field">
      <span className="led-label">{label}</span>
      {children}
    </label>
  )
}

function ConnectionForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState(() => ({
    title: initial?.title || '',
    difficulty: initial?.difficulty || 'medium',
    connection_type: initial?.connection_type || 'knowledge',
    organ_systems: arrToCsv(initial?.organ_systems),
    tags: arrToCsv(initial?.tags),
    explanation: initial?.explanation || '',
    remember: initial?.remember || '',
    verification_status: initial?.verification_status || 'needs_review',
  }))
  const up = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  return (
    <div className="led-form">
      <Field label="Title"><input value={f.title} onChange={up('title')} /></Field>
      <div className="led-row">
        <Field label="Difficulty">
          <select value={f.difficulty} onChange={up('difficulty')}>
            {DIFFICULTY_TIERS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select value={f.connection_type} onChange={up('connection_type')}>
            {CONNECTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={f.verification_status} onChange={up('verification_status')}>
            {BANK_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Organ systems (comma-separated)"><input value={f.organ_systems} onChange={up('organ_systems')} placeholder={SYSTEMS.slice(0, 3).join(', ')} /></Field>
      <Field label="Tags (comma-separated)"><input value={f.tags} onChange={up('tags')} /></Field>
      <Field label="Explanation"><textarea rows={2} value={f.explanation} onChange={up('explanation')} /></Field>
      <Field label="Remember"><textarea rows={2} value={f.remember} onChange={up('remember')} /></Field>
      <div className="led-actions">
        <button
          className="led-btn-primary"
          disabled={busy || !f.title.trim()}
          onClick={() =>
            onSave({
              title: f.title.trim(),
              difficulty: f.difficulty,
              connection_type: f.connection_type,
              organ_systems: csvToArr(f.organ_systems),
              tags: csvToArr(f.tags),
              explanation: f.explanation,
              remember: f.remember,
              verification_status: f.verification_status,
            })
          }
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="led-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function ConceptForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState(() => ({
    canonical_name: initial?.canonical_name || '',
    organ_systems: arrToCsv(initial?.organ_systems),
    difficulty: initial?.difficulty || 'medium',
    buzzwords: arrToCsv(initial?.buzzwords),
    mechanism: initial?.mechanism || '',
    notes: initial?.notes || '',
    verification_status: initial?.verification_status || 'needs_review',
  }))
  const up = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  return (
    <div className="led-form">
      <Field label="Canonical name"><input value={f.canonical_name} onChange={up('canonical_name')} /></Field>
      <div className="led-row">
        <Field label="Difficulty">
          <select value={f.difficulty} onChange={up('difficulty')}>
            {DIFFICULTY_TIERS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={f.verification_status} onChange={up('verification_status')}>
            {BANK_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Organ systems (comma-separated)"><input value={f.organ_systems} onChange={up('organ_systems')} /></Field>
      <Field label="Buzzwords (comma-separated)"><input value={f.buzzwords} onChange={up('buzzwords')} /></Field>
      <Field label="Mechanism"><textarea rows={2} value={f.mechanism} onChange={up('mechanism')} /></Field>
      <Field label="Notes"><textarea rows={2} value={f.notes} onChange={up('notes')} /></Field>
      <div className="led-actions">
        <button
          className="led-btn-primary"
          disabled={busy || !f.canonical_name.trim()}
          onClick={() =>
            onSave({
              canonical_name: f.canonical_name.trim(),
              organ_systems: csvToArr(f.organ_systems),
              difficulty: f.difficulty,
              buzzwords: csvToArr(f.buzzwords),
              mechanism: f.mechanism,
              notes: f.notes,
              verification_status: f.verification_status,
            })
          }
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="led-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Sign-in panel — email + password. Writes to the library require an
// authenticated admin (enforced by RLS), so this lets an admin sign in from
// the Editor. Create the admin user in Supabase → Authentication → Users
// (with "Auto Confirm"), then set profiles.is_admin = true via SQL.
// ---------------------------------------------------------------------
function AuthPanel({ signedIn, admin, userEmail, onChanged }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  if (signedIn) {
    return (
      <div className="led-auth">
        <span className="led-auth-status">
          Signed in as <strong>{userEmail || 'you'}</strong>
          {admin ? ' · admin ✓' : ' · not an admin yet'}
        </span>
        <button
          className="led-btn"
          onClick={async () => { await signOut(); onChanged() }}
        >
          Sign out
        </button>
      </div>
    )
  }

  const doSignIn = async () => {
    setBusy(true)
    setMsg('')
    try {
      const r = await signInWithPassword(email.trim(), password)
      if (!r.ok) { setMsg(r.error || 'Sign-in failed'); return }
      setMsg('')
      setPassword('')
      onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="led-auth led-auth-form">
      <span className="led-auth-status">Sign in to edit</span>
      <input
        className="led-auth-input"
        type="email"
        placeholder="email"
        value={email}
        autoComplete="username"
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && email.trim() && password) doSignIn() }}
      />
      <input
        className="led-auth-input"
        type="password"
        placeholder="password"
        value={password}
        autoComplete="current-password"
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && email.trim() && password) doSignIn() }}
      />
      <button className="led-btn-primary" disabled={busy || !email.trim() || !password} onClick={doSignIn}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
      {msg && <span className="led-auth-msg">{msg}</span>}
    </div>
  )
}

export default function LibraryEditor() {
  const [entity, setEntity] = useState('connections') // connections | concepts | sources
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null) // row being edited, or 'new'
  const [busy, setBusy] = useState(false)
  const [admin, setAdmin] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [diag, setDiag] = useState(null)
  const [diagBusy, setDiagBusy] = useState(false)

  const configured = isSupabaseConfigured()

  const runCheck = async () => {
    setDiagBusy(true)
    setDiag(null)
    try {
      setDiag(await repo.runDiagnostics())
    } catch (e) {
      setDiag({ errors: [e.message || String(e)] })
    } finally {
      setDiagBusy(false)
    }
  }

  const load = useCallback(async () => {
    if (!configured) return
    setLoading(true)
    setError('')
    try {
      let data = []
      if (entity === 'connections') data = await repo.listConnections({ search, status: statusFilter, includeArchived: true })
      else if (entity === 'concepts') data = await repo.listConcepts({ search, status: statusFilter, includeArchived: true })
      else data = await repo.listSources()
      setRows(data || [])
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }, [configured, entity, search, statusFilter])

  const refreshAuth = useCallback(async () => {
    if (!configured) return
    const u = await getCurrentUser()
    setSignedIn(!!u)
    setUserEmail(u?.email || '')
    setAdmin(await checkAdmin())
  }, [configured])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  useEffect(() => {
    load()
  }, [load])

  if (!configured) {
    return (
      <div className="led">
        <div className="led-notice">
          <strong>Editor is not connected yet.</strong>
          <p>Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, run the schema migration, and sign in as an admin. See <code>SUPABASE_SETUP.md</code>. Until then the app runs on its bundled content library.</p>
        </div>
      </div>
    )
  }

  const save = async (fields) => {
    setBusy(true)
    setError('')
    try {
      if (entity === 'connections') {
        if (editing === 'new') await repo.createConnection(fields)
        else await repo.updateConnection(editing.id, fields)
      } else if (entity === 'concepts') {
        if (editing === 'new') await repo.createConcept(fields)
        else await repo.updateConcept(editing.id, fields)
      } else {
        if (editing === 'new') await repo.createSource(fields)
        else await repo.updateSource(editing.id, fields)
      }
      setEditing(null)
      await load()
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const toggleArchive = async (row) => {
    try {
      if (entity === 'connections') await repo.archiveConnection(row.id, !row.archived)
      else if (entity === 'concepts') await repo.archiveConcept(row.id, !row.archived)
      await load()
    } catch (e) {
      setError(e.message || String(e))
    }
  }

  const title = (row) => row.title || row.canonical_name || row.id

  return (
    <div className="led">
      <div className="led-diagnostic">
        <div className="led-diag-head">
          <strong>Connection check</strong>
          <button className="led-btn" onClick={runCheck} disabled={diagBusy}>{diagBusy ? 'Checking…' : 'Run connection check'}</button>
        </div>
        {diag && (
          <ul className="led-diag-results">
            <li>Host: <code>{diag.host || '—'}</code></li>
            <li>Signed in: <strong>{diag.signedIn ? 'yes' : 'no'}</strong> · Admin: <strong>{diag.admin ? 'yes' : 'no'}</strong></li>
            <li>Read — connections: <strong>{String(diag.reads?.connections ?? '—')}</strong>, concepts: <strong>{String(diag.reads?.concepts ?? '—')}</strong>, sources: <strong>{String(diag.reads?.sources ?? '—')}</strong></li>
            <li>Write test: {diag.write?.ok ? <strong style={{ color: 'var(--difficulty-medium)' }}>passed ✓</strong> : <strong style={{ color: 'var(--difficulty-easy)' }}>failed — {diag.write?.error || 'n/a'}</strong>}</li>
            {diag.errors?.length > 0 && <li className="led-diag-err">{diag.errors.join(' · ')}</li>}
          </ul>
        )}
      </div>

      <AuthPanel
        signedIn={signedIn}
        admin={admin}
        userEmail={userEmail}
        onChanged={async () => { await refreshAuth(); await load() }}
      />

      <div className="led-head">
        <div className="led-entity-tabs">
          {['connections', 'concepts', 'sources'].map((e) => (
            <button key={e} className={`led-tab ${entity === e ? 'active' : ''}`} onClick={() => { setEntity(e); setEditing(null) }}>
              {e[0].toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        <span className={`led-admin ${admin ? 'is-admin' : ''}`}>
          {admin ? 'Admin session' : signedIn ? 'Signed in (not admin — writes blocked by RLS)' : 'Not signed in (read-only)'}
        </span>
      </div>

      <div className="led-controls">
        <input className="led-search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {entity !== 'sources' && (
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {BANK_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <button className="led-btn-primary" onClick={() => setEditing('new')}>+ New</button>
      </div>

      {error && <div className="led-error">{error}</div>}
      {loading && <div className="led-muted">Loading…</div>}

      {editing && (
        <div className="led-editor-panel">
          <h3 className="led-panel-title">{editing === 'new' ? `New ${entity.slice(0, -1)}` : `Edit ${title(editing)}`}</h3>
          {entity === 'connections' && <ConnectionForm initial={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} busy={busy} />}
          {entity === 'concepts' && <ConceptForm initial={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} busy={busy} />}
          {entity === 'sources' && (
            <SourceForm initial={editing === 'new' ? null : editing} onSave={save} onCancel={() => setEditing(null)} busy={busy} />
          )}
        </div>
      )}

      {!loading && (
        <div className="led-list">
          {rows.length === 0 && <div className="led-muted">No rows.</div>}
          {rows.map((row) => (
            <div className={`led-item ${row.archived ? 'is-archived' : ''}`} key={row.id}>
              <div className="led-item-main">
                <span className="led-item-title">{title(row)}</span>
                <span className="led-item-meta">
                  {row.verification_status || ''}{row.difficulty ? ` · ${row.difficulty}` : ''}{row.archived ? ' · archived' : ''}
                </span>
              </div>
              <div className="led-item-actions">
                <button className="led-btn" onClick={() => setEditing(row)}>Edit</button>
                {entity !== 'sources' && <button className="led-btn" onClick={() => toggleArchive(row)}>{row.archived ? 'Unarchive' : 'Archive'}</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SourceForm({ initial, onSave, onCancel, busy }) {
  const [f, setF] = useState(() => ({
    title: initial?.title || '',
    edition_year: initial?.edition_year || '',
    page_reference: initial?.page_reference || '',
    notes: initial?.notes || '',
  }))
  const up = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))
  return (
    <div className="led-form">
      <Field label="Title"><input value={f.title} onChange={up('title')} /></Field>
      <div className="led-row">
        <Field label="Edition year"><input value={f.edition_year} onChange={up('edition_year')} inputMode="numeric" /></Field>
        <Field label="Page reference"><input value={f.page_reference} onChange={up('page_reference')} /></Field>
      </div>
      <Field label="Notes"><textarea rows={2} value={f.notes} onChange={up('notes')} /></Field>
      <div className="led-actions">
        <button
          className="led-btn-primary"
          disabled={busy || !f.title.trim()}
          onClick={() => onSave({ title: f.title.trim(), edition_year: f.edition_year ? Number(f.edition_year) : null, page_reference: f.page_reference, notes: f.notes })}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button className="led-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}
