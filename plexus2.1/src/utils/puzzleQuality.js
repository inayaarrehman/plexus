// ---------------------------------------------------------------------
// Puzzle quality engine + overlap/ambiguity validator (Sections 1 & 2)
// ---------------------------------------------------------------------
// Internal only — the numeric score is NEVER shown to players. It exists to
// generate and curate Daily puzzles: a medically accurate set of four
// categories does not automatically make a GOOD Plexus puzzle. Everything
// here is pure (no persistence) and reads the verified bank for the extra
// signals assembled puzzles don't carry inline (overlapTags, verified
// status). Medical accuracy is always the overriding gate — a puzzle that
// would need imprecise medicine to be "clever" is rejected, never fudged.
import connectionBank from '../data/connectionBank.js'
import { categoriesCompatible, normalizeTile } from './puzzleAssembler.js'
import { archetypeDiversity, categoryArchetype } from './archetypes.js'

const bankById = new Map(connectionBank.map((c) => [c.id, c]))

// Pull the richest available view of a puzzle category: assembled puzzle
// categories carry tags/connectionType/bankCategoryId; look up the source
// bank category for overlapTags + verified status where possible.
function enrich(cat) {
  const bank = cat.bankCategoryId ? bankById.get(cat.bankCategoryId) : null
  return {
    title: cat.title || '',
    level: cat.level,
    connectionType: cat.connectionType || bank?.connectionType || '',
    tags: (cat.tags || bank?.tags || []).map((t) => String(t).toLowerCase()),
    overlapTags: (bank?.overlapTags || []).map((t) => String(t).toLowerCase()),
    systems: cat.systems || bank?.systems || [],
    bankStatus: bank?.status || (cat.bankCategoryId ? 'unknown' : 'authored'),
    hasBank: !!bank,
    items: cat.items || [],
    tiles: (cat.items || []).map((it) => it.term) || [],
    remember: cat.remember || bank?.remember || '',
    explanation: cat.explanation || bank?.explanation || '',
  }
}

const overlapCount = (a, b) => a.filter((x) => b.includes(x)).length

// ---------------------------------------------------------------------
// Overlap / ambiguity classification (Section 2)
// ---------------------------------------------------------------------
// The assembler already guarantees the 16 tile STRINGS are distinct, so a
// second *complete* partition is impossible by construction — that's the
// bedrock of fairness. What remains to classify is THEMATIC overlap: does a
// category tempt the player toward another (good) without any pair being so
// similar that intent becomes a coin-flip (bad)?
export function analyzeOverlap(puzzle) {
  const cats = (puzzle.categories || []).map(enrich)
  const problems = []
  const temptations = []

  // Bedrock check: distinct tiles = one defensible partition.
  const distinctTiles = categoriesCompatible(cats.map((c) => ({ tiles: c.tiles })))
  if (!distinctTiles) problems.push('duplicate tile text across categories (more than one valid partition)')

  for (let i = 0; i < cats.length; i++) {
    for (let j = 0; j < cats.length; j++) {
      if (i === j) continue
      const a = cats[i]
      const b = cats[j]
      // Near-synonymous categories: their defining tags overlap so heavily
      // that which tile "belongs" to which becomes arbitrary. Only a HEAVY
      // overlap counts — same-system categories routinely share a broad tag
      // or two (that's intentional thematic overlap, not a fairness bug),
      // so the bar is deliberately high (3+ shared defining tags).
      if (a.hasBank && b.hasBank && overlapCount(a.tags, b.tags) >= 3 && i < j) {
        problems.push(`categories "${a.title}" and "${b.title}" are near-synonymous (shared defining tags)`)
      }
      // Intentional temptation: A's tiles plausibly relate to B's concept
      // (A's overlapTags meet B's tags) — a good near-miss lure.
      const lure = overlapCount(a.overlapTags, b.tags)
      if (lure > 0) temptations.push({ from: a.title, toward: b.title, strength: lure })
    }
  }

  let classification
  if (problems.length > 0) classification = 'problematic'
  else if (temptations.length > 0) classification = 'intentional'
  else classification = 'acceptable'

  return { classification, temptations, problems, distinctTiles }
}

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n))
const conciseTitle = (t) => t.length > 0 && t.length <= 52 && !/^causes of a |^a measurement/i.test(t)

