// Headless functional self-test for MedConnections.
// Validates the puzzle data set and exercises the core game-logic functions
// (no browser/DOM required). Run with: node scripts/selftest.mjs

// Minimal localStorage polyfill so storage.js functions work under plain Node.
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

import allPuzzles, {
  validatePuzzle,
  dailyPuzzles,
  systemPuzzles,
  generatedPuzzles,
  getPuzzleById,
  getPublishedPuzzles,
  SYSTEMS,
} from '../src/puzzles.js'
import connectionBank, { validateBankCategory, DIFFICULTY_TIERS, BANK_STATUS, CONNECTION_TYPES } from '../src/data/connectionBank.js'
import {
  categoriesCompatible,
  assemblePuzzleFromCategories,
  autoGeneratePuzzles,
  scoreCombo,
  assembleSystemPuzzle,
} from '../src/utils/puzzleAssembler.js'
import { dateKey, dayNumber, getDailyPuzzleIndex, buildTiles, isFullMatch, isOneAway, shuffle, attemptKey, isDuplicateAttempt, dateFromDayNumber } from '../src/utils/game.js'
import { assessModes, validateRound as validateChallengeRound } from '../src/utils/challengeEngine.js'
import { getDailyPuzzleForDate, isFutureDateKey } from '../src/utils/dailyPuzzle.js'
import {
  categoriesForSystem,
  systemMasteryCounts,
  systemMasterySummary,
  systemsWithContent,
} from '../src/utils/mastery.js'
import { getCompletionPhrase, PHRASES } from '../src/utils/completionPhrases.js'
import { deriveThreads, getPrototypeThread } from '../src/utils/threads.js'
import { buildShareText } from '../src/utils/shareText.js'
import { computeDailyMicroStat } from '../src/utils/dailyMicroStat.js'
import { pickConnectionPhrase, CONNECTION_PHRASES } from '../src/utils/connectionMicrocopy.js'
import { pickConnectionOfDay } from '../src/utils/connectionOfDay.js'
import {
  ROUND_TYPES,
  CORE_ROUND_TYPES,
  BASE_POINTS,
  WRONG_PENALTY,
  getMultiplier,
  speedBonus,
  computeActionPoints,
  generateRound,
  validateRound,
  composeNextRound,
} from '../src/utils/challengeEngine.js'
import { categoryArchetype, ARCHETYPES, archetypeDistribution } from '../src/utils/archetypes.js'
import { puzzleQualityScore, analyzeOverlap, puzzleVerdict } from '../src/utils/puzzleQuality.js'
import { curateDailyCandidates } from '../src/utils/dailyCuration.js'
import {
  recordResult,
  loadStats,
  saveProgress,
  loadProgress,
  clearProgress,
  recordDailyHistory,
  getDailyHistory,
  recordSystemAttempt,
  getSystemProgress,
  recordWeakSpots,
  getWeakSpots,
  getConceptMastery,
  recordConceptMastery,
  getMasteryState,
  isSolved,
  getChallengeStats,
  recordChallengeResult,
  recordKnowledgeSignal,
  recordNearMissConfusions,
  getNearMissConfusions,
} from '../src/utils/storage.js'

let failures = 0
const ok = (label) => console.log(`  ok  - ${label}`)
const fail = (label, detail) => {
  failures += 1
  console.log(`FAIL  - ${label}${detail ? `\n        ${detail}` : ''}`)
}
const assert = (cond, label, detail) => (cond ? ok(label) : fail(label, detail))

console.log(`\nMedConnections self-test\n${'='.repeat(40)}`)

// ---------------------------------------------------------------
console.log('\n[1] Puzzle bank structure (daily + system, data-driven schema)')
assert(Array.isArray(allPuzzles) && allPuzzles.length >= 1, `puzzle bank is non-empty (${allPuzzles.length} puzzles)`)
assert(dailyPuzzles.length >= 1, `daily puzzles present (${dailyPuzzles.length})`)
assert(systemPuzzles.length >= 1, `system puzzles present (${systemPuzzles.length})`)

const seenIds = new Set()
allPuzzles.forEach((p, i) => {
  const errors = validatePuzzle(p)
  assert(errors.length === 0, `puzzle[${i}] "${p.title}" (${p.id}) is structurally valid`, errors.join('; '))
  assert(!seenIds.has(p.id), `puzzle[${i}] id "${p.id}" is unique`)
  seenIds.add(p.id)
  assert(SYSTEMS.length === 16, 'SYSTEMS list has 16 named organ systems')
})

allPuzzles.forEach((p, i) => {
  const total = p.categories.reduce((sum, c) => sum + c.items.length, 0)
  assert(total === 16, `puzzle[${i}] has 16 total items`, `got ${total}`)
})

assert(getPuzzleById(dailyPuzzles[0].id)?.id === dailyPuzzles[0].id, 'getPuzzleById resolves a known daily puzzle')
assert(getPuzzleById('does-not-exist') === null, 'getPuzzleById returns null for unknown id')
assert(getPublishedPuzzles().every((p) => p.status === 'published'), 'getPublishedPuzzles only returns published puzzles')

// ---------------------------------------------------------------
console.log('\n[2] Tile building & shuffling')
const testPuzzle = allPuzzles[0]
const tiles = buildTiles(testPuzzle)
assert(tiles.length === 16, 'buildTiles returns 16 tiles')
const textSet = new Set(tiles.map((t) => t.text))
assert(textSet.size === 16, 'all built tiles have unique text')
tiles.forEach((t) => {
  assert(
    typeof t.catIndex === 'number' && t.catIndex >= 0 && t.catIndex < 4,
    `tile "${t.text}" has a valid catIndex`
  )
})

const arr = Array.from({ length: 20 }, (_, i) => i)
const shuffled = shuffle(arr)
assert(shuffled.length === arr.length, 'shuffle preserves length')
assert(
  JSON.stringify(shuffled.slice().sort((a, b) => a - b)) === JSON.stringify(arr),
  'shuffle preserves the same set of elements'
)

// ---------------------------------------------------------------
console.log('\n[3] Match-detection logic')
const cat0Tiles = tiles.filter((t) => t.catIndex === 0)
assert(cat0Tiles.length === 4, 'found 4 tiles for category 0')
assert(isFullMatch(cat0Tiles), 'isFullMatch true for 4 same-category tiles')

