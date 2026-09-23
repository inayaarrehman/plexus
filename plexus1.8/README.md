# Medical Connections

A NYT Connections-style daily puzzle game for medical professionals. Find the hidden
clinical relationship linking four terms out of a 4x4 grid of sixteen — easiest
category is yellow, trickiest is purple, same as the original.

Built with React + Vite. No backend — everything runs client-side, with
localStorage used for stats and progress, structured so it can migrate to a
real backend (e.g. Supabase) later without a UI rewrite.

## Features

- **Daily Puzzle**, the centerpiece: the same puzzle for everyone on a given
  calendar date, with 4 difficulty tiers (yellow/green/blue/purple) hidden
  until solved, 4 mistakes allowed, "one away" hints, and shuffle/deselect.
- **Post-puzzle review**: after finishing, see your result grid, streak
  (with milestone emphasis at 7/30/50/100 days), and a **Review Connections**
  panel — tap any category to see why each of its four terms belongs, plus a
  one-line "Remember this" takeaway. Share button copies a spoiler-free,
  Wordle-style emoji grid.
- **Archive**: a rolling 30-day list of past Daily Puzzles. Completed days
  reopen in review mode (not replayable); missed days are still playable.
  Unlocks once today's Daily is complete.
- **Systems Library**: unlimited, replayable puzzles organized by 16 named
  organ systems (Cardiology, Pulmonary, Renal, Neurology, GI, Endocrine,
  Heme/Onc, MSK, Reproductive, Psychiatry, Microbiology, Immunology,
  Dermatology, Pharmacology, Biochemistry/Genetics, Mixed/Step Review), each
  tracking attempts/completions/accuracy. Also unlocks once today's Daily is
  complete.
- **Continue Studying**: the homepage remembers the last system you played
  and offers a one-tap "Continue {System} →" straight to your next
  uncompleted puzzle in it.
- **Weak Spot data collection** (data only, no UI yet): every puzzle attempt
  quietly logs which concepts (category titles) were missed vs. solved, so a
  future personalized "Weak Spots" mode has real data to work from.
