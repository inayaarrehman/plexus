// ---------------------------------------------------------------------
// Connection archetypes (internal) — Section 4
// ---------------------------------------------------------------------
// The bank's `connectionType` says roughly what a category is ABOUT;
// archetypes say what KIND OF THINKING the player has to do to solve it.
// They are never shown to players — they exist so puzzle generation and
// Daily curation can require a mix of reasoning styles (e.g. avoid four
// "Causes of X" categories even when all four are medically correct).
// Derived deterministically from a category's connectionType, title and
// tiles; no new content and nothing persisted.
export const ARCHETYPES = [
  'CLASSIC_ASSOCIATION',
  'CAUSES',
  'MECHANISM',
  'ANATOMICAL_ROUTE',
  'SHARED_RECEPTOR',
  'SHARED_PATHOLOGY',
  'DRUG_EFFECT',
  'LAB_PATTERN',
  'TIMING',
  'NAMED_FINDING',
  'WORD_COMPLETION',
  'PREFIX_SUFFIX',
  'VISUAL_DESCRIPTION',
  'REVERSAL',
  'COMPENSATION',
  'CROSS_SYSTEM',
  'PLEXUS',
]

// Broad reasoning families, used by the composer/curator to tell whether
// two archetypes really feel different or are near-cousins.
export const ARCHETYPE_FAMILY = {
  CLASSIC_ASSOCIATION: 'association',
  CAUSES: 'causal',
  MECHANISM: 'mechanistic',
  COMPENSATION: 'mechanistic',
  REVERSAL: 'mechanistic',
  ANATOMICAL_ROUTE: 'structural',
  SHARED_RECEPTOR: 'mechanistic',
  SHARED_PATHOLOGY: 'structural',
  DRUG_EFFECT: 'pharmacologic',
  LAB_PATTERN: 'analytic',
  TIMING: 'temporal',
  NAMED_FINDING: 'lexical',
  WORD_COMPLETION: 'lexical',
  PREFIX_SUFFIX: 'lexical',
  VISUAL_DESCRIPTION: 'perceptual',
  CROSS_SYSTEM: 'integrative',
  PLEXUS: 'integrative',
}

const has = (re, s) => re.test(String(s || ''))

// Map one category (bank category OR an assembled puzzle category — both
// carry title + connectionType, and tiles/items) to a single archetype.
export function categoryArchetype(cat) {
  const title = cat.title || ''
  const type = cat.connectionType || ''
  const systems = cat.systems || []

  // Strongest signals first — title wordplay and explicit types win over
  // the generic connectionType fallback.
  if (type === 'plexus') return 'PLEXUS'
  if (has(/_{2,}|\b(starts?|ends?|begins?) with\b|same (prefix|suffix|word)/i, title)) {
    return has(/prefix|suffix|-\s|hyper-|hypo-/i, title) ? 'PREFIX_SUFFIX' : 'WORD_COMPLETION'
  }
  if (type === 'meta-wordplay') return 'WORD_COMPLETION'
  if (has(/reversal|reverse|opposite|mirror|paradox/i, title)) return 'REVERSAL'
  if (has(/compensat/i, title)) return 'COMPENSATION'
  if (type === 'cross-system' || systems.length >= 2) return 'CROSS_SYSTEM'
  if (has(/^causes of|risk factors|precipitants|triggers of/i, title)) return 'CAUSES'
  if (type === 'cause-effect') return has(/compensat/i, title) ? 'COMPENSATION' : 'CAUSES'
  if (has(/receptor|agonist|antagonist/i, title)) return 'SHARED_RECEPTOR'
  if (type === 'pharmacology') return 'DRUG_EFFECT'
  if (type === 'laboratory') return 'LAB_PATTERN'
  if (type === 'timing') return 'TIMING'
  if (type === 'visual') return 'VISUAL_DESCRIPTION'
  if (type === 'language') return has(/sign|triad|nodes|spots|lines|phenomenon|named|eponym/i, title) ? 'NAMED_FINDING' : 'WORD_COMPLETION'
  if (type === 'anatomy') return 'ANATOMICAL_ROUTE'
  if (type === 'pathology') return 'SHARED_PATHOLOGY'
  if (type === 'physiology' || type === 'mechanism') return 'MECHANISM'
  return 'CLASSIC_ASSOCIATION'
}

// The four archetypes of an assembled puzzle, in level order.
export function puzzleArchetypes(puzzle) {
  return (puzzle.categories || [])
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((c) => categoryArchetype(c))
}

// How varied the reasoning is: distinct archetypes AND distinct families.
export function archetypeDiversity(puzzle) {
  const arch = puzzleArchetypes(puzzle)
  const distinctArch = new Set(arch).size
  const distinctFamily = new Set(arch.map((a) => ARCHETYPE_FAMILY[a] || a)).size
  return { archetypes: arch, distinctArchetypes: distinctArch, distinctFamilies: distinctFamily }
}

// Distribution of archetypes across a set of categories (for the report).
export function archetypeDistribution(categories) {
  const dist = {}
  for (const c of categories) {
    const a = categoryArchetype(c)
    dist[a] = (dist[a] || 0) + 1
  }
  return dist
}