const mixed = [...tiles.filter((t) => t.catIndex === 0).slice(0, 3), tiles.find((t) => t.catIndex === 1)]
assert(!isFullMatch(mixed), 'isFullMatch false for a 3+1 mix')
assert(isOneAway(mixed), 'isOneAway true for a 3+1 mix')

const twoAndTwo = [
  ...tiles.filter((t) => t.catIndex === 0).slice(0, 2),
  ...tiles.filter((t) => t.catIndex === 1).slice(0, 2),
]
assert(!isFullMatch(twoAndTwo), 'isFullMatch false for a 2+2 mix')
assert(!isOneAway(twoAndTwo), 'isOneAway false for a 2+2 mix')

// ---------------------------------------------------------------
console.log('\n[4] Simulated full playthrough (win path)')
{
  const p = allPuzzles[1]
  const t = buildTiles(p)
  let solved = []
  for (let cat = 0; cat < 4; cat++) {
    const group = t.filter((x) => x.catIndex === cat)
    if (isFullMatch(group)) solved.push(cat)
  }
  assert(solved.length === 4, 'every category in a fresh shuffle is internally consistent and matchable')
}

console.log('\n[5] Simulated full playthrough (loss path: 4 wrong guesses)')
{
  const p = allPuzzles[2]
  const t = buildTiles(p)
  let mistakes = 0
  for (let i = 0; i < 4; i++) {
    const a = t.filter((x) => x.catIndex === i % 4).slice(0, 2)
    const b = t.filter((x) => x.catIndex === (i + 1) % 4).slice(0, 2)
    const guess = [...a, ...b]
    if (!isFullMatch(guess)) mistakes++
  }
  assert(mistakes === 4, 'four deliberately-wrong guesses register as four mistakes')
}

// ---------------------------------------------------------------
console.log('\n[6] Daily puzzle resolution (date-determined, same for everyone)')
const d1 = new Date(2026, 8, 19) // Sep 19, 2026 - matches an explicit dailyPuzzles date
const d2 = new Date(2026, 8, 20)
assert(dateKey(d1) === '2026-09-19', 'dateKey formats correctly', dateKey(d1))
assert(typeof dayNumber(d1) === 'number' && dayNumber(d2) === dayNumber(d1) + 1, 'dayNumber increments by 1 per day')

const daily1 = getDailyPuzzleForDate(d1)
const daily1Again = getDailyPuzzleForDate(new Date(2026, 8, 19))
assert(!!daily1, 'getDailyPuzzleForDate resolves a puzzle for an explicit daily date')
assert(daily1?.id === daily1Again?.id, 'getDailyPuzzleForDate is deterministic for the same date')

// Far-future date with no explicit entry should still resolve via rotation fallback.
const farFuture = new Date(2027, 5, 15)
const fallback = getDailyPuzzleForDate(farFuture)
assert(!!fallback, 'getDailyPuzzleForDate falls back to rotation for a date with no explicit daily')
assert(!isFutureDateKey(dateKey(new Date())), "today's date is never considered a future date")
assert(isFutureDateKey('2099-01-01'), 'a date far in the future is correctly detected as a future date')

// Old index-based rotation helper still used as the daily fallback mechanism.
const idx1 = getDailyPuzzleIndex(getPublishedPuzzles().length, d1)
assert(idx1 >= 0 && idx1 < getPublishedPuzzles().length, 'getDailyPuzzleIndex stays in range')

// ---------------------------------------------------------------
console.log('\n[7] Storage: stats, streak-gaming prevention, progress round-trip')
{
  localStorage.clear()
  let stats = recordResult({ won: true, mistakes: 1, isDaily: true, dailyKey: '2026-01-01', countsTowardStreak: true })
  assert(stats.currentStreak === 1, 'winning a counted daily increments the streak')
  stats = recordResult({ won: true, mistakes: 0, isDaily: true, dailyKey: '2020-01-01', countsTowardStreak: false })
  assert(stats.currentStreak === 1, 'winning a backfilled Archive day (countsTowardStreak=false) does NOT move the streak')
  assert(stats.gamesPlayed === 2, 'gamesPlayed still increments for every finished game, streak or not')

  saveProgress('daily-2026-01-02', { gameOver: true, won: true })
  assert(loadProgress('daily-2026-01-02')?.gameOver === true, 'saveProgress/loadProgress round-trip works')
  clearProgress('daily-2026-01-02')
  assert(loadProgress('daily-2026-01-02') === null, 'clearProgress removes saved progress')

  // Perfect-streak tracking (feeds the "3-day perfect streak." daily
  // micro-stat) — separate from the ordinary win streak: a win WITH
  // mistakes keeps the regular streak alive but resets the perfect one.
  localStorage.clear()
  stats = recordResult({ won: true, mistakes: 0, isDaily: true, dailyKey: '2026-03-01', countsTowardStreak: true })
  assert(stats.currentPerfectStreak === 1, 'a zero-mistake counted win starts a perfect streak')
  stats = recordResult({ won: true, mistakes: 0, isDaily: true, dailyKey: '2026-03-02', countsTowardStreak: true })
  assert(stats.currentPerfectStreak === 2, 'a second consecutive zero-mistake win extends the perfect streak')
  stats = recordResult({ won: true, mistakes: 1, isDaily: true, dailyKey: '2026-03-03', countsTowardStreak: true })
  assert(stats.currentPerfectStreak === 0, 'a win WITH mistakes resets the perfect streak even though the regular streak continues')
  assert(stats.currentStreak === 3, 'the regular win streak is unaffected by mistakes')
}

