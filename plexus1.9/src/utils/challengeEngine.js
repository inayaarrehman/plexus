// ---------------------------------------------------------------------
// 3-Minute Challenge — content engine
// ---------------------------------------------------------------------
// Turns the SAME verified connection-bank categories the Daily Puzzle and
// Organ System Library already use into fast, single-answer rounds. No
// separate question database, and no medicine is ever invented live: only
// `status === 'verified'` categories (and tiles/titles that already exist
// on them) are eligible. A `needs_review` category can never reach a
// challenge round.
//
// One bank category can generate several round types:
//   { title: 'Causes of elevated JVP', tiles: [4 things] }
//     -> Rapid Association : anchor "ELEVATED JVP", pick the 4 real causes
//     -> Complete the Connection : show 3 of the causes, pick the 4th
//     -> Impostor : show the 4 causes + 1 plausible non-cause, remove it
//     -> Common Link : show the 4 causes, pick "Causes of elevated JVP"
//        from a set of plausible category titles
// Mini Connections is the odd one out — it reuses TWO categories at once
// (the same `categoriesCompatible` check the main puzzle assembler uses),
// so a mini 2-group board never has an accidental second solution either.
//
// Distractors always come from OTHER verified bank tiles/titles, weighted
// toward the same organ system(s) and connection type as the anchor, so a
// wrong option is a plausible near-miss rather than an obviously-off item
// (e.g. another cardiovascular drug that does NOT prolong QT, not
// "appendicitis").
// ---------------------------------------------------------------------

import { categoriesCompatible, normalizeTile, shuffleWith } from './puzzleAssembler.js'
import { NEW_BUILDERS, validateModeRound, COGNITIVE_TASK, assessModes } from './challengeModesPlus.js'

export { COGNITIVE_TASK, assessModes }

// The four original modes plus commonLink ("Which Connection?").
export const CORE_ROUND_TYPES = ['miniConnections', 'impostor', 'rapidAssociation', 'completeConnection']

// Expanded-mode readiness mirrors the mode-quality gate (assessModes):
// READY modes enter the normal rotation; LIMITED modes (few distinct valid
// rounds today — Split has 4 curated pairs, Chain 5 curated sequences) ship
// behind this flag rather than being hidden, since each round is itself
// high-quality. Flip the flag off to restrict to READY-only.
export const INCLUDE_LIMITED_MODES = true
const READY_MODES = ['commonLink', 'matchTheLink', 'doubleAgent', 'linkTwo', 'sameOrDifferent', 'completeTheChain']
const LIMITED_MODES = ['split', 'chain']
export const ROUND_TYPES = [
  ...CORE_ROUND_TYPES,
  ...READY_MODES,
  ...(INCLUDE_LIMITED_MODES ? LIMITED_MODES : []),
]

export const BASE_POINTS = {
  miniConnections: 150, // per group (a round has 2 groups → up to 300)
  impostor: 100,
  rapidAssociation: 150,
  completeConnection: 100,
  commonLink: 125,
  matchTheLink: 150,
  split: 150,
  chain: 150,
  completeTheChain: 100,
  doubleAgent: 125,
  linkTwo: 100,
  sameOrDifferent: 60, // fast + easy → smaller reward
}

export const WRONG_PENALTY = -50
const SPEED_BONUS_MAX = 30
const SPEED_BONUS_THRESHOLD_MS = 8000

function verifiedCategories(bank) {
  return bank.filter((c) => c.status === 'verified')
}

// ---------------------------------------------------------------------
// Distractors
// ---------------------------------------------------------------------
// Candidate tiles/titles are drawn from every OTHER verified category,
// weighted higher when they share an organ system or connection type with
// the anchor (a "nearby medical concept"), then sampled from the
// higher-weight end so repeats stay varied across sessions.
function weightedCandidates(bank, anchor, { useTitles = false } = {}) {
  const anchorTileSet = new Set(anchor.tiles.map(normalizeTile))
  const others = verifiedCategories(bank).filter((c) => c.id !== anchor.id)
  const seen = new Set()
  const candidates = []

  others.forEach((c) => {
    let weight = 1
    if (c.systems.some((s) => anchor.systems.includes(s))) weight += 2
    if (c.connectionType === anchor.connectionType) weight += 1

    const values = useTitles ? [c.title] : c.tiles
    values.forEach((value) => {
      const key = normalizeTile(value)
      if (!useTitles && anchorTileSet.has(key)) return // never offer a tile that's actually correct
      if (key === normalizeTile(anchor.title)) return
      if (seen.has(key)) return
      seen.add(key)
      candidates.push({ text: value, weight })
    })
  })
  return candidates
}

