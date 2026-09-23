// ---------------------------------------------------------------------
// Threads + Plexus connections — derived entirely from VERIFIED content
// ---------------------------------------------------------------------
// A "Thread" is a single concept that recurs across different areas of
// medicine (e.g. potassium balance turning up in diuretics, aldosterone
// and insulin). Everything in this module is derived from the concept
// `tags` and fields already attached to VERIFIED categories in the
// connection bank — no new medical content is authored here, nothing is
// generated dynamically, and unverified categories are never exposed. It
// powers the "Follow the thread" entry point and Thread view, and flags
// existing categories that could qualify as the new 'plexus' connection
// type. Because it reads the same verified bank the puzzles come from, a
// thread can only ever reference medicine the app already teaches.
import connectionBank from '../data/connectionBank.js'

const verified = connectionBank.filter((c) => c.status === 'verified')

// A verified category, reduced to what the Thread UI needs — all of it
// already present and verified in the bank.
function memberOf(cat) {
  return {
    id: cat.id,
    title: cat.title,
    system: cat.primarySystem || (cat.systems || [])[0] || 'Mixed / Step Review',
    systems: cat.systems || [],
    connectionType: cat.connectionType || 'knowledge',
    explanation: cat.explanation || '',
    remember: cat.remember || '',
    tiles: cat.tiles || [],
  }
}

// Group verified categories by shared concept tag. A tag only becomes a
// "thread" once it genuinely spans several categories across more than one
// organ system — otherwise it's just a category's own topic, not a
// cross-cutting thread.
export function deriveThreads({ minCategories = 3, minSystems = 2 } = {}) {
  const byTag = new Map()
  for (const cat of verified) {
    const systems = cat.systems || []
    for (const raw of cat.tags || []) {
      const tag = String(raw).toLowerCase()
      if (!byTag.has(tag)) byTag.set(tag, { tag, members: [], systems: new Set() })
      const t = byTag.get(tag)
      t.members.push(memberOf(cat))
      systems.forEach((s) => t.systems.add(s))
    }
  }
  return [...byTag.values()]
    .filter((t) => t.members.length >= minCategories && t.systems.size >= minSystems)
    .map((t) => ({
      tag: t.tag,
      label: t.tag.replace(/-/g, ' '),
      systems: [...t.systems],
      // stable ordering, and expose the same shape as `members`/`categories`
      members: t.members,
      categories: t.members.map((m) => ({ id: m.id, title: m.title, systems: m.systems })),
    }))
    .sort((a, b) => b.members.length - a.members.length)
}

// The thread (if any) a given playable category belongs to, matched by its
// concept tags. Used to decide whether to offer "Follow the thread →"
// after that category is solved/reviewed. Returns the richest matching
// thread, or null. Daily categories carry no tags and simply return null.
export function getThreadForCategory(category, opts) {
  const tags = (category?.tags || []).map((t) => String(t).toLowerCase())
  if (tags.length === 0) return null
  const threads = deriveThreads(opts)
  let best = null
  for (const thread of threads) {
    if (tags.includes(thread.tag)) {
      if (!best || thread.members.length > best.members.length) best = thread
    }
  }
  return best
}

export function getThreadByTag(tag, opts) {
  const key = String(tag || '').toLowerCase()
  return deriveThreads(opts).find((t) => t.tag === key) || null
}

// One shipped prototype thread, selected from deriveThreads() output (not
// hand-authored): potassium balance recurs across Renal and Endocrine
// categories. Kept as a tag so it stays bound to the verified bank.
export const PROTOTYPE_THREAD_TAG = 'hypokalemia'

export function getPrototypeThread() {
  return getThreadByTag(PROTOTYPE_THREAD_TAG)
}

// ---------------------------------------------------------------------
// Plexus-connection candidates (Section 7)
// ---------------------------------------------------------------------
// A 'plexus' category joins concepts from different areas of medicine via
// one underlying principle. There is no per-tile "type" field to detect
// that automatically and reliably, so this returns a CONSERVATIVE list of
// verified Hard/Expert categories that already read as cross-domain — by
// spanning multiple systems, being explicitly typed 'cross-system' or
// 'cause-effect', or already carrying the 'plexus' type — for a curator to
// confirm. It never relabels content and never invents categories.
export function getPlexusCandidates() {
  return verified
    .filter((c) => {
      if (c.connectionType === 'plexus') return true
      const hardish = c.difficulty === 'hard' || c.difficulty === 'expert'
      if (!hardish) return false
      const multiSystem = (c.systems || []).length >= 2 || (c.secondarySystems || []).length >= 1
      const crossType = c.connectionType === 'cross-system' || c.connectionType === 'cause-effect'
      return multiSystem || crossType
    })
    .map((c) => ({
      id: c.id,
      title: c.title,
      difficulty: c.difficulty,
      connectionType: c.connectionType,
      systems: c.systems || [],
      tiles: c.tiles || [],
      alreadyTyped: c.connectionType === 'plexus',
    }))
}