console.log('\n[8] Storage: Daily history (Archive), System progress, Weak Spots')
{
  localStorage.clear()
  recordDailyHistory({ date: '2026-02-01', puzzleId: 'daily-0001', puzzleNumber: 1, completed: true, won: true, mistakes: 2 })
  const history = getDailyHistory()
  assert(history['2026-02-01']?.won === true, 'recordDailyHistory/getDailyHistory round-trip works')

  recordSystemAttempt({
    puzzleId: 'sys-cardio-0001',
    system: 'Cardiology',
    won: true,
    mistakes: 1,
    correctGuesses: 4,
    totalGuesses: 5,
    categoriesMissed: 0,
  })
  const sysProgress = getSystemProgress()
  assert(sysProgress.lastPlayedSystem === 'Cardiology', 'recordSystemAttempt sets lastPlayedSystem (for Continue Studying)')
  assert(sysProgress.perPuzzle['sys-cardio-0001']?.completions === 1, 'recordSystemAttempt tracks per-puzzle completions')
  assert(sysProgress.perSystem['Cardiology']?.attempted === 1, 'recordSystemAttempt tracks per-system aggregates')

  recordWeakSpots([
    { tag: 'QT-prolonging drugs', solved: false },
    { tag: 'QT-prolonging drugs', solved: false },
    { tag: 'Nephritic syndromes', solved: true },
  ])
  const weakSpots = getWeakSpots()
  assert(weakSpots['QT-prolonging drugs']?.timesEncountered === 2, 'recordWeakSpots aggregates repeated misses on the same concept')
  assert(weakSpots['QT-prolonging drugs']?.timesMissed === 2, 'recordWeakSpots tracks timesMissed correctly')
  assert(weakSpots['Nephritic syndromes']?.timesSolved === 1, 'recordWeakSpots tracks timesSolved correctly')
}

// ---------------------------------------------------------------
console.log('\n[9] Connection Bank structure & validation')
{
  assert(Array.isArray(connectionBank) && connectionBank.length >= 1, `connection bank is non-empty (${connectionBank.length} categories)`)
  const bankIds = new Set()
  connectionBank.forEach((c, i) => {
    const errors = validateBankCategory(c)
    assert(errors.length === 0, `bank[${i}] "${c.title}" (${c.id}) is structurally valid`, errors.join('; '))
    assert(!bankIds.has(c.id), `bank[${i}] id "${c.id}" is unique`)
    bankIds.add(c.id)
    assert(DIFFICULTY_TIERS.includes(c.difficulty), `bank[${i}] has a valid difficulty tier`, c.difficulty)
    assert(BANK_STATUS.includes(c.status), `bank[${i}] has a valid status`, c.status)
    assert(CONNECTION_TYPES.includes(c.connectionType), `bank[${i}] has a valid connectionType`, c.connectionType)
  })

  const verified = connectionBank.filter((c) => c.status === 'verified')
  const needsReview = connectionBank.filter((c) => c.status === 'needs_review')
  assert(verified.length > 0, `at least one verified bank category exists (${verified.length})`)
  assert(needsReview.length >= 1, 'at least one category is intentionally flagged needs_review (kept, not deleted)')

  // Invalid category should be rejected with specific errors, not silently accepted.
  const badCategory = { id: 'bad', title: 'x', tiles: ['a', 'a', 'b', 'c'], difficulty: 'nope' }
  const badErrors = validateBankCategory(badCategory)
  assert(badErrors.length > 0, 'validateBankCategory rejects a structurally invalid category', badErrors.join('; '))
}

console.log('\n[10] Puzzle Assembler: compatibility, scoring, generation')
{
  const easy = connectionBank.find((c) => c.id === 'bank-easy-01')
  const medium = connectionBank.find((c) => c.id === 'bank-medium-01')
  const hard = connectionBank.find((c) => c.id === 'bank-hard-01')
  const expert = connectionBank.find((c) => c.id === 'bank-expert-01')
  assert(categoriesCompatible([easy, medium, hard, expert]), 'four categories with no shared tile text are compatible')

  const dupCategory = { ...easy, id: 'dup', tiles: [...easy.tiles] } // shares all 4 tiles with `easy`
  assert(!categoriesCompatible([easy, dupCategory]), 'two categories sharing tile text are correctly flagged incompatible')

  const assembled = assemblePuzzleFromCategories([easy, medium, hard, expert], {
    id: 'test-assembled-0001',
    number: 9001,
    title: 'Test Assembled Puzzle',
  })
  const assembledErrors = validatePuzzle(assembled)
  assert(assembledErrors.length === 0, 'assemblePuzzleFromCategories produces a puzzle that passes validatePuzzle', assembledErrors.join('; '))
  assert(assembled.categories.map((c) => c.level).sort().join(',') === '1,2,3,4', 'assembled puzzle maps easy/medium/hard/expert to levels 1-4')

  let threw = false
  try {
    assemblePuzzleFromCategories([easy, medium, hard], { id: 'x', number: 1, title: 'x' })
  } catch {
    threw = true
  }
  assert(threw, 'assemblePuzzleFromCategories throws when given fewer than 4 categories')

  assert(
    scoreCombo([easy, medium, hard, expert]) > 0,
    'scoreCombo returns a positive internal quality score for a valid combo'
  )

  assert(generatedPuzzles.length >= 1, `at least one puzzle was auto-generated from the bank (${generatedPuzzles.length})`)
  generatedPuzzles.forEach((p, i) => {
    const errors = validatePuzzle(p)
    assert(errors.length === 0, `generatedPuzzles[${i}] "${p.title}" passes validatePuzzle`, errors.join('; '))
    assert(p.source.includes('connection bank'), `generatedPuzzles[${i}] records its bank provenance in source`)
  })

  // Regenerating with the same seed must reproduce the same puzzle set
  // (content-review reproducibility).
  const regenerated = autoGeneratePuzzles(connectionBank, { count: generatedPuzzles.length, seed: 20260919, startNumber: 1 })
  assert(
    regenerated.map((p) => p.id).join(',') === generatedPuzzles.map((p) => p.id).join(','),
    'autoGeneratePuzzles is deterministic for a fixed seed (reproducible regeneration)'
  )

  // The needs_review category must never be selected into a generated puzzle.
  const usedBankIds = new Set(generatedPuzzles.flatMap((p) => p.categories.map((c) => c.bankCategoryId)))
  assert(!usedBankIds.has('bank-easy-04'), 'the needs_review bank category is never used in auto-generated puzzles')
}

