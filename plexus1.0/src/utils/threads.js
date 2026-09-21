// ---------------------------------------------------------------------
// Threads — data foundation (Section 22)
// ---------------------------------------------------------------------
// A "Thread" is a single concept that recurs across different areas of
// medicine (e.g. potassium balance turning up in diuretics, aldosterone
// and insulin). This module is the FOUNDATION for that future feature:
// it derives threads purely from the concept `tags` already attached to
// VERIFIED categories in the connection bank. No new medical content is
// authored here, and nothing in this file is wired into gameplay,
// scoring, progress or the puzzle assembler — it exists so a later
// Threads / "Your Plexus" / "Follow the thread" UI has verified,
// self-consistent data to build on without a hand-maintained knowledge
// graph. Because it reads the same verified bank the puzzles come from,
// a thread can never reference a concept the app doesn't already teach.
import connectionBank from '../data/connectionBank.js'

const verified = connectionBank.filter((c) => c.status === 'verified')

// Group verified categories by shared concept tag. A tag only becomes a
// "thread" once it genuinely spans several categories across more than
// one organ system — otherwise it's just a category's own topic, not a
// cross-cutting thread.
export function deriveThreads({ minCategories = 3, minSystems = 2 } = {}) {
  const byTag = new Map()
  for (const cat of verified) {
    const systems = cat.systems || []
    for (const raw of cat.tags || []) {
      const tag = String(raw).toLowerCase()
      if (!byTag.has(tag)) byTag.set(tag, { tag, categories: [], systems: new Set() })
      const t = byTag.get(tag)
      t.categories.push({ id: cat.id, title: cat.title, systems })
      systems.forEach((s) => t.systems.add(s))
    }
  }
  return [...byTag.values()]
    .filter((t) => t.categories.length >= minCategories && t.systems.size >= minSystems)
    .map((t) => ({ tag: t.tag, categories: t.categories, systems: [...t.systems] }))
    .sort((a, b) => b.categories.length - a.categories.length)
}

// One shipped prototype thread, selected from deriveThreads() output (not
// hand-authored): potassium balance recurs across Renal and Endocrine
// categories. Kept as an id so it stays bound to the verified bank.
export const PROTOTYPE_THREAD_TAG = 'hypokalemia'

export function getPrototypeThread() {
  return deriveThreads().find((t) => t.tag === PROTOTYPE_THREAD_TAG) || null
}
