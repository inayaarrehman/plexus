// The completion moment's short phrase (Section 2 of the polish spec):
// deliberately understated, never "Amazing!!!"/"You're a genius!"-style
// praise. Rotates among a small fixed set so it doesn't feel scripted,
// chosen deterministically from the puzzle id so the same puzzle always
// shows the same phrase (useful for tests and for not feeling random on a
// replay/reopen), except a perfect (zero-mistake) solve always gets its
// own distinct phrase regardless of rotation.
const PHRASES = ['Connected.', 'All four linked.', 'Clean solve.', "That's the connection.", 'Network complete.']
const PERFECT_PHRASE = 'Perfectly connected.'

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function getCompletionPhrase({ puzzleId, mistakes }) {
  if (mistakes === 0) return PERFECT_PHRASE
  const idx = hashString(String(puzzleId || '')) % PHRASES.length
  return PHRASES[idx]
}

export { PHRASES, PERFECT_PHRASE }