console.log('\n[11] Organ System Library: live assembly is organ-pure, no unrelated-category fallback')
{
  assert(SYSTEMS.length === 16, 'organ system library lists 16 named systems')

  // Organ purity, by construction: for whichever systems currently have
  // full 4-tier coverage (primary or a defensible secondary tag in every
  // tier), assembleSystemPuzzle must produce a puzzle where every single
  // category is either primarySystem === system, or has `system` listed
  // in its secondarySystems (an intentionally-labeled cross-system
  // category) — NEVER a category unrelated to the chosen system by either
  // field. This is the direct regression test for the reported bug (an
  // unrelated Neurology cranial-nerve-palsy category appearing inside an
  // Endocrine puzzle): that could only happen via the old "fall back to
  // the entire unrelated verified pool" behavior, which no longer exists.
  let anyProduced = false
  let anyImpure = 0
  SYSTEMS.forEach((system) => {
    const puzzle = assembleSystemPuzzle(connectionBank, system, { mastery: {} })
    // A thin system (missing verified content in some tier, even via a
    // defensible secondary tag) is EXPECTED to return null now rather than
    // ever padding the puzzle with an unrelated category — so no puzzle is
    // not a failure by itself; purity is what's asserted when one exists.
    if (!puzzle) return
    anyProduced = true
    const errors = validatePuzzle(puzzle)
    assert(errors.length === 0, `assembled "${system}" puzzle passes validatePuzzle`, errors.join('; '))
    const levels = puzzle.categories.map((c) => c.level).sort().join(',')
    assert(levels === '1,2,3,4', `assembled "${system}" puzzle has exactly one easy/medium/hard/expert category each`)

    puzzle.categories.forEach((cat) => {
      const bankCat = connectionBank.find((c) => c.id === cat.bankCategoryId)
      const pure = !!bankCat && (bankCat.primarySystem === system || (bankCat.secondarySystems || []).includes(system))
      if (!pure) anyImpure += 1
      assert(pure, `assembled "${system}" puzzle category "${cat.title}" is primary or defensible-secondary for "${system}", never an unrelated category`)
    })
  })
  assert(anyProduced, 'at least one system (e.g. Cardiology) has enough content to produce a live-assembled puzzle')
  assert(anyImpure === 0, 'no assembled system puzzle ever contains a category unrelated to the chosen system (organ-purity regression test)')

  // The specific reported bug: an Endocrine puzzle, if one can be
  // assembled at all, must never include the unrelated cranial-nerve-palsy
  // Neurology category.
  const endocrinePuzzle = assembleSystemPuzzle(connectionBank, 'Endocrine', { mastery: {} })
  if (endocrinePuzzle) {
    assert(
      !endocrinePuzzle.categories.some((c) => c.bankCategoryId === 'bank-neuro-02'),
      'an assembled Endocrine puzzle never includes the unrelated cranial-nerve-palsy Neurology category (the originally reported bug)'
    )
  }

  // Live assembly must be non-deterministic run-to-run (uses Math.random by
  // default) but every run must still validate.
  const runA = assembleSystemPuzzle(connectionBank, 'Cardiology', { mastery: {} })
  const runB = assembleSystemPuzzle(connectionBank, 'Cardiology', { mastery: {} })
  assert(!!runA && !!runB, 'assembleSystemPuzzle can be called repeatedly for the same system')

  const withContent = systemsWithContent(connectionBank, SYSTEMS)
  assert(withContent.includes('Cardiology'), 'systemsWithContent reports Cardiology has dedicated bank categories')
}

console.log('\n[12] Concept mastery: "solved" counts immediately, "mastery" is streak-based, storage round-trip')
{
  localStorage.clear()
  assert(getMasteryState({}, 'bank-easy-01') === 'unseen', 'a never-seen bank category defaults to "unseen"')
  assert(isSolved({}, 'bank-easy-01') === false, 'a never-seen bank category is not "solved"')

  let mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  assert(isSolved(mastery, 'bank-easy-01') === true, 'a single correct solve immediately counts as "solved" (this is the organ-progress bug fix)')
  assert(getMasteryState(mastery, 'bank-easy-01') === 'learning', 'a single clean solve moves internal mastery to "learning", not "mastered"')

  mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  assert(getMasteryState(mastery, 'bank-easy-01') === 'learning', 'a second consecutive clean solve is still "learning" (mastery requires a streak of 3)')

  mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true }])
  assert(getMasteryState(mastery, 'bank-easy-01') === 'mastered', 'a third consecutive clean solve reaches "mastered" (not from a single exposure)')
  assert(isSolved(mastery, 'bank-easy-01') === true, '"solved" stays true once achieved, independent of mastery streak')

  // Replaying an already-solved category again (still correct) must NOT be
  // able to move the still-true "solved" flag, and a subsequent miss must
  // reset the mastery streak without ever un-solving the category — this is
  // the explicit "replay a previously solved connection does not double
  // count / does not regress" scenario from the spec.
  mastery = recordConceptMastery([{ bankCategoryId: 'bank-easy-01', solved: false, cleanSolve: false }])
  assert(getMasteryState(mastery, 'bank-easy-01') === 'learning', 'any missed/dirty solve resets the mastery streak (mastered -> learning), never stays "mastered" on a miss')
  assert(isSolved(mastery, 'bank-easy-01') === true, 'a later miss never un-solves a category that was already solved')

  const reloaded = getConceptMastery()
  assert(getMasteryState(reloaded, 'bank-easy-01') === 'learning', 'concept mastery persists to localStorage and reloads correctly')
  assert(isSolved(reloaded, 'bank-easy-01') === true, '"solved" state persists to localStorage and reloads correctly')
}

console.log('\n[13] Mastery derivation helpers (per-system counts & summaries)')
{
  localStorage.clear()
  const mastery = recordConceptMastery([
    { bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true },
    { bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true },
    { bankCategoryId: 'bank-easy-01', solved: true, cleanSolve: true },
  ])
  const cardioCats = categoriesForSystem(connectionBank, 'Cardiology')
  assert(cardioCats.every((c) => c.status === 'verified'), 'categoriesForSystem only returns verified categories')
  assert(cardioCats.every((c) => c.primarySystem === 'Cardiology'), 'categoriesForSystem is organ-pure: only primarySystem matches, not any systems[] mention')

  const counts = systemMasteryCounts(connectionBank, 'Cardiology', mastery)
  assert(
    typeof counts.total === 'number' && typeof counts.solved === 'number' && typeof counts.mastered === 'number',
    'systemMasteryCounts returns {total, solved, mastered}'
  )
  assert(counts.total >= counts.solved && counts.total >= counts.mastered, 'solved/mastered counts never exceed total verified categories for a system')
  assert(counts.solved >= counts.mastered, 'solved count is always >= mastered count (mastery implies solved, not vice versa)')
  assert(counts.solved >= 1, 'the category solved above is reflected in the headline "solved" count immediately')

  const summary = systemMasterySummary(connectionBank, 'Cardiology', mastery)
  assert(
    Array.isArray(summary.strong) && Array.isArray(summary.needsWork) && Array.isArray(summary.recent),
    'systemMasterySummary returns {strong, needsWork, recent} arrays'
  )
}

