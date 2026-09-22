// Short, positive microcopy shown briefly when a single group resolves into
// a Strand (Sections 4, 5, 11, 12). Small curated set, never generated at
// runtime. The tone is "yes, you saw it" — smart and casual, not teacher
// praise: no "Amazing!"/"Great job!"/emoji/exclamation. "Connected." is
// deliberately NOT here — it is reserved for completing the WHOLE puzzle so
// it keeps its impact. Weighted for a little human rhythm (some phrases
// common, some occasional) and never repeats the immediately previous one.
const POOL = [
  { text: 'Nice.', weight: 3 },
  { text: "That's it.", weight: 3 },
  { text: 'Found it.', weight: 3 },
  { text: 'Exactly.', weight: 1 },
  { text: 'There it is.', weight: 1 },
  { text: 'Good catch.', weight: 1 },
]

export const CONNECTION_PHRASES = POOL.map((p) => p.text)

// Picks a phrase, weighted, excluding `last` so the same line never appears
// twice in a row. `rnd` is injectable for tests.
export function pickConnectionPhrase(last, rnd = Math.random) {
  const pool = POOL.filter((p) => p.text !== last)
  const total = pool.reduce((s, p) => s + p.weight, 0)
  let r = rnd() * total
  for (const p of pool) {
    r -= p.weight
    if (r <= 0) return p.text
  }
  return pool[pool.length - 1].text
}
