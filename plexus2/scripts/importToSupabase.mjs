// ---------------------------------------------------------------------
// One-time content import: bundled connection bank  ->  Supabase
// ---------------------------------------------------------------------
// Usage (from the project root, after `npm install` and filling .env.local):
//
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  node scripts/importToSupabase.mjs
//
// or, if you keep them in .env.local, load it first:
//
//   node --env-file=.env.local scripts/importToSupabase.mjs
//
// It is IDEMPOTENT and safe to re-run: concepts upsert on canonical_name and
// connections on external_key (the bank id), so it never creates duplicates and
// never deletes existing content. It uses the SERVICE ROLE key, which bypasses
// RLS — run it only locally, never ship that key to the browser.
//
// What it imports: every VERIFIED bank category becomes a `connections` row;
// each of its 4 tiles becomes a reusable `concepts` row (deduplicated by name)
// linked via `connection_concepts` with the per-tile "why" note. A single
// "Plexus bundled content" source is attached for provenance.

import connectionBank from '../src/data/connectionBank.js'

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SERVICE_KEY) {
  console.error('\nMissing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service_role secret).')
  console.error('Find them in Supabase → Project Settings → API. Do NOT use the anon key here.\n')
  process.exit(1)
}

let createClient
try {
  ;({ createClient } = await import('@supabase/supabase-js'))
} catch {
  console.error('\n@supabase/supabase-js is not installed. Run `npm install` first.\n')
  process.exit(1)
}

const sb = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } })

const norm = (s) => String(s).trim()
const verified = connectionBank.filter((c) => c.status === 'verified')

async function main() {
  console.log(`Importing ${verified.length} verified connections…`)

  // 1) Source record for provenance (idempotent by title).
  const { data: existingSrc } = await sb.from('sources').select('id').eq('title', 'Plexus bundled content').maybeSingle()
  let sourceId = existingSrc?.id
  if (!sourceId) {
    const { data, error } = await sb
      .from('sources')
      .insert({ title: 'Plexus bundled content', notes: 'Imported from the app’s bundled connection bank.' })
      .select('id')
      .single()
    if (error) throw error
    sourceId = data.id
  }

  // 2) Unique concepts (deduplicated by canonical_name = tile text).
  const tileMap = new Map() // lowercased -> canonical display name
  for (const c of verified) for (const t of c.tiles) {
    const key = t.toLowerCase()
    if (!tileMap.has(key)) tileMap.set(key, norm(t))
  }
  const conceptRows = [...tileMap.values()].map((name) => ({
    canonical_name: name,
    verification_status: 'verified',
  }))
  // Upsert in chunks on canonical_name.
  const nameToId = new Map()
  for (let i = 0; i < conceptRows.length; i += 200) {
    const chunk = conceptRows.slice(i, i + 200)
    const { data, error } = await sb.from('concepts').upsert(chunk, { onConflict: 'canonical_name' }).select('id, canonical_name')
    if (error) throw error
    for (const row of data) nameToId.set(row.canonical_name.toLowerCase(), row.id)
  }
  console.log(`  concepts upserted: ${nameToId.size}`)

  // 3) Connections (upsert on external_key = bank id) + concept links.
  let connCount = 0
  let linkCount = 0
  for (const c of verified) {
    const { data: conn, error } = await sb
      .from('connections')
      .upsert(
        {
          external_key: c.id,
          title: c.title,
          organ_systems: c.systems || [],
          subcategory: null,
          difficulty: c.difficulty,
          connection_type: c.connectionType,
          explanation: c.explanation || '',
          remember: c.remember || '',
          tags: c.tags || [],
          verification_status: 'verified',
          archived: false,
        },
        { onConflict: 'external_key' }
      )
      .select('id')
      .single()
    if (error) throw error
    connCount++

    // link concepts (position + tile_note = per-tile "why")
    const links = c.tiles.map((t, i) => ({
      connection_id: conn.id,
      concept_id: nameToId.get(t.toLowerCase()),
      position: i,
      tile_note: c.tileExplanations?.[i] || null,
    })).filter((l) => l.concept_id)
    if (links.length) {
      const { error: linkErr } = await sb.from('connection_concepts').upsert(links, { onConflict: 'connection_id,concept_id' })
      if (linkErr) throw linkErr
      linkCount += links.length
    }
    // attach source
    await sb.from('connection_sources').upsert({ connection_id: conn.id, source_id: sourceId }, { onConflict: 'connection_id,source_id' })
  }

  console.log(`  connections upserted: ${connCount}`)
  console.log(`  concept links upserted: ${linkCount}`)
  console.log('\nDone. Re-running is safe (idempotent — no duplicates).')
}

main().catch((e) => {
  console.error('\nImport failed:', e.message || e)
  process.exit(1)
})