// ---------------------------------------------------------------------
// puzzleQualityScore (Section 1)
// ---------------------------------------------------------------------
// Returns { score: 0-100, dimensions: {...0-1}, flags: [], overlap }.
// recentConcepts/recentArchetypes let Daily curation reward novelty.
export function puzzleQualityScore(puzzle, { recentConcepts = [], recentArchetypes = [] } = {}) {
  const cats = (puzzle.categories || []).map(enrich)
  const flags = []
  const overlap = analyzeOverlap(puzzle)
  const div = archetypeDiversity(puzzle)

  // Medical accuracy (hard gate): every category must be verified (or a
  // hand-authored published Daily category with no bank link).
  const allDefensible = cats.every((c) => c.bankStatus === 'verified' || c.bankStatus === 'authored')
  if (!allDefensible) flags.push('contains a non-verified category — not eligible for play')

  // Category distinctness: low pairwise tag overlap + system spread.
  const distinctSystems = new Set(cats.flatMap((c) => c.systems)).size
  const distinctness = clamp(
    (div.distinctArchetypes / 4) * 0.5 + Math.min(distinctSystems, 4) / 4 * 0.3 + (overlap.problems.length === 0 ? 0.2 : 0),
    0,
    1
  )

  // Intentional ambiguity: some temptations are ideal; none is flat, too
  // many starts to feel unfair.
  const t = overlap.temptations.length
  const intentionalAmbiguity = overlap.problems.length ? 0 : t === 0 ? 0.35 : t <= 4 ? 1 : 0.6

  // Fairness: exactly one defensible partition. This is guaranteed by the
  // tiles being distinct strings — thematic tag overlap makes guesses
  // *tempting*, not the board *ambiguous*, so fairness hinges on the tile
  // partition, not on shared tags. A genuine near-synonymous pair is a
  // separate `flags`/distinctness concern below, not a fairness failure.
  const fairness = overlap.distinctTiles ? 1 : 0
  if (overlap.problems.length) flags.push(...overlap.problems)

  // Difficulty progression: all four tiers present, one each.
  const levels = cats.map((c) => c.level).sort()
  const difficultyProgression = JSON.stringify(levels) === JSON.stringify([1, 2, 3, 4]) ? 1 : 0.4

  // Archetype variety: distinct archetypes and families.
  const archetypeVariety = clamp(div.distinctArchetypes / 4 * 0.6 + div.distinctFamilies / 4 * 0.4, 0, 1)
  if (div.distinctArchetypes <= 2) flags.push('low archetype variety (reasoning feels repetitive)')

  // Educational value: real explanations + takeaways.
  const educationalValue = cats.every((c) => c.explanation.length > 40 && c.remember.length > 15) ? 1 : 0.6

  // Aha: at least one hard/expert category with a non-obvious archetype.
  const ahaArchetypes = new Set(['REVERSAL', 'COMPENSATION', 'PLEXUS', 'CROSS_SYSTEM', 'NAMED_FINDING', 'WORD_COMPLETION', 'PREFIX_SUFFIX'])
  const ahaQuality = cats.some((c) => c.level >= 3 && ahaArchetypes.has(categoryArchetype(c))) ? 1 : 0.5
  if (ahaQuality < 1) flags.push('no strong "aha" category (all reasoning is direct recall)')

  // Novelty: penalize categories/archetypes seen very recently.
  const recentConceptSet = new Set(recentConcepts.map((s) => String(s).toLowerCase()))
  const recentArchSet = new Set(recentArchetypes)
  const conceptClash = cats.filter((c) => c.tags.some((tag) => recentConceptSet.has(tag)) || recentConceptSet.has(c.title.toLowerCase())).length
  const archClash = div.archetypes.filter((a) => recentArchSet.has(a)).length
  const novelty = clamp(1 - conceptClash * 0.2 - archClash * 0.1, 0, 1)
  if (conceptClash > 0) flags.push(`${conceptClash} recently-seen concept(s)`)

  // Linguistic quality: concise, specific titles.
  const linguisticQuality = cats.filter((c) => conciseTitle(c.title)).length / 4

  const dimensions = {
    medicalAccuracy: allDefensible ? 1 : 0,
    categoryDistinctness: distinctness,
    intentionalAmbiguity,
    fairness,
    difficultyProgression,
    archetypeVariety,
    educationalValue,
    ahaQuality,
    novelty,
    linguisticQuality,
  }

  // Weighted blend. Medical accuracy and fairness are gates: if either
  // fails, the score is crushed so a "clever" but unfair/unverified puzzle
  // can never rank well.
  const weights = {
    medicalAccuracy: 0.16,
    categoryDistinctness: 0.12,
    intentionalAmbiguity: 0.12,
    fairness: 0.16,
    difficultyProgression: 0.06,
    archetypeVariety: 0.14,
    educationalValue: 0.08,
    ahaQuality: 0.08,
    novelty: 0.05,
    linguisticQuality: 0.03,
  }
  let raw = Object.entries(weights).reduce((s, [k, w]) => s + dimensions[k] * w, 0)
  if (dimensions.medicalAccuracy < 1 || dimensions.fairness < 1) raw *= 0.3 // hard gate
  const score = Math.round(clamp(raw * 100))

  return { score, dimensions, flags, overlap, archetypes: div.archetypes }
}

// Simple pass/curate verdict used by generation + the admin preview.
export function puzzleVerdict(puzzle, ctx) {
  const q = puzzleQualityScore(puzzle, ctx)
  let status
  if (q.dimensions.medicalAccuracy < 1 || q.overlap.classification === 'problematic') status = 'reject'
  else if (q.score >= 70) status = 'approve'
  else status = 'review'
  return { ...q, status }
}
