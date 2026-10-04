// ---------------------------------------------------------------------
// Library repository — the content data-access layer for concepts,
// connections and sources. Backs the internal Plexus Editor.
// ---------------------------------------------------------------------
// READ paths degrade gracefully: when Supabase is not configured they return
// null, and callers fall back to the bundled connection bank — so the player
// experience is unchanged today. WRITE paths require Supabase + an admin
// session (enforced by RLS); off Supabase they throw a clear error so the
// editor can show "Connect Supabase to edit" instead of silently failing.

import { getSupabase, isSupabaseConfigured, supabaseUrl } from './supabaseClient.js'

export { isSupabaseConfigured }

// ---------------------------------------------------------------------
// Connection diagnostic (temporary admin check) — confirms reads AND writes
// against the live database from the browser. Used by the Editor's "Run
// connection check" button. The write test inserts a throwaway concept and
// immediately deletes it, so it leaves no residue; a permission error here
// usually means you are not signed in as an admin (RLS working as intended).
// ---------------------------------------------------------------------
export async function runDiagnostics() {
  const report = {
    configured: isSupabaseConfigured(),
    host: '',
    signedIn: false,
    admin: false,
    reads: {},
    write: null,
    errors: [],
  }
  try {
    report.host = new URL(supabaseUrl()).host
  } catch {
    /* ignore */
  }
  const sb = await getSupabase()
  if (!sb) {
    report.errors.push('Supabase not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing).')
    return report
  }

  // Auth / admin status
  try {
    const { data } = await sb.auth.getUser()
    report.signedIn = !!data?.user
    if (data?.user) {
      const { data: prof } = await sb.from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle()
      report.admin = !!prof?.is_admin
    }
  } catch (e) {
    report.errors.push(`auth: ${e.message || e}`)
  }

  // READ test — row counts (head request, no data transferred)
  for (const table of ['connections', 'concepts', 'sources']) {
    try {
      const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true })
      if (error) throw error
      report.reads[table] = count ?? 0
    } catch (e) {
      report.reads[table] = `error: ${e.message || e}`
      report.errors.push(`read ${table}: ${e.message || e}`)
    }
  }

  // WRITE test — insert a throwaway concept, then delete it.
  const name = `__diagnostic__ ${new Date().toISOString()}`
  try {
    const { data, error } = await sb.from('concepts').insert({ canonical_name: name, verification_status: 'needs_review' }).select('id').single()
    if (error) throw error
    report.write = { ok: true, id: data.id }
    // clean up
    const { error: delErr } = await sb.from('concepts').delete().eq('id', data.id)
    if (delErr) report.write.cleanupError = delErr.message
  } catch (e) {
    report.write = { ok: false, error: e.message || String(e) }
  }

  return report
}

function notConfigured() {
  return new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to edit the library.')
}

// ---- CONNECTIONS ----
export async function listConnections({ search = '', status = 'all', system = 'all', type = 'all', includeArchived = false } = {}) {
  const sb = await getSupabase()
  if (!sb) return null
  let q = sb.from('connections').select('*').order('updated_at', { ascending: false }).limit(500)
  if (!includeArchived) q = q.eq('archived', false)
  if (status !== 'all') q = q.eq('verification_status', status)
  if (type !== 'all') q = q.eq('connection_type', type)
  if (system !== 'all') q = q.contains('organ_systems', [system])
  if (search) q = q.ilike('title', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function getConnection(id) {
  const sb = await getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from('connections')
    .select('*, connection_concepts(position, tile_note, concept:concepts(*)), connection_sources(source:sources(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createConnection(fields) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { data, error } = await sb.from('connections').insert(fields).select().single()
  if (error) throw error
  return data
}

export async function updateConnection(id, fields) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { data, error } = await sb.from('connections').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function setConnectionVerification(id, verification_status) {
  return updateConnection(id, { verification_status })
}

export async function archiveConnection(id, archived = true) {
  return updateConnection(id, { archived })
}

export async function addConceptToConnection(connectionId, conceptId, { position = 0, tile_note = null } = {}) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { error } = await sb
    .from('connection_concepts')
    .upsert({ connection_id: connectionId, concept_id: conceptId, position, tile_note }, { onConflict: 'connection_id,concept_id' })
  if (error) throw error
  return true
}

export async function removeConceptFromConnection(connectionId, conceptId) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { error } = await sb.from('connection_concepts').delete().eq('connection_id', connectionId).eq('concept_id', conceptId)
  if (error) throw error
  return true
}

// ---- CONCEPTS ----
export async function listConcepts({ search = '', status = 'all', system = 'all', includeArchived = false } = {}) {
  const sb = await getSupabase()
  if (!sb) return null
  let q = sb.from('concepts').select('*').order('canonical_name', { ascending: true }).limit(1000)
  if (!includeArchived) q = q.eq('archived', false)
  if (status !== 'all') q = q.eq('verification_status', status)
  if (system !== 'all') q = q.contains('organ_systems', [system])
  if (search) q = q.ilike('canonical_name', `%${search}%`)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function createConcept(fields) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { data, error } = await sb.from('concepts').insert(fields).select().single()
  if (error) throw error
  return data
}

export async function updateConcept(id, fields) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { data, error } = await sb.from('concepts').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function setConceptVerification(id, verification_status) {
  return updateConcept(id, { verification_status })
}

export async function archiveConcept(id, archived = true) {
  return updateConcept(id, { archived })
}

// ---- SOURCES ----
export async function listSources() {
  const sb = await getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('sources').select('*').order('title', { ascending: true })
  if (error) throw error
  return data
}

export async function createSource(fields) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { data, error } = await sb.from('sources').insert(fields).select().single()
  if (error) throw error
  return data
}

export async function updateSource(id, fields) {
  const sb = await getSupabase()
  if (!sb) throw notConfigured()
  const { data, error } = await sb.from('sources').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}
