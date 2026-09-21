// Derived, read-only views over (bank + conceptMastery) for the Organ
// System Library UI. Kept separate from utils/storage.js so storage.js
// stays a pure persistence layer and this stays pure derivation — neither
// needs the other's internals beyond the plain data each already returns.

// Verified bank categories whose CENTRAL learning objective is `system` —
// i.e. primarySystem, not just any mention in the broader systems[] list.
// This is what "organ purity" means: a category only counts toward (and is
// eligible to be played inside) a system's library if that system is what
// the category is actually about. Use categoriesRelatedToSystem below for
// the broader (primary OR secondary) view.
export function categoriesForSystem(bank, system) {
  return bank.filter((c) => c.status === 'verified' && c.primarySystem === system)
}

// Broader view: primary OR secondary — used only where a defensible
// cross-system connection should still surface (e.g. assembler fallback),
// never for the headline library count.
export function categoriesRelatedToSystem(bank, system) {
  return bank.filter(
    (c) => c.status === 'verified' && (c.primarySystem === system || (c.secondarySystems || []).includes(system))
  )
}

// { total, solved, mastered } across every difficulty tier for one system.
// `solved` — the headline "X / Y connections solved" number: has the
// player ever correctly grouped this category, at all? Counts on the
// first success, per the product spec (a real solve should count
// immediately, not only after a 3-in-a-row streak).
// `mastered` — the stricter, streak-based signal, kept for internal use
// (e.g. the "Strong" bucket below) — not the number shown as the headline.
export function systemMasteryCounts(bank, system, mastery) {
  const categories = categoriesForSystem(bank, system)
  const solvedCount = categories.filter((c) => (mastery[c.id]?.timesSolved || 0) > 0).length
  const masteredCount = categories.filter((c) => mastery[c.id]?.state === 'mastered').length
  return { total: categories.length, solved: solvedCount, mastered: masteredCount }
}

// Powers the "YOUR {SYSTEM}" section: a few concepts you've mastered
// (Strong), a few you keep missing (Needs work), and a few you've
// touched most recently (Recent) — all titles, not raw category ids.
export function systemMasterySummary(bank, system, mastery) {
  const categories = categoriesForSystem(bank, system)
  const withRecord = categories
    .map((c) => ({ category: c, record: mastery[c.id] }))
    .filter((x) => x.record)

  const strong = withRecord
    .filter((x) => x.record.state === 'mastered')
    .sort((a, b) => (b.record.lastSeenAt || '').localeCompare(a.record.lastSeenAt || ''))
    .slice(0, 3)
    .map((x) => x.category.title)

  const needsWork = withRecord
    .filter((x) => x.record.state !== 'mastered' && x.record.lastResult === 'missed')
    .sort((a, b) => b.record.timesSeen - a.record.timesSeen)
    .slice(0, 3)
    .map((x) => x.category.title)

  const recent = withRecord
    .sort((a, b) => (b.record.lastSeenAt || '').localeCompare(a.record.lastSeenAt || ''))
    .slice(0, 3)
    .map((x) => x.category.title)

  return { strong, needsWork, recent }
}

// Every system that has at least one verified category — used to build
// the compact, scannable system grid without hard-coding which systems
// currently have content.
export function systemsWithContent(bank, systemsList) {
  return systemsList.filter((s) => categoriesForSystem(bank, s).length > 0)
}