console.log('\n[13b] Organ-system progress bug scenario: solve, persist, replay, no double-count')
{
  localStorage.clear()
  const before = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(before.solved === 0, 'Cardiology starts at 0 solved with no history (reproduces the reported "0 / 14" starting state)')

  // Simulate finishing a Cardiology puzzle with 4 unique, correctly solved
  // categories (as buildMasteryResults() in App.jsx would produce).
  const fourUnique = categoriesForSystem(connectionBank, 'Cardiology').slice(0, 4)
  assert(fourUnique.length === 4, 'at least 4 verified Cardiology categories exist to run this scenario')
  recordConceptMastery(fourUnique.map((c) => ({ bankCategoryId: c.id, solved: true, cleanSolve: true })))

  const afterSolve = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(afterSolve.solved === 4, 'progress updates immediately after solving 4 unique Cardiology connections')

  // "Refresh" / "close and reopen" is just re-reading from localStorage.
  const afterReload = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(afterReload.solved === 4, 'progress remains after a simulated refresh/relaunch (re-reading localStorage)')

  // Replaying one already-solved connection (still correct) must not
  // increase the count further.
  recordConceptMastery([{ bankCategoryId: fourUnique[0].id, solved: true, cleanSolve: true }])
  const afterReplay = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
  assert(afterReplay.solved === 4, 'replaying a previously solved connection does not incorrectly increase progress')

  // Solving one brand-new (5th) Cardiology connection increases the count.
  const fifth = categoriesForSystem(connectionBank, 'Cardiology')[4]
  if (fifth) {
    recordConceptMastery([{ bankCategoryId: fifth.id, solved: true, cleanSolve: true }])
    const afterFifth = systemMasteryCounts(connectionBank, 'Cardiology', getConceptMastery())
    assert(afterFifth.solved === 5, 'solving a genuinely new connection increases progress')
  }
}

console.log('\n[13c] Polish-pass features: completion phrases, share text, daily micro-stat, Connection of the Day')
{
  const perfectPhrase = getCompletionPhrase({ puzzleId: 'daily-0001', mistakes: 0 })
  assert(perfectPhrase === 'Perfectly connected.', 'a zero-mistake solve always gets the distinct "Perfectly connected." phrase')

  const normalPhrase = getCompletionPhrase({ puzzleId: 'daily-0001', mistakes: 2 })
  assert(PHRASES.includes(normalPhrase), 'a non-perfect solve gets one of the rotating restrained phrases')
  assert(
    !['Amazing!!!', "You're a genius!", 'Great job!'].includes(normalPhrase),
    'completion phrases never use hype language'
  )
  const samePhraseAgain = getCompletionPhrase({ puzzleId: 'daily-0001', mistakes: 2 })
  assert(normalPhrase === samePhraseAgain, 'the same puzzle id + mistake count deterministically returns the same phrase')

  const sample = dailyPuzzles[0]
  const guessLog = sample.categories.map((c, i) => ({ levels: [c.level, c.level, c.level, c.level], catIndexes: [i, i, i, i], correct: true }))
  const share = buildShareText({ isDaily: true, dailyNumber: 5, puzzleTitle: sample.title, guessLog, won: true, mistakes: 0, dailyStreak: 4 })
  assert(share.includes('PLEXUS'), 'share text identifies the app by its own name')
  assert(!share.includes('🟨') && !share.includes('🟩') && !share.includes('🟦') && !share.includes('🟪'), 'share text never uses the NYT-style colored-square emoji grid')
  assert(/[●▲◆■]/.test(share), 'share text uses the app\'s own shape glyphs')

  const microStatPerfect = computeDailyMicroStat({ mistakes: 0, guessLog: [], dailyPerfectStreak: 0 })
  assert(microStatPerfect === 'No mistakes today.', 'a zero-mistake day with no streak yet reports "No mistakes today."')

  const microStatStreak = computeDailyMicroStat({ mistakes: 0, guessLog: [], dailyPerfectStreak: 3 })
  assert(microStatStreak === '3-day perfect streak.', 'a 3+ day perfect streak takes priority over the plain "no mistakes" stat')

  const expertFirstLog = [{ levels: [4, 4, 4, 4], catIndexes: [3, 3, 3, 3], correct: true }]
  const microStatExpert = computeDailyMicroStat({ mistakes: 1, guessLog: expertFirstLog, dailyPerfectStreak: 0 })
  assert(microStatExpert === 'Solved Expert first.', 'solving the Expert category first is called out when the day was not otherwise perfect')

  const cod = pickConnectionOfDay(sample)
  assert(!!cod && !!cod.title && !!cod.explanation, 'pickConnectionOfDay returns a title + one-sentence explanation from the Hard/Expert tier')
  const codCategory = sample.categories.find((c) => c.title === cod.title)
  assert(codCategory.level === 4 || codCategory.level === 3, 'Connection of the Day is always a Hard or Expert category, preferring Expert')
}

console.log('\n[13d] Knowledge signal ("Knew it"/"Review later") and Near Miss Memory storage')
{
  localStorage.clear()
  const afterSignal = recordKnowledgeSignal('Causes of elevated JVP', 'knew-it')
  assert(afterSignal['Causes of elevated JVP'].knewItCount === 1, 'a "knew it" signal is recorded per category tag')
  recordKnowledgeSignal('Causes of elevated JVP', 'review-later')
  const reloadedSpots = getWeakSpots()
  assert(reloadedSpots['Causes of elevated JVP'].reviewLaterCount === 1, 'a "review later" signal is recorded independently of "knew it"')
  assert(reloadedSpots['Causes of elevated JVP'].knewItCount === 1, 'recording a second, different signal does not erase the first')

  localStorage.clear()
  recordNearMissConfusions([{ a: 'Sarcoidosis features', b: 'Caseating granuloma diseases' }])
  recordNearMissConfusions([{ a: 'Caseating granuloma diseases', b: 'Sarcoidosis features' }]) // order-independent, should aggregate
  const confusions = getNearMissConfusions()
  const key = Object.keys(confusions)[0]
  assert(Object.keys(confusions).length === 1, 'a confused pair aggregates into one record regardless of which category is listed first')
  assert(confusions[key].count === 2, 'repeated confusion of the same pair increments the same record')
}

