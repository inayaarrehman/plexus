// Deterministic per-system "Plexus topology" (Systems redesign, spec §7–10).
// Every medical system gets its own tiny abstract node/path network —
// 4–7 nodes joined by 3–7 paths — generated purely from the system's NAME,
// so Cardiology always looks like Cardiology and Renal always looks like
// Renal, stable across renders and sessions. It is an ABSTRACT identity,
// not a picture of the organ, and it is seeded from the name alone — never
// from category contents, counts or progress — so it can't encode a clue.
//
// Progress is layered on top at render time (§9): the same geometry is
// drawn, but a fraction of its nodes/paths "resolve" (fill + strengthen) in
// proportion to the system's real X/Y. The generator here is pure geometry;
// resolveTopology() maps a 0..1 fraction onto which nodes/links are on.

// FNV-1a string hash → 32-bit unsigned (same primitive as puzzleSignature).
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

// Seeded Fisher–Yates → a stable permutation of [0..n).
function seededOrder(n, rnd) {
  const arr = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Returns { nodes: [{x,y}], links: [[i,j]], order: [nodeIdx...] } in a
// 0..100 viewBox. `order` is the deterministic sequence in which nodes
// resolve as progress climbs — so the network fills the same way every
// time. Geometry is a loose, asymmetric little mesh: recognisably a
// network, never a legible diagram or an organ silhouette.
export function systemTopology(name) {
  const rnd = mulberry32(hashSeed(name))
  const nodeCount = 4 + Math.floor(rnd() * 4) // 4–7
  const cx = 50
  const cy = 50
  const nodes = []
  // One node may sit near the middle for variety; the rest form a jittered
  // loose ring at varied radii so no two systems share a silhouette.
  const hasCore = rnd() > 0.45
  for (let i = 0; i < nodeCount; i++) {
    if (i === 0 && hasCore) {
      nodes.push({ x: cx + (rnd() - 0.5) * 14, y: cy + (rnd() - 0.5) * 14 })
      continue
    }
    const ringIdx = hasCore ? i - 1 : i
    const ringN = hasCore ? nodeCount - 1 : nodeCount
    const ang = (ringIdx / ringN) * Math.PI * 2 + (rnd() - 0.5) * 1.0
    const rad = 24 + rnd() * 16
    nodes.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad })
  }

  // Base path threads the nodes (n-1 links → 3–6), then a couple of seeded
  // chords add cross-connections, capped so total links stay within 3–7.
  const links = []
  for (let i = 0; i < nodeCount - 1; i++) links.push([i, i + 1])
  const maxLinks = 7
  let chords = 1 + Math.floor(rnd() * 2)
  while (chords-- > 0 && links.length < maxLinks) {
    const a = Math.floor(rnd() * nodeCount)
    let b = Math.floor(rnd() * nodeCount)
    if (b === a) b = (b + 1) % nodeCount
    const dup = links.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
    if (!dup) links.push([a, b])
  }

  const order = seededOrder(nodeCount, rnd)
  return { nodes, links, order }
}

// Map a real progress fraction (0..1) onto the topology's visual state.
// Returns a Set of resolved node indices and a predicate for links (a link
// resolves once BOTH its endpoints have resolved — so the network visibly
// strengthens as more nodes come online). `empty` (Coming Soon) resolves
// nothing. Fraction is derived from the system's real X/Y upstream, never
// hard-coded, and one topology node does NOT equal one connection (§10).
export function resolveTopology(topology, fraction, { empty = false } = {}) {
  const n = topology.nodes.length
  let resolvedCount
  if (empty || fraction <= 0) {
    resolvedCount = 0
  } else if (fraction >= 1) {
    resolvedCount = n
  } else {
    resolvedCount = Math.round(fraction * n)
    if (resolvedCount === 0) resolvedCount = 1 // any progress lights ≥1 node
    if (resolvedCount === n) resolvedCount = n - 1 // full mesh only at 100%
  }
  const resolved = new Set(topology.order.slice(0, resolvedCount))
  const isNodeOn = (i) => resolved.has(i)
  const isLinkOn = ([a, b]) => resolved.has(a) && resolved.has(b)
  return { resolvedCount, isNodeOn, isLinkOn, complete: !empty && fraction >= 1 }
}
