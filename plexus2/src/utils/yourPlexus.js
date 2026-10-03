// ---------------------------------------------------------------------
// "Your Plexus" — personal-network DATA foundation (Section 9)
// ---------------------------------------------------------------------
// Derives a personal network of the medicine a player has actually
// connected, entirely from data that ALREADY exists in progress storage
// (concept mastery + system progress + daily history) joined to the
// VERIFIED bank. It introduces NO new persistence and writes nothing —
// it's a read-only projection so a later "Your Plexus" visualization has
// a validated shape to render. Every node is a verified category the
// player has genuinely encountered; relationships are only the verified
// threads those categories sit on. Nothing here is user-facing yet.
import connectionBank from '../data/connectionBank.js'
import { getConceptMastery, getSystemProgress, getDailyHistoryList } from './storage.js'
import { deriveThreads } from './threads.js'

const verifiedById = new Map(
  connectionBank.filter((c) => c.status === 'verified').map((c) => [c.id, c])
)

export function buildYourPlexus() {
  const mastery = getConceptMastery()
  const systemProgress = getSystemProgress()
  const dailyList = getDailyHistoryList()

  // Concept nodes: one per verified bank category the player has seen.
  const concepts = []
  const systemsEncountered = new Set()
  for (const [bankCategoryId, rec] of Object.entries(mastery)) {
    const cat = verifiedById.get(bankCategoryId)
    if (!cat) continue // skip anything not currently verified in the bank
    const system = cat.primarySystem || (cat.systems || [])[0] || 'Mixed / Step Review'
    systemsEncountered.add(system)
    concepts.push({
      id: bankCategoryId,
      title: cat.title,
      system,
      connectionType: cat.connectionType || 'knowledge',
      tags: cat.tags || [],
      retrievals: rec.timesSolved || 0, // successful retrievals
      cleanStreak: rec.currentStreak || 0,
      state: rec.state || 'unseen',
      lastSeen: rec.lastSeenAt || null,
    })
  }

  // Threads the player has encountered: a verified thread counts once the
  // player has seen at least one of its member categories.
  const seenIds = new Set(concepts.map((c) => c.id))
  const threadsEncountered = deriveThreads()
    .map((t) => {
      const seenMembers = t.members.filter((m) => seenIds.has(m.id))
      return { tag: t.tag, label: t.label, systems: t.systems, seenMembers: seenMembers.length, totalMembers: t.members.length }
    })
    .filter((t) => t.seenMembers > 0)

  return {
    concepts,
    systems: [...systemsEncountered],
    threadsEncountered,
    counts: {
      concepts: concepts.length,
      solved: concepts.filter((c) => c.retrievals > 0).length,
      mastered: concepts.filter((c) => c.state === 'mastered').length,
      systems: systemsEncountered.size,
      threads: threadsEncountered.length,
      dailiesCompleted: dailyList.filter((d) => d.completed).length,
    },
  }
}