// Picks `count` distractors, biased toward higher weight without being
// fully deterministic (so the same anchor doesn't always pair with the
// same wrong answers).
function pickDistractors(bank, anchor, count, rng, opts) {
  const candidates = weightedCandidates(bank, anchor, opts)
  if (candidates.length === 0) return []
  candidates.sort((a, b) => b.weight - a.weight)
  const poolSize = Math.max(count * 4, 12)
  const topSlice = candidates.slice(0, Math.min(poolSize, candidates.length))
  return shuffleWith(topSlice, rng)
    .slice(0, count)
    .map((c) => c.text)
}

// ---------------------------------------------------------------------
// Round builders — each returns null if it can't build a valid round
// (e.g. not enough distractor material), so the caller can fall back to
// another type rather than ever showing a broken round.
// ---------------------------------------------------------------------

function buildMiniConnectionsRound(bank, rng) {
  const verified = verifiedCategories(bank)
  if (verified.length < 2) return null
  for (let attempt = 0; attempt < 30; attempt++) {
    const a = verified[Math.floor(rng() * verified.length)]
    const b = verified[Math.floor(rng() * verified.length)]
    if (a.id === b.id) continue
    if (!categoriesCompatible([a, b])) continue
    const tiles = shuffleWith(
      [
        ...a.tiles.map((text) => ({ text, groupId: 'a' })),
        ...b.tiles.map((text) => ({ text, groupId: 'b' })),
      ],
      rng
    )
    return {
      type: 'miniConnections',
      prompt: 'Find two groups of four.',
      tiles,
      groups: {
        a: { categoryId: a.id, title: a.title, tag: a.title, explanation: a.explanation },
        b: { categoryId: b.id, title: b.title, tag: b.title, explanation: b.explanation },
      },
      conceptTags: [a.title, b.title],
      systems: [...new Set([...a.systems, ...b.systems])],
    }
  }
  return null
}

function buildImpostorRound(bank, rng) {
  const verified = verifiedCategories(bank)
  if (verified.length === 0) return null
  const anchor = verified[Math.floor(rng() * verified.length)]
  const [impostorText] = pickDistractors(bank, anchor, 1, rng)
  if (!impostorText) return null
  const options = shuffleWith(
    [...anchor.tiles.map((text) => ({ text, correct: false })), { text: impostorText, correct: true }],
    rng
  )
  return {
    type: 'impostor',
    prompt: 'Remove the impostor.',
    categoryId: anchor.id,
    categoryTitle: anchor.title,
    options,
    correctAnswer: impostorText,
    explanation: anchor.explanation,
    conceptTags: [anchor.title],
    systems: anchor.systems,
  }
}

function buildRapidAssociationRound(bank, rng) {
  const verified = verifiedCategories(bank)
  if (verified.length === 0) return null
  const anchor = verified[Math.floor(rng() * verified.length)]
  const distractors = pickDistractors(bank, anchor, 4, rng)
  if (distractors.length < 4) return null
  const options = shuffleWith(
    [...anchor.tiles.map((text) => ({ text, correct: true })), ...distractors.map((text) => ({ text, correct: false }))],
    rng
  )
  return {
    type: 'rapidAssociation',
    prompt: 'Select four.',
    anchor: anchor.title,
    categoryId: anchor.id,
    options,
    correctAnswers: anchor.tiles.slice(),
    explanation: anchor.explanation,
    conceptTags: [anchor.title],
    systems: anchor.systems,
  }
}

function buildCompleteConnectionRound(bank, rng) {
  const verified = verifiedCategories(bank)
  if (verified.length === 0) return null
  const anchor = verified[Math.floor(rng() * verified.length)]
  const shownIndex = Math.floor(rng() * anchor.tiles.length)
  const missing = anchor.tiles[shownIndex]
  const shown = anchor.tiles.filter((_, i) => i !== shownIndex)
  const distractors = pickDistractors(bank, anchor, 3, rng)
  if (distractors.length < 3) return null
  const options = shuffleWith(
    [{ text: missing, correct: true }, ...distractors.map((text) => ({ text, correct: false }))],
    rng
  )
  return {
    type: 'completeConnection',
    prompt: 'Complete the connection.',
    shown,
    categoryId: anchor.id,
    categoryTitle: anchor.title,
    options,
    correctAnswer: missing,
    explanation: anchor.explanation,
    conceptTags: [anchor.title],
    systems: anchor.systems,
  }
}

