// Haptic language (Section 15). Additive, optional, and never required to
// understand gameplay: uses the standard navigator.vibrate API where the
// device supports it and is a silent no-op everywhere else (desktop, iOS
// Safari, vibration disabled). It also stands down under prefers-reduced-
// motion, a reasonable proxy for "minimize non-essential feedback." No
// audio is played and nothing is bundled — this is purely the tactile
// foundation the spec asked for.
function canVibrate() {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  try {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false
    }
  } catch {
    // matchMedia unavailable — fall through and allow.
  }
  return true
}

function buzz(pattern) {
  if (!canVibrate()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    // ignore — haptics are best-effort
  }
}

export const haptics = {
  select: () => buzz(8), // tile selected — very light
  correct: () => buzz([0, 16, 45, 10]), // connection formed — slightly firmer, two-beat
  incorrect: () => buzz([0, 28, 26, 28]), // connection broken — short, distinct double
  // Puzzle complete — a subtle two-part pattern echoing the Plexus mark
  // completing (nodes arrive, then the network resolves).
  complete: () => buzz([0, 22, 70, 18, 40, 34]),
}