- **Medical Connection Bank + puzzle assembler**: a reusable content layer of
  49 individually-authored connection categories (15 easy / 16 medium / 11
  hard / 7 expert), each tagged with organ system(s), a "connection type"
  (knowledge, mechanism, language, meta-wordplay, cross-system, etc.), concept
  tags, and a verification status. A puzzle **assembler** combines 4
  compatible (tile-text-unique) categories — one per difficulty — into a
  playable puzzle, favoring combinations that mix connection types and
  systems rather than repeating "causes of X/Y/Z/W" four times in a row. See
  [Connection Bank & Assembler](#connection-bank--puzzle-assembler) below.
- 28 published puzzles today (3 Daily + 19 hand-written Systems Library + 6
  bank-assembled "Pattern Recognition" puzzles) — spanning cardiology,
  pulmonology, renal, neurology, pharmacology, immunology, micro, heme/onc,
  genetics, embryology, and classic eponyms/wordplay.
- **Dev Viewer** — an internal-only route at `#dev` (e.g. `yoursite.com/#dev`)
  with two tabs: **Puzzles** (every playable puzzle with full metadata, run
  through the same validator as the test suite, plus paste-JSON-to-preview)
  and **Connection Bank** (every raw category — title, difficulty, tiles,
  systems, connection type, tags, verification status — filterable by status
  and difficulty, plus paste-JSON-to-validate a new category). Not linked
  from anywhere in the app's normal navigation.

### Explicitly deferred (by design, not oversight)

Per the product plan's phased rollout, these are intentionally **not**
built yet and appear only as tasteful "Coming Soon" cards on the homepage:
5-Minute Challenge, and a user-facing Weak Spots mode (its data collection
*is* live, see above). Also not built: global leaderboards, social
accounts/friends, achievements/badges, and AI puzzle generation.

## Data model

Puzzles live in `src/data/` as plain JS objects, one per puzzle, shaped to
map cleanly onto a future database table (e.g. one Supabase row per puzzle,
with `categories` as JSONB):

```js
{
  id: 'daily-0001',            // unique id
  number: 1,                   // puzzle number
  type: 'daily' | 'system',
  date: '2026-09-17' | null,   // set only for type: 'daily'
  title: 'Classic Signs & Associations',
  systems: ['Cardiology'],     // one or more of the 15 named systems
  topicTags: ['eponyms', 'associations'],
  status: 'draft' | 'reviewed' | 'published',
  source: 'Internal question bank — board-review style',
  categories: [                // exactly 4, levels 1-4 used once each
    {
      level: 1,                // 1=yellow (easiest) ... 4=purple (hardest)
      title: 'Hidden connection name',
      explanation: 'Why these four belong together.',
      remember: 'One high-yield takeaway sentence.',
      items: [                 // exactly 4
        { term: 'Shown on the tile', why: 'One-line rationale for the Review panel.' },
        // ...
      ],
    },
    // ... 3 more categories
  ],
}
```

`src/data/dailyPuzzles.js` and `src/data/systemPuzzles.js` hold the actual
content; `src/data/constants.js` holds the difficulty/system/status enums;
`src/puzzles.js` aggregates them and exposes `getPuzzleById`,
`getPublishedPuzzles`, and `validatePuzzle` (checks id/type/date rules,
systems against the known list, 4x4 category/item shape, unique levels,
and 16 unique item terms).

`src/utils/dailyPuzzle.js` resolves "today's puzzle": it looks for an
explicit `daily-*` entry matching today's date, and falls back to a
deterministic day-number rotation through published dailies if none exists
— so the game never breaks even before new dailies are authored ahead of
time.

`src/utils/storage.js` holds all localStorage-backed persistence: overall
stats/streak, per-puzzle-instance progress (survives refresh), Daily
History (powers the Archive), System Library progress, and Weak Spot data.
Every function is small and pure enough to swap for real API calls later
without touching any component.

## Run locally

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the repo.
3. Vercel auto-detects the Vite framework preset (build command
   `npm run build`, output directory `dist` — also pinned in `vercel.json`).
4. Deploy. No environment variables are required.

## Connection Bank & Puzzle Assembler

Most new content should go through the **connection bank**
(`src/data/connectionBank.js`) rather than being hand-written directly as a
puzzle. The bank holds individual 4-tile "categories" with no knowledge of
which other categories they'll ever be paired with — the **assembler**
(`src/utils/puzzleAssembler.js`) is what turns 4 compatible categories (one
per difficulty) into an actual playable puzzle. This is what lets the bank
grow to hundreds of categories without ever touching game logic or UI.

**Bank category schema:**

```js
{
  id: 'bank-expert-05',
  title: 'Elevated because the target tissue is resistant, not because more is needed',
  tiles: ['Insulin resistance', 'Pseudohypoparathyroidism', 'Leptin resistance (obesity)', 'Nephrogenic diabetes insipidus'],
  difficulty: 'expert',                 // easy | medium | hard | expert
  systems: ['Endocrine'],               // 1+, from the SYSTEMS list in constants.js
  connectionType: 'mechanism',          // see CONNECTION_TYPES in connectionBank.js
  explanation: 'In each, a signaling hormone is elevated not from oversecretion but because its target tissue fails to respond normally...',
  tileExplanations: ['...', '...', '...', '...'],   // exactly 4, parallel to tiles
  remember: 'A high hormone level does not always mean oversecretion — sometimes the target simply will not listen.',
  tags: ['hormone-resistance', 'endocrine-feedback'],   // concept tags (Weak Spot tracking)
  overlapTags: ['hypocalcemia'],        // optional — concepts that could tempt a false grouping
  status: 'verified',                   // verified | needs_review | rejected
}
```

To add a category: append an object like the above to `connectionBank.js`,
set `status: 'needs_review'` if you're not fully confident in it yet (it
stays in the bank either way — nothing is deleted for being unverified), and
validate it either with the Dev Viewer's **Connection Bank** tab
(paste-JSON-to-validate box) or programmatically via `validateBankCategory`.
Only `verified` categories are ever eligible for auto-generation or the
Daily Puzzle.

**Generating playable puzzles from the bank:**

