// Difficulty tiers, easiest -> trickiest. An original palette — coral,
// aqua/teal, cobalt, plum — rather than NYT's yellow/green/blue/purple.
// This is also the app's broader brand palette (homepage accents, brand
// mark, system pages), not just a difficulty code — kept in sync with the
// --difficulty-* CSS variables in styles.css.
//
// `shape` + `shapeLabel`: color is never the only signal for difficulty —
// every place that shows a difficulty color (solved banners, the result
// grid, the share text) also shows this shape/label, so the game stays
// legible for color-blind players and reads correctly as plain text when
// shared. Deliberately distinct from any color-coded-only presentation.
// Every hex below is contrast-checked at 4.5:1+ against white (the fixed
// text color used on solved banners/tiles/result squares in both light and
// dark mode, since those are always rendered as color fills, not text-on-
// page) — see styles.css's --difficulty-* root block for the matching
// values, and its dark-mode block for the separate, lighter tints used
// where a difficulty color is the TEXT color on a page background instead.
export const DIFFICULTY = [
  { level: 1, name: 'Coral', color: '#bb4c34', shape: '●', shapeLabel: 'circle' },
  { level: 2, name: 'Aqua', color: '#0f7a76', shape: '▲', shapeLabel: 'triangle' },
  { level: 3, name: 'Cobalt', color: '#3568c4', shape: '◆', shapeLabel: 'diamond' },
  { level: 4, name: 'Plum', color: '#8c4fc2', shape: '■', shapeLabel: 'square' },
]

// The full organ-system library. A system with zero puzzles today still
// shows up (as "coming soon") so the nav doesn't have to change shape as
// content is added.
export const SYSTEMS = [
  'Cardiology',
  'Pulmonary',
  'Renal',
  'Neurology',
  'GI',
  'Endocrine',
  'Heme/Onc',
  'MSK',
  'Reproductive',
  'Psychiatry',
  'Microbiology',
  'Immunology',
  'Dermatology',
  'Pharmacology',
  'Biochemistry/Genetics',
  'Mixed / Step Review',
]

export const PUZZLE_STATUS = ['draft', 'reviewed', 'published']