// The reverse of Rapid Association: four tiles are shown, the player picks
// the category title that links them from a set of plausible alternatives.
function buildCommonLinkRound(bank, rng) {
  const verified = verifiedCategories(bank)
  if (verified.length === 0) return null
  const anchor = verified[Math.floor(rng() * verified.length)]
  const distractorTitles = pickDistractors(bank, anchor, 3, rng, { useTitles: true })
  if (distractorTitles.length < 3) return null
  const options = shuffleWith(
    [{ text: anchor.title, correct: true }, ...distractorTitles.map((text) => ({ text, correct: false }))],
    rng
  )
  return {
    type: 'commonLink',
    prompt: 'What links these?',
    shown: anchor.tiles.slice(),
    categoryId: anchor.id,
    options,
    correctAnswer: anchor.title,
    explanation: anchor.explanation,
    conceptTags: [anchor.title],
    systems: anchor.systems,
  }
}

const BUILDERS = {
  miniConnections: buildMiniConnectionsRound,
  impostor: buildImpostorRound,
  rapidAssociation: buildRapidAssociationRound,
  completeConnection: buildCompleteConnectionRound,
  commonLink: buildCommonLinkRound,
  ...NEW_BUILDERS,
}

// ---------------------------------------------------------------------
// Round-level validation (Sections 9–13, 23)
// ---------------------------------------------------------------------
// A verified source category does NOT guarantee a valid ROUND: the specific
// transformation (which tiles are shown, what the distractors/impostor are)
// can still be ambiguous or unfair. Every generated round must pass its
// format-specific check before it can enter play — only rounds marked
// `roundValidationStatus: 'valid'` are ever shown. Reasons are returned so
// the audit can report why rounds were rejected.
function bankIndex(bank) {
  const m = new Map()
  for (const c of bank) m.set(c.id, c)
  return m
}
const lower = (s) => String(s).toLowerCase()
const uniqueTexts = (opts) => new Set(opts.map((o) => lower(o.text))).size === opts.length

export function validateRound(round, bank) {
  if (!round) return { valid: false, reason: 'no round' }
  // Expanded modes carry their own strict validation.
  if (round.type in NEW_BUILDERS) return validateModeRound(round, bank)
  const idx = bankIndex(bank)

  if (round.type === 'miniConnections') {
    const a = idx.get(round.groups?.a?.categoryId)
    const b = idx.get(round.groups?.b?.categoryId)
    if (!a || !b) return { valid: false, reason: 'mini: missing source category' }
    if (lower(a.title) === lower(b.title)) return { valid: false, reason: 'mini: identical category titles' }
    // Near-synonymous groups create an ambiguous board — reject.
    const sharedTags = (a.tags || []).map(lower).filter((t) => (b.tags || []).map(lower).includes(t)).length
    if (sharedTags >= 2) return { valid: false, reason: 'mini: near-synonymous groups (shared defining tags)' }
    if (round.tiles.length !== 8) return { valid: false, reason: 'mini: expected 8 tiles' }
    const distinct = new Set(round.tiles.map((t) => lower(t.text))).size === 8
    if (!distinct) return { valid: false, reason: 'mini: duplicate tile across groups' }
    return { valid: true }
  }

  if (round.type === 'impostor') {
    if (!Array.isArray(round.options) || round.options.length !== 5) return { valid: false, reason: 'impostor: expected 5 options' }
    if (round.options.filter((o) => o.correct).length !== 1) return { valid: false, reason: 'impostor: must have exactly one impostor' }
    if (!uniqueTexts(round.options)) return { valid: false, reason: 'impostor: duplicate option text' }
    const anchor = idx.get(round.categoryId)
    // The impostor must not actually be a member of the anchor category.
    if (anchor && anchor.tiles.map(lower).includes(lower(round.correctAnswer))) {
      return { valid: false, reason: 'impostor: distractor is genuinely a member (ambiguous)' }
    }
    return { valid: true }
  }

  if (round.type === 'rapidAssociation') {
    if (!Array.isArray(round.options) || round.options.length !== 8) return { valid: false, reason: 'rapid: expected 8 options' }
    if (round.options.filter((o) => o.correct).length !== 4) return { valid: false, reason: 'rapid: expected exactly 4 correct' }
    if (!uniqueTexts(round.options)) return { valid: false, reason: 'rapid: duplicate option text' }
    // No distractor may also be a genuine member of the anchor.
    const correctSet = new Set((round.correctAnswers || []).map(lower))
    const distractorAlsoCorrect = round.options.some((o) => !o.correct && correctSet.has(lower(o.text)))
    if (distractorAlsoCorrect) return { valid: false, reason: 'rapid: a distractor is also a correct association (ambiguous)' }
    return { valid: true }
  }

  if (round.type === 'completeConnection') {
    if (!Array.isArray(round.options) || round.options.length !== 4) return { valid: false, reason: 'complete: expected 4 options' }
    if (round.options.filter((o) => o.correct).length !== 1) return { valid: false, reason: 'complete: expected exactly one answer' }
    if (!uniqueTexts(round.options)) return { valid: false, reason: 'complete: duplicate option text' }
    // The correct answer must not also appear among the shown members.
    if ((round.shown || []).map(lower).includes(lower(round.correctAnswer))) {
      return { valid: false, reason: 'complete: answer already shown' }
    }
    return { valid: true }
  }

  if (round.type === 'commonLink') {
    if (!Array.isArray(round.options) || round.options.length !== 4) return { valid: false, reason: 'commonLink: expected 4 options' }
    if (round.options.filter((o) => o.correct).length !== 1) return { valid: false, reason: 'commonLink: expected one correct title' }
    if (!uniqueTexts(round.options)) return { valid: false, reason: 'commonLink: duplicate title option' }
    return { valid: true }
  }

  return { valid: false, reason: `unknown round type "${round.type}"` }
}

