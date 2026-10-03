// Deterministic "Puzzle Signature" geometry (Section 4). Every Daily gets
// its own tiny abstract node/path arrangement, generated purely from a
// seed string (the puzzle id) so puzzle 042 always looks the same and 043
// looks different. It is DECORATIVE ONLY: the geometry is seeded from the
// id alone, never from category contents, tile membership or difficulty,
// so it cannot encode a clue or reveal puzzle structure. Two states share
// the same node positions — "unresolved" (loose nodes, no paths) and
// "resolved" (the same nodes, now connected) — which is what lets a
// signature tell the unconnected→connected story wherever it appears
// (header, results, history, share, archive). Geometry is computed here;
// rendering lives in components/PuzzleSignature.jsx.

// FNV-1a string hash → 32-bit unsigned.
function hashSeed(str) {
  let h = 2166136261 >>> 0
  const s = String(str || 'plexus')
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// mulberry32 PRNG — small, fast, deterministic from a 32-bit seed.
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Returns { nodes: [{x,y}], links: [[i,j], ...] } in a 0..80 viewBox.
// `nodeCount` is fixed (default 6) and unrelated to the four categories,
// on purpose — nothing here maps back to the puzzle's real structure.
export function puzzleSignature(seedStr, { nodeCount = 6 } = {}) {
  const rnd = mulberry32(hashSeed(seedStr))
  const cx = 40
  const cy = 40
  const nodes = []
  for (let i = 0; i < nodeCount; i++) {
    const ang = (i / nodeCount) * Math.PI * 2 + (rnd() - 0.5) * 0.9
    const rad = 22 + rnd() * 12
    nodes.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad })
  }
  // A connected ring plus a couple of seeded chords — enough to read as a
  // small network without ever looking like a legible diagram.
  const links = []
  for (let i = 0; i < nodeCount; i++) links.push([i, (i + 1) % nodeCount])
  const chordCount = 2 + Math.floor(rnd() * 2)
  for (let k = 0; k < chordCount; k++) {
    const a = Math.floor(rnd() * nodeCount)
    let b = Math.floor(rnd() * nodeCount)
    if (b === a) b = (b + 1) % nodeCount
    links.push([a, b])
  }
  return { nodes, links }
}
