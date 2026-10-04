// ---------------------------------------------------------------------
// Daily repository — official daily puzzle + per-user results
// ---------------------------------------------------------------------
// When Supabase is configured, the official Daily is read from the
// daily_puzzles table (everyone gets the same published row for a date). When
// it is NOT configured, callers fall back to the existing local daily pipeline
// (utils/dailyPuzzle.js) — unchanged behavior. Results are written only when a
// user is signed in; guests keep their progress in localStorage as today.

import { getSupabase } from './supabaseClient.js'
import { dateKey } from '../utils/game.js'

// Returns the published puzzle_data for a date, or null (→ caller uses local).
export async function fetchOfficialDaily(dateOrKey) {
  const sb = await getSupabase()
  if (!sb) return null
  const key = typeof dateOrKey === 'string' ? dateOrKey : dateKey(dateOrKey)
  const { data, error } = await sb
    .from('daily_puzzles')
    .select('id, puzzle_date, seed, puzzle_data, status')
    .eq('puzzle_date', key)
    .eq('status', 'published')
    .maybeSingle()
  if (error || !data) return null
  return data
}

// Record (or upsert) the signed-in user's result for a daily puzzle. No-ops for
// guests / unconfigured — their progress stays in localStorage.
export async function recordDailyResult(puzzleId, { completed, mistakes, completionTimeMs }) {
  const sb = await getSupabase()
  if (!sb || !puzzleId) return { ok: false, reason: 'not-configured' }
  const { data: userData } = await sb.auth.getUser()
  const user = userData?.user
  if (!user) return { ok: false, reason: 'guest' }
  const { error } = await sb.from('user_daily_results').upsert(
    {
      user_id: user.id,
      puzzle_id: puzzleId,
      completed: !!completed,
      mistakes: mistakes ?? 0,
      completion_time_ms: completionTimeMs ?? null,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,puzzle_id' }
  )
  return error ? { ok: false, error: error.message } : { ok: true }
}

export async function getMyDailyResults(limit = 60) {
  const sb = await getSupabase()
  if (!sb) return null
  const { data: userData } = await sb.auth.getUser()
  if (!userData?.user) return null
  const { data } = await sb
    .from('user_daily_results')
    .select('*, daily_puzzles(puzzle_date)')
    .order('completed_at', { ascending: false })
    .limit(limit)
  return data || []
}