// Builds one round, rotating round TYPE so the same format doesn't repeat
// back-to-back-to-back. `roundTypes` lets a caller restrict to the 4
// required modes (default includes the optional 5th, Common Link).
// `avoidType` (usually the previous round's type) is skipped on the first
// attempt for variety, but every type is tried before giving up.
export function generateRound(bank, { rng = Math.random, roundTypes = ROUND_TYPES, avoidType = null } = {}) {
  const ordered = shuffleWith(roundTypes, rng)
  const tryOrder = avoidType ? [...ordered.filter((t) => t !== avoidType), avoidType] : ordered
  for (const type of tryOrder) {
    const builder = BUILDERS[type]
    if (!builder) continue
    // Try a few times per type: a builder may produce an ambiguous round
    // (rejected by validateRound) that a re-roll fixes, before we fall
    // through to another type.
    for (let k = 0; k < 6; k++) {
      const round = builder(bank, rng)
      if (!round) break
      const check = validateRound(round, bank)
      if (check.valid) {
        round.roundValidationStatus = 'valid'
        return round
      }
    }
  }
  return null
}

// ---------------------------------------------------------------------
// 3-Minute session composer (Section 14)
// ---------------------------------------------------------------------
// The shorter mode makes pacing matter more. Rather than a purely random
// next round, pick the next VALID round that differs most from what was
// just shown — avoiding back-to-back repetition of format, organ system,
// archetype/concept and dominant category. `recent` carries the last few
// rounds' { type, systems, conceptTags }. Bounded work, so it stays cheap
// enough to call between every round on mobile.
export function composeNextRound(bank, { rng = Math.random, roundTypes = ROUND_TYPES, recent = [] } = {}) {
  const lastType = recent[0]?.type || null
  const lastTask = recent[0]?.type ? COGNITIVE_TASK[recent[0].type] : null
  const recentSystems = new Set(recent.slice(0, 2).flatMap((r) => r.systems || []))
  const recentConcepts = new Set(recent.slice(0, 2).flatMap((r) => (r.conceptTags || []).map((t) => String(t).toLowerCase())))

  let best = null
  for (let attempt = 0; attempt < 10; attempt++) {
    const round = generateRound(bank, { rng, roundTypes, avoidType: lastType })
    if (!round) continue
    let penalty = 0
    if ((round.systems || []).some((s) => recentSystems.has(s))) penalty += 2
    if ((round.conceptTags || []).some((t) => recentConcepts.has(String(t).toLowerCase()))) penalty += 3
    if (round.type === lastType) penalty += 4
    // Vary the KIND of thinking too, so two different modes that ask for the
    // same cognitive task (e.g. Which Connection then Match the Link) don't
    // run back-to-back (Section 32).
    if (lastTask && COGNITIVE_TASK[round.type] === lastTask) penalty += 3
    if (penalty === 0) return round
    if (!best || penalty < best.penalty) best = { round, penalty }
  }
  return best ? best.round : generateRound(bank, { rng, roundTypes, avoidType: lastType })
}

// ---------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------

export function getMultiplier(consecutiveCorrect) {
  if (consecutiveCorrect >= 4) return 1.3
  if (consecutiveCorrect === 3) return 1.2
  if (consecutiveCorrect === 2) return 1.1
  return 1
}

export function speedBonus(responseMs) {
  if (typeof responseMs !== 'number' || responseMs >= SPEED_BONUS_THRESHOLD_MS) return 0
  return Math.round(SPEED_BONUS_MAX * (1 - responseMs / SPEED_BONUS_THRESHOLD_MS))
}

// Points for one correct/incorrect action. `basePoints` should be
// BASE_POINTS[roundType] (or half of it for one of Mini Connections' two
// groups — see Challenge.jsx). Incorrect answers always cost a flat
// penalty, unaffected by multiplier or speed.
export function computeActionPoints({ correct, basePoints, multiplier = 1, responseMs }) {
  if (!correct) return WRONG_PENALTY
  const bonus = speedBonus(responseMs)
  return Math.round((basePoints + bonus) * multiplier)
}