console.log('\n[14] 3-Minute Challenge: round generation, distractor plausibility, verified-only content')
{
  assert(CORE_ROUND_TYPES.length === 4, 'the 4 required round types are defined (Mini Connections, Impostor, Rapid Association, Complete the Connection)')
  assert(ROUND_TYPES.includes('commonLink'), 'the optional 5th mode (Common Link) is defined without disturbing the core 4')

  // Every round type must be independently buildable from the real bank.
  ROUND_TYPES.forEach((type) => {
    const round = generateRound(connectionBank, { roundTypes: [type] })
    assert(!!round, `generateRound can build a "${type}" round from the live connection bank`)
    if (round) {
      assert(round.type === type, `"${type}" round reports its own type`)
    }
  })

  // needs_review content must never reach a challenge round: check every
  // round's own categoryId(s) (never a text/tile match, since two
  // unrelated verified categories can innocently share a tile string,
  // e.g. "Tuberculosis" appearing in more than one category — that's not
  // leakage, so the check has to be identity-based, not text-based).
  const flaggedCategory = connectionBank.find((c) => c.status === 'needs_review')
  let sawFlaggedContent = false
  for (let i = 0; i < 200; i++) {
    const round = generateRound(connectionBank, { rng: Math.random })
    if (!round) continue
    const categoryIds = []
    if (round.categoryId) categoryIds.push(round.categoryId)
    if (round.groups) categoryIds.push(round.groups.a.categoryId, round.groups.b.categoryId)
    if (categoryIds.includes(flaggedCategory.id)) sawFlaggedContent = true
  }
  assert(!sawFlaggedContent, 'the needs_review category is never selected as an anchor/group in 200 sampled challenge rounds')

  // Impostor: exactly 5 options, exactly 1 marked correct (the impostor).
  const impostorRound = generateRound(connectionBank, { roundTypes: ['impostor'] })
  assert(impostorRound.options.length === 5, 'an Impostor round shows exactly 5 options')
  assert(impostorRound.options.filter((o) => o.correct).length === 1, 'an Impostor round has exactly 1 correct (impostor) option')

  // Rapid Association: 8 options, exactly 4 correct, matching the anchor category's tiles.
  const rapidRound = generateRound(connectionBank, { roundTypes: ['rapidAssociation'] })
  assert(rapidRound.options.length === 8, 'a Rapid Association round shows exactly 8 options')
  assert(rapidRound.correctAnswers.length === 4, 'a Rapid Association round has exactly 4 correct answers')
  assert(
    rapidRound.options.filter((o) => o.correct).length === 4,
    'exactly 4 of the 8 Rapid Association options are marked correct'
  )

  // Complete the Connection: 3 shown + 4 options, exactly 1 correct.
  const completeRound = generateRound(connectionBank, { roundTypes: ['completeConnection'] })
  assert(completeRound.shown.length === 3, 'a Complete the Connection round shows 3 of the 4 tiles')
  assert(completeRound.options.length === 4, 'a Complete the Connection round offers 4 possible 4th members')
  assert(completeRound.options.filter((o) => o.correct).length === 1, 'exactly 1 Complete the Connection option is correct')

  // Mini Connections: 8 tiles from 2 categories with no shared tile text
  // (categoriesCompatible already guarantees a single valid partition).
  const miniRound = generateRound(connectionBank, { roundTypes: ['miniConnections'] })
  assert(miniRound.tiles.length === 8, 'a Mini Connections round shows 8 tiles')
  const miniTextSet = new Set(miniRound.tiles.map((t) => t.text.toLowerCase()))
  assert(miniTextSet.size === 8, 'Mini Connections tiles are all unique (no duplicate/ambiguous tile)')

  // Distractor plausibility: for a rapid-association anchor, no distractor
  // should literally be one of the anchor's own correct tiles.
  const anchorTiles = new Set(rapidRound.correctAnswers.map((t) => t.toLowerCase()))
  const distractorTexts = rapidRound.options.filter((o) => !o.correct).map((o) => o.text.toLowerCase())
  assert(distractorTexts.every((t) => !anchorTiles.has(t)), 'Rapid Association distractors never duplicate a correct answer')
}

console.log('\n[15] 3-Minute Challenge: scoring math')
{
  assert(getMultiplier(0) === 1 && getMultiplier(1) === 1, 'no multiplier until a streak of 2 consecutive correct answers')
  assert(getMultiplier(2) === 1.1, '2 consecutive correct -> x1.1')
  assert(getMultiplier(3) === 1.2, '3 consecutive correct -> x1.2')
  assert(getMultiplier(4) === 1.3 && getMultiplier(9) === 1.3, '4+ consecutive correct caps at x1.3')

  assert(speedBonus(0) > 0, 'an instant correct answer earns a nonzero speed bonus')
  assert(speedBonus(60000) === 0, 'a very slow answer earns no speed bonus')

  assert(
    computeActionPoints({ correct: false, basePoints: 150, multiplier: 1.3, responseMs: 100 }) === WRONG_PENALTY,
    'an incorrect answer always costs the flat penalty, regardless of multiplier or speed'
  )
  const fastCorrect = computeActionPoints({ correct: true, basePoints: BASE_POINTS.impostor, multiplier: 1, responseMs: 0 })
  assert(fastCorrect > BASE_POINTS.impostor, 'an instant correct answer scores above the base points (speed bonus applied)')
}

