// ---------------------------------------------------------------------
// Race repository — realtime foundation for live Race Mode
// ---------------------------------------------------------------------
// This is the real Supabase-backed boundary for Race Mode. It is a FOUNDATION:
// the seeded challenge set already works fully offline (utils/raceEngine.js);
// this module adds the pieces that true head-to-head needs — a races row, a
// race_players row, Realtime Presence for readiness and Realtime Broadcast for
// progress. It activates only when Supabase is configured AND the user is
// signed in. It never fabricates an opponent: with no second client connected,
// presence/broadcast simply report no opponent, and the UI stays honest.
//
// Progress broadcasts carry only aggregate counts (answered, correct, finished,
// timeMs) — never which specific connections were answered — matching the
// product rule.

import { getSupabase, isSupabaseConfigured } from './supabaseClient.js'

export { isSupabaseConfigured }

export async function createRace({ joinCode, seed }) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return { ok: false, reason: 'guest' }
  const { data, error } = await sb
    .from('races')
    .insert({ join_code: joinCode, seed, host_user_id: user.id, status: 'lobby' })
    .select()
    .single()
  if (error) return { ok: false, error: error.message }
  await joinRacePlayer(data.id, { display_name: user.user_metadata?.display_name })
  return { ok: true, race: data }
}

export async function findRaceByCode(joinCode) {
  const sb = await getSupabase()
  if (!sb) return null
  const { data } = await sb.from('races').select('*').eq('join_code', joinCode).maybeSingle()
  return data || null
}

export async function joinRacePlayer(raceId, { display_name } = {}) {
  const sb = await getSupabase()
  if (!sb) return { ok: false, reason: 'not-configured' }
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return { ok: false, reason: 'guest' }
  const { error } = await sb
    .from('race_players')
    .upsert({ race_id: raceId, user_id: user.id, display_name: display_name || 'Player' }, { onConflict: 'race_id,user_id' })
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function setReady(raceId, ready = true) {
  const sb = await getSupabase()
  if (!sb) return
  const { data: userData } = await sb.auth.getUser()
  if (!userData?.user) return
  await sb.from('race_players').update({ ready }).eq('race_id', raceId).eq('user_id', userData.user.id)
}

export async function updateRaceStatus(raceId, status, extra = {}) {
  const sb = await getSupabase()
  if (!sb) return
  await sb.from('races').update({ status, ...extra }).eq('id', raceId)
}

// Subscribe to a race channel: Presence (who is here / ready) + Broadcast
// (opponent progress). `handlers` = { onPresence(state), onProgress(payload) }.
// Returns { channel, publishProgress, leave }. No-op shell when unconfigured.
export async function openRaceChannel(raceId, { onPresence, onProgress } = {}) {
  const sb = await getSupabase()
  if (!sb) {
    return { channel: null, publishProgress: async () => {}, leave: () => {} }
  }
  const { data: userData } = await sb.auth.getUser()
  const userId = userData?.user?.id || `anon-${Math.random().toString(36).slice(2)}`

  const channel = sb.channel(`race:${raceId}`, { config: { presence: { key: userId } } })

  channel
    .on('presence', { event: 'sync' }, () => {
      if (onPresence) onPresence(channel.presenceState())
    })
    .on('broadcast', { event: 'progress' }, ({ payload }) => {
      if (onProgress && payload?.userId !== userId) onProgress(payload)
    })

  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ userId, ready: false, at: Date.now() })
    }
  })

  const publishProgress = async (progress) => {
    // Aggregate only — never which questions were answered.
    await channel.send({
      type: 'broadcast',
      event: 'progress',
      payload: { userId, ...progress },
    })
  }
  const leave = () => {
    try {
      sb.removeChannel(channel)
    } catch {
      /* ignore */
    }
  }
  return { channel, publishProgress, leave }
}
