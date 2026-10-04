// ---------------------------------------------------------------------
// Supabase Auth (optional) — magic link / email+password, with guest play
// ---------------------------------------------------------------------
// Auth is NOT required to play Plexus. Today (and whenever Supabase is not
// configured) every function here is a safe no-op and the app plays as a guest
// on localStorage, exactly as before. Once Supabase is configured, these back
// the account/profile/cloud-progress features. Nothing here forces a login.

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'

export { isSupabaseConfigured }

// Sign in / up ------------------------------------------------------------
export async function signInWithMagicLink(email, redirectTo) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined) },
  })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function signInWithPassword(email, password) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  return error ? { ok: false, error: error.message } : { ok: true, user: data.user }
}

export async function signUpWithPassword(email, password, displayName) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || '' } },
  })
  return error ? { ok: false, error: error.message } : { ok: true, user: data.user }
}

export async function signOut() {
  const sb = await getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}

// Session / profile -------------------------------------------------------
export async function getCurrentUser() {
  const sb = await getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getUser()
  return data?.user || null
}

// Subscribe to auth changes; returns an unsubscribe function (no-op when off).
export function onAuthChange(cb) {
  let sub = null
  getSupabase().then((sb) => {
    if (!sb) return
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session?.user || null))
    sub = data?.subscription || null
  })
  return () => {
    try {
      sub?.unsubscribe()
    } catch {
      /* ignore */
    }
  }
}

// Ensure a profile row exists for the signed-in user (the DB trigger also does
// this; this is a safe client-side backstop and lets us set a username).
export async function ensureProfile(fields = {}) {
  const sb = await getSupabase()
  if (!sb) return null
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return null
  const { data, error } = await sb
    .from('profiles')
    .upsert({ id: user.id, ...fields }, { onConflict: 'id' })
    .select()
    .single()
  return error ? null : data
}

export async function getProfile() {
  const sb = await getSupabase()
  if (!sb) return null
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return null
  const { data } = await sb.from('profiles').select('*').eq('id', user.id).single()
  return data || null
}

export async function isAdmin() {
  const p = await getProfile()
  return Boolean(p?.is_admin)
}