console.log('\n[16] 3-Minute Challenge: storage (personal best + history, independent of the daily streak)')
{
  localStorage.clear()
  const empty = getChallengeStats()
  assert(empty.personalBest === 0 && Array.isArray(empty.history), 'a fresh player has personalBest=0 and an empty history')

  let { stats, isNewBest } = recordChallengeResult({
    score: 1200,
    roundsAttempted: 10,
    roundsCorrect: 8,
    accuracy: 80,
    avgResponseMs: 2500,
    conceptTagsMissed: ['QT prolongation'],
    organSystemsMissed: ['Cardiology'],
    highestMultiplier: 1.2,
    completedAt: new Date().toISOString(),
  })
  assert(isNewBest === true, 'the first-ever run is reported as a new personal best')
  assert(stats.personalBest === 1200, 'personalBest is recorded correctly')

  ;({ stats, isNewBest } = recordChallengeResult({ score: 800, roundsAttempted: 6, roundsCorrect: 4, accuracy: 66 }))
  assert(isNewBest === false, 'a lower-scoring run is NOT reported as a new personal best')
  assert(stats.personalBest === 1200, 'personalBest is unaffected by a lower-scoring run')
  assert(stats.history.length === 2, 'challenge history accumulates across runs')

  // Independence from the Daily Puzzle streak: recording challenge runs
  // must never touch medconnections.stats.v1's streak fields.
  const dailyStatsBefore = loadStats()
  recordChallengeResult({ score: 50, roundsAttempted: 1, roundsCorrect: 1, accuracy: 100 })
  const dailyStatsAfter = loadStats()
  assert(
    dailyStatsAfter.currentStreak === dailyStatsBefore.currentStreak && dailyStatsAfter.gamesPlayed === dailyStatsBefore.gamesPlayed,
    'recording a 3-Minute Challenge result never changes the Daily Puzzle streak/stats (no second streak introduced)'
  )
}

console.log('\n[17] Threads foundation: derived only from VERIFIED bank content')
{
  const verifiedIds = new Set(connectionBank.filter((c) => c.status === 'verified').map((c) => c.id))
  const threads = deriveThreads()
  assert(threads.length > 0, 'deriveThreads() finds at least one cross-system concept thread')
  const spansSystems = threads.every((t) => t.systems.length >= 2 && t.categories.length >= 3)
  assert(spansSystems, 'every derived thread spans >= 2 systems and >= 3 categories')
  const allVerified = threads.every((t) => t.categories.every((c) => verifiedIds.has(c.id)))
  assert(allVerified, 'every thread member is a VERIFIED bank category (no unverified content)')

  const proto = getPrototypeThread()
  assert(proto !== null, 'the shipped prototype thread resolves against the current bank')
  assert(proto.categories.every((c) => verifiedIds.has(c.id)), 'the prototype thread references only verified categories')
}

console.log('\n[18] Quality engine: archetypes, quality score, overlap validator')
{
  // Archetypes resolve to the known enum, and obvious titles map sensibly.
  const sampleCat = connectionBank.find((c) => /^causes of/i.test(c.title))
  if (sampleCat) assert(categoryArchetype(sampleCat) === 'CAUSES', 'a "Causes of…" category maps to the CAUSES archetype')
  const wordplay = connectionBank.find((c) => /starts with|_{2,}/i.test(c.title))
  if (wordplay) assert(['WORD_COMPLETION', 'PREFIX_SUFFIX'].includes(categoryArchetype(wordplay)), 'a wordplay title maps to a lexical archetype')
  assert(connectionBank.every((c) => ARCHETYPES.includes(categoryArchetype(c))), 'every bank category maps to a valid archetype')

  // A real assembled puzzle scores in range with a defensible partition.
  const sys = assembleSystemPuzzle(connectionBank, 'Renal', {})
  const q = puzzleQualityScore(sys)
  assert(q.score >= 0 && q.score <= 100, `quality score is within 0–100 (got ${q.score})`)
  assert(q.dimensions.fairness === 1, 'an assembled puzzle has exactly one defensible partition (fairness = 1)')
  const ov = analyzeOverlap(sys)
  assert(['intentional', 'acceptable', 'problematic'].includes(ov.classification), 'overlap is classified into one of the three buckets')
  assert(ov.distinctTiles === true, 'assembled puzzle tiles are all distinct (no second complete partition)')

  // A puzzle with a duplicated tile across categories is gated to a low
  // score and flagged problematic (medical/fairness gate).
  const broken = JSON.parse(JSON.stringify(sys))
  broken.categories[1].items[0].term = broken.categories[0].items[0].term // force a duplicate tile
  const bq = puzzleQualityScore(broken)
  assert(analyzeOverlap(broken).classification === 'problematic', 'a duplicate-tile puzzle is classified problematic')
  assert(bq.score < q.score, 'the broken puzzle scores strictly lower than the clean one (fairness gate applied)')

  const dist = archetypeDistribution(connectionBank)
  assert(Object.keys(dist).length >= 3, 'the bank spans at least three archetypes')
}

console.log('\n[19] Round-level validation (only valid rounds enter play)')
{
  let rng = (() => { let s = 7; return () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) })()
  for (const type of ROUND_TYPES) {
    let validated = 0
    for (let i = 0; i < 20; i++) {
      const round = generateRound(connectionBank, { rng, roundTypes: [type] })
      if (!round) continue
      const v = validateRound(round, connectionBank)
      if (v.valid) validated += 1
      assert(v.valid, `generated ${type} round passes validateRound`, v.reason)
      assert(round.roundValidationStatus === 'valid', `${type} round is marked roundValidationStatus:valid`)
      if (validated >= 3) break
    }
  }
  // A deliberately-broken impostor round (impostor is actually a member) is rejected.
  const anchor = connectionBank.find((c) => c.status === 'verified')
  const badImpostor = {
    type: 'impostor',
    categoryId: anchor.id,
    options: [...anchor.tiles.map((t) => ({ text: t, correct: false })), { text: anchor.tiles[0], correct: true }],
    correctAnswer: anchor.tiles[0],
  }
  assert(!validateRound(badImpostor, connectionBank).valid, 'an impostor that is genuinely a member is rejected')

  // The composer returns a valid round and never immediately repeats a type.
  const r1 = composeNextRound(connectionBank, { rng, recent: [{ type: 'impostor', systems: [], conceptTags: [] }] })
  assert(r1 && validateRound(r1, connectionBank).valid, 'composeNextRound returns a validated round')
}

console.log('\n[20] Daily curation: ranked, verified-only candidates')
{
  const cands = curateDailyCandidates(connectionBank, { count: 5, seed: 3 })
  assert(cands.length > 0, 'curateDailyCandidates produces candidates')
  assert(cands.every((c) => c.verdict.dimensions.medicalAccuracy === 1), 'every candidate is medically defensible (verified categories)')
  const scores = cands.map((c) => c.verdict.score)
  assert(scores.every((s, i) => i === 0 || scores[i - 1] >= s), 'candidates are returned best-first by score')
}

