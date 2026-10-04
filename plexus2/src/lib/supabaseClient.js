// ---------------------------------------------------------------------
// Supabase client (optional, additive backend layer)
// ---------------------------------------------------------------------
// Plexus is a Vite + React app (deployed on Vercel), so client-exposed env
// vars are prefixed VITE_ — not NEXT_PUBLIC_. The two variables the browser
// needs are:
//     VITE_SUPABASE_URL
//     VITE_SUPABASE_ANON_KEY
// (The equivalents of NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// in a Next.js project.) The service-role key is NEVER read here — it is
// server-only and used solely by the one-time import script (scripts/
// importToSupabase.mjs) from a non-committed .env, never in the browser bundle.
//
// CRUCIAL DESIGN RULE: Supabase is OPTIONAL. When the env vars are absent, the
// whole app runs exactly as before (localStorage + the bundled connection
// bank). `isSupabaseConfigured()` is the single gate every backend feature
// checks first, so nothing here can break the current UI or gameplay. The
// @supabase/supabase-js dependency is loaded via DYNAMIC import, so a build
// without the package (or a test harness that never calls getSupabase) never
// hard-depends on it.
// ---------------------------------------------------------------------

// Safe access to Vite's import.meta.env (undefined under the Node test harness).
function env(key) {
  try {
    // eslint-disable-next-line no-undef
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key]
  } catch {
    // import.meta not available in this context
  }
  // Fallback for Node contexts (e.g. the import script sets process.env)
  if (typeof process !== 'undefined' && process.env) return process.env[key]
  return undefined
}

export function supabaseUrl() {
  return env('VITE_SUPABASE_URL') || ''
}

// Accept the common VITE_ names for the browser (publishable/anon) key. Vite
// only exposes VITE_-prefixed vars to the client, so NEXT_PUBLIC_* / SUPABASE_*
// names injected by the Vercel integration will NOT be visible here — one of
// these VITE_ names must be set. Older projects call it the "anon" key; newer
// Supabase projects call it the "publishable" key.
export function supabaseAnonKey() {
  return (
    env('VITE_SUPABASE_ANON_KEY') ||
    env('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    env('VITE_SUPABASE_KEY') ||
    ''
  )
}

// The one gate every backend feature checks. False today (no env) → the app
// uses its existing local behavior unchanged.
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseAnonKey())
}

let _client = null
let _loadPromise = null

// Returns a singleton Supabase client, or null if not configured. Loads
// @supabase/supabase-js lazily so the app never hard-depends on it.
export async function getSupabase() {
  if (!isSupabaseConfigured()) return null
  if (_client) return _client
  if (!_loadPromise) {
    _loadPromise = import('@supabase/supabase-js')
      .then(({ createClient }) => {
        _client = createClient(supabaseUrl(), supabaseAnonKey(), {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true, // needed for magic-link redirects
          },
        })
        return _client
      })
      .catch((err) => {
        // Package missing or failed to load — degrade gracefully to local mode.
        console.warn('[plexus] Supabase client unavailable; using local mode.', err?.message || err)
        _loadPromise = null
        return null
      })
  }
  return _loadPromise
}
