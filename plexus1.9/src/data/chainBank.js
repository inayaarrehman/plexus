// ---------------------------------------------------------------------
// Chain bank — verified ORDERED physiologic/mechanistic sequences
// ---------------------------------------------------------------------
// The connection bank stores unordered 4-tile connections; it has no notion
// of sequence, and order must never be inferred from ordinary category
// membership (that would fabricate causality). So the Chain / Complete-the-
// Chain 3-Minute modes draw ONLY from this small, deliberately-curated set
// of canonical, unambiguous ordered sequences. Each is a textbook physiology
// chain a curator has verified; `steps` is the one defensible order. Kept
// intentionally small — better a handful of unambiguous chains than many
// arguable ones. Add more only when the ordering is genuinely uncontested.
//
// SCHEMA: { id, title, systems[], steps[4] (in correct order), status,
//           note }  — steps are the concept labels shown to the player,
// shuffled at round time; the array order here IS the answer.
const chainBank = [
  {
    id: 'chain-raas',
    title: 'RAAS activation',
    systems: ['Renal', 'Endocrine'],
    steps: ['↓ Renal perfusion', 'Renin release', 'Angiotensin II', 'Aldosterone secretion'],
    status: 'verified',
    note: 'Low renal perfusion drives renin → angiotensin II → aldosterone (standard RAAS simplification).',
  },
  {
    id: 'chain-baroreflex-lowbp',
    title: 'Baroreflex response to low BP',
    systems: ['Cardiology'],
    steps: ['↓ Blood pressure', '↓ Baroreceptor firing', '↑ Sympathetic outflow', '↑ Heart rate'],
    status: 'verified',
    note: 'Falling BP reduces carotid/aortic baroreceptor firing → increased sympathetic outflow → tachycardia.',
  },
  {
    id: 'chain-primary-hemostasis',
    title: 'Primary hemostasis',
    systems: ['Heme/Onc'],
    steps: ['Endothelial injury', 'Platelet adhesion (vWF)', 'Platelet activation', 'Platelet aggregation'],
    status: 'verified',
    note: 'Injury exposes subendothelium → vWF-mediated adhesion → activation → aggregation (platelet plug).',
  },
  {
    id: 'chain-hpa-axis',
    title: 'HPA axis',
    systems: ['Endocrine'],
    steps: ['Hypothalamic CRH', 'Pituitary ACTH', 'Adrenal cortisol', 'Negative feedback'],
    status: 'verified',
    note: 'CRH → ACTH → cortisol, with cortisol feeding back to suppress CRH/ACTH.',
  },
  {
    id: 'chain-b1-cascade',
    title: 'β1 adrenergic signaling',
    systems: ['Pharmacology', 'Cardiology'],
    steps: ['β1 receptor activation', 'Gs protein', '↑ cAMP', '↑ Cardiac contractility'],
    status: 'verified',
    note: 'β1 (Gs-coupled) → adenylyl cyclase → cAMP → increased inotropy (drug→receptor→signal→effect).',
  },
]

export default chainBank