console.log('\n[21] Duplicate-attempt detection (keyed on stable tile ids, not category indexes)')
{
  // Stand-in tiles: text is the stable per-puzzle id; catIndex included to
  // prove it is NOT what drives duplicate detection.
  const A = { text: 'Aspirin', catIndex: 0 }
  const B = { text: 'Warfarin', catIndex: 1 }
  const C = { text: 'Heparin', catIndex: 2 }
  const D = { text: 'Clopidogrel', catIndex: 3 }
  const E = { text: 'Enoxaparin', catIndex: 3 }

  // Order-independence of the canonical key.
  assert(attemptKey([A, B, C, D]) === attemptKey([D, B, A, C]), 'attemptKey is order-independent (A B C D === D C B A)')
  assert(attemptKey([A, B, C, D]) !== attemptKey([A, B, C, E]), 'attemptKey differs when one tile differs (ABCD ≠ ABCE)')

  const log = [{ correct: false, catIndexes: [0, 1, 2, 3], attemptKey: attemptKey([A, B, C, D]) }]
  assert(isDuplicateAttempt(log, [D, C, B, A]), 'D C B A is a duplicate of a prior A B C D')
  assert(!isDuplicateAttempt(log, [A, B, C, E]), 'A B C E is NOT a duplicate (one concept changed)')
  assert(!isDuplicateAttempt(log, [A, B, D, E]), 'A B D E is NOT a duplicate')

  // The actual bug: two DIFFERENT tile sets that each span the same four
  // categories must not collide. (Old code compared sorted catIndexes.)
  const A2 = { text: 'Ibuprofen', catIndex: 0 }
  const B2 = { text: 'Apixaban', catIndex: 1 }
  const C2 = { text: 'Dabigatran', catIndex: 2 }
  const D2 = { text: 'Ticagrelor', catIndex: 3 }
  assert(
    !isDuplicateAttempt(log, [A2, B2, C2, D2]),
    'a different tile-set spanning the same four categories is NOT a duplicate (root-cause regression)'
  )

  // Correct guesses never count as prior attempts (their tiles leave the board).
  const solvedLog = [{ correct: true, catIndexes: [0, 0, 0, 0], attemptKey: attemptKey([A, B, C, D]) }]
  assert(!isDuplicateAttempt(solvedLog, [A, B, C, D]), 'a correct group never triggers a duplicate warning')

  // A fresh puzzle (empty log) never reports duplicates.
  assert(!isDuplicateAttempt([], [A, B, C, D]), 'an empty guess log never reports a duplicate (no cross-puzzle leak)')

  // Legacy entries without a stored key are skipped, never false-positive.
  const legacyLog = [{ correct: false, catIndexes: [0, 1, 2, 3] }]
  assert(!isDuplicateAttempt(legacyLog, [A, B, C, D]), 'a legacy guess entry with no attemptKey never false-positives')
}

console.log('\n[22] Connection microcopy (individual-Strand feedback)')
{
  // Never uses the reserved whole-puzzle words, and no corny praise.
  assert(!CONNECTION_PHRASES.includes('Connected.'), '"Connected." is reserved for full completion, not individual groups')
  assert(!CONNECTION_PHRASES.includes('Perfectly connected.'), '"Perfectly connected." is not an individual-group phrase')
  const banned = ['Amazing!', 'Awesome!', 'Great job!', 'Nailed it!', 'Genius!']
  assert(CONNECTION_PHRASES.every((p) => !banned.includes(p) && !p.includes('!')), 'microcopy avoids corny praise and exclamation marks')

  // Always returns a real phrase and never repeats the immediately previous one.
  let last = null
  let noRepeat = true
  let allInPool = true
  const seq = [0.05, 0.4, 0.7, 0.99, 0.2, 0.55, 0.85, 0.33, 0.11, 0.66]
  let k = 0
  for (let i = 0; i < 40; i++) {
    const phrase = pickConnectionPhrase(last, () => seq[k++ % seq.length])
    if (!CONNECTION_PHRASES.includes(phrase)) allInPool = false
    if (phrase === last) noRepeat = false
    last = phrase
  }
  assert(allInPool, 'pickConnectionPhrase always returns a phrase from the curated pool')
  assert(noRepeat, 'pickConnectionPhrase never repeats the immediately previous phrase')
}

console.log('\n[23] Challenge-a-friend day-number round-trip (spoiler-free link)')
{
  for (const n of [0, 1, 42, 993, 1500]) {
    assert(dayNumber(dateFromDayNumber(n)) === n, `dateFromDayNumber(${n}) resolves back to day number ${n}`)
  }
  // The same day number resolves to the same deterministic Daily.
  const a = getDailyPuzzleForDate(dateFromDayNumber(700))
  const b = getDailyPuzzleForDate(dateFromDayNumber(700))
  assert(a && b && a.id === b.id, 'a challenge day number resolves to one deterministic Daily')
}

console.log('\n[24] Expanded 3-Minute mode gate + validity (verified content only)')
{
  const report = assessModes(connectionBank)
  const ready = Object.entries(report).filter(([, v]) => v.status === 'READY').map(([m]) => m)
  assert(ready.length >= 3, `mode gate classifies several modes READY (${ready.join(', ')})`)
  assert(report.matchTheLink.status === 'READY', 'Match the Link is READY')
  assert(report.doubleAgent.status === 'READY', 'Double Agent is READY')
  // Every mode that produces rounds produces VALID rounds only.
  let seed = 99
  const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
  for (const mode of ['matchTheLink', 'doubleAgent', 'linkTwo', 'sameOrDifferent', 'split', 'chain', 'completeTheChain']) {
    let checked = 0
    for (let i = 0; i < 30 && checked < 3; i++) {
      const round = generateRound(connectionBank, { rng, roundTypes: [mode] })
      if (!round) continue
      assert(validateChallengeRound(round, connectionBank).valid, `${mode} generates only valid rounds`, JSON.stringify(round).slice(0, 120))
      checked += 1
    }
  }
}

// ---------------------------------------------------------------
console.log(`\n${'='.repeat(40)}`)
if (failures === 0) {
  console.log(`ALL CHECKS PASSED (${allPuzzles.length} puzzles validated: ${dailyPuzzles.length} daily, ${systemPuzzles.length} system)\n`)
  process.exit(0)
} else {
  console.log(`${failures} CHECK(S) FAILED\n`)
  process.exit(1)
}