```bash
node scripts/assemblePuzzles.mjs
```

This reads all `verified` bank categories, picks one per difficulty tier for
each generated puzzle (rejecting any combination that shares tile text —
see "why a puzzle only has one solution" below), scores candidate
combinations internally to prefer connection-type/system diversity over
repeating a pattern, and writes the result to `src/data/generatedPuzzles.js`
(auto-generated — don't hand-edit it). That file is wired into
`src/puzzles.js` exactly like `systemPuzzles.js`, so generated puzzles show
up in the Systems Library automatically, with zero UI changes. It's seeded
(`SEED` constant in the script) so re-running it without bank changes
reproduces the same puzzle set — useful when you want to review a
regeneration before shipping it.

**Why every generated puzzle has exactly one solution:** each tile is a
plain string owned by exactly one bank category. As long as the 4 categories
picked for one puzzle don't repeat any tile text (checked automatically),
every one of the 16 tiles maps to exactly one category — so there's only one
way to fully partition the board. Real-world overlap between categories
(e.g. Sarcoidosis being a cause of both noncaseating granulomas *and*
hypercalcemia *and* restrictive lung disease — three different bank
categories) is what makes a wrong grouping *tempting*, not what makes the
puzzle ambiguous, since only one of those categories' tiles is ever in play
at a time.

## Adding new puzzles directly (bypassing the bank)

For a puzzle that doesn't fit the "4 independent categories" mold — like the
hand-curated Daily Puzzles — add an object directly to
`src/data/dailyPuzzles.js` (give it a `date`) or `src/data/systemPuzzles.js`
(leave `date: null`, set `systems`), following the data model above. Set
`status: 'draft'` while authoring — only `'published'` puzzles are ever
served to players — and use the Dev Viewer's **Puzzles** tab (`#dev`) to
check it renders correctly and passes `validatePuzzle` before flipping it to
`'reviewed'` then `'published'`.

Puzzle-design rules worth keeping in mind:

- Intentional ambiguity is fine — a tile can plausibly fit more than one
  category — but there must be exactly **one** full 16-tile solution.
- Never let a wrong guess reveal which other category a tile actually
  belongs to (the UI only ever says "one away" or shows nothing extra).
- Prefer clever, non-obvious connections for blue/purple over obscure
  trivia.

## Self-test

Two headless test scripts back this project — no browser required:

- `scripts/selftest.mjs` validates every playable puzzle (structure, exactly
  4x4 categories/items, no duplicate item text, unique ids, valid systems),
  the connection bank (every category's structural validity, difficulty/
  status/connectionType enums, and that `needs_review` content is flagged
  rather than deleted), the assembler (tile-compatibility detection,
  puzzle assembly + validation, deterministic/reproducible generation from a
  fixed seed, and that `needs_review` categories are never auto-generated),
  the core game logic (matching, "one away" detection, mistake counting,
  shuffling), daily-puzzle resolution (`getDailyPuzzleForDate`, rotation
  fallback, future-date guarding), and the storage layer (stats, the
  streak-gaming-prevention flag, Daily History, System progress, Weak Spots).
- `scripts/render-smoketest.mjs` server-renders every component (Home, Game
  — once per puzzle including pre-seeded win/loss/already-completed states,
  Archive, Systems, DevViewer, ReviewConnections, HowToModal, StatsModal,
  Confetti) with `react-dom/server` to catch any JSX/runtime errors before
  they'd ever hit a browser.

Run both with:

```bash
npm run test
```

(`npm install` first if you haven't — `test:render` uses `tsx`, listed as a
devDependency.)

### A note on how these were run during development

This project was built in a sandboxed environment without access to the
npm package registry, so a real `npm install && vite build` couldn't be
run here. Both test scripts were instead run using globally pre-installed
`react`/`react-dom` plus the `tsx` CLI, calling `react-dom/server`'s
`renderToStaticMarkup` directly. That's a solid proxy for "does every
component render without throwing," but it is **not** a substitute for
an actual Vite build. On any normal machine or CI with registry access,
just run `npm install && npm run build` (or `npm run dev`) — everything
here is a standard Vite + React app with no special setup required.
