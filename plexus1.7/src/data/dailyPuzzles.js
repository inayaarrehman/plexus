// Daily Puzzles: one authored puzzle per calendar date. Everyone who opens
// the app on a given date gets the puzzle whose `date` matches (see
// src/utils/dailyPuzzle.js for the lookup + fallback rotation for dates
// that don't have an explicit entry yet — e.g. tomorrow, until more are
// authored).
//
// In a real backend this file becomes one row per date in a `daily_puzzles`
// table; the shape here is designed to map onto that directly.

const dailyPuzzles = [
  {
    id: 'daily-0001',
    number: 1,
    type: 'daily',
    date: '2026-09-17',
    title: 'Classic Signs & Associations',
    systems: ['Mixed / Step Review'],
    topicTags: ['JVP', 'HLA associations', 'QT prolongation', 'granulomas'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of elevated JVP',
        explanation:
          "Anything that backs blood up into the right atrium — pump failure, valve failure, or a pericardium that won't let the heart fill — shows up as a distended neck vein.",
        remember: 'Elevated JVP = something is stopping blood from getting into (or through) the right heart.',
        items: [
          { term: 'Right heart failure', why: 'Systemic venous congestion backs up into the jugular veins.' },
          { term: 'Tricuspid regurgitation', why: 'Blood regurgitates into the right atrium, raising venous pressure.' },
          { term: 'Cardiac tamponade', why: 'Pericardial fluid restricts right-sided filling, raising venous pressure.' },
          { term: 'Constrictive pericarditis', why: 'A rigid pericardium limits diastolic filling, raising venous pressure.' },
        ],
      },
      {
        level: 2,
        title: 'HLA-associated diseases',
        explanation:
          'Each of these autoimmune/immune-mediated conditions has a well-known HLA allele association that shows up constantly on exams.',
        remember: 'HLA associations are board-favorite pairings — B27, DQ2/8, DR3/4, and DQB1*06:02 are the ones to know.',
        items: [
          { term: 'Ankylosing spondylitis', why: 'Strongly linked to HLA-B27.' },
          { term: 'Celiac disease', why: 'Linked to HLA-DQ2/DQ8.' },
          { term: 'Type 1 diabetes', why: 'Linked to HLA-DR3/DR4.' },
          { term: 'Narcolepsy', why: 'Linked to HLA-DQB1*06:02.' },
        ],
      },
      {
        level: 3,
        title: 'Prolong the QT interval',
        explanation:
          'All four slow ventricular repolarization — through drugs, electrolytes, or inherited channel defects — and share the same downstream risk: torsades de pointes.',
        remember: 'Anything that delays repolarization (drug, lyte, or gene) prolongs QT and risks torsades.',
        items: [
          { term: 'Amiodarone', why: 'A class III antiarrhythmic that blocks potassium channels, prolonging repolarization.' },
          { term: 'Hypokalemia', why: 'Low potassium delays repolarization.' },
          { term: 'Methadone', why: 'Blocks the cardiac hERG potassium channel.' },
          { term: 'Congenital long QT syndrome', why: 'Inherited ion channel mutations delay repolarization.' },
        ],
      },
      {
        level: 4,
        title: 'Diseases with granulomas',
        explanation:
          "Granulomas are the immune system's way of walling off something it can't clear — an organism, foreign material, or in autoimmune disease, itself.",
        remember: 'Granulomas are not just TB — sarcoid, Crohn, and GPA all wall things off too.',
        items: [
          { term: 'Sarcoidosis', why: 'Non-caseating granulomas, classically pulmonary/hilar.' },
          { term: 'Tuberculosis', why: 'Caseating granulomas containing acid-fast bacilli.' },
          { term: 'Crohn disease', why: 'Non-caseating granulomas anywhere along the GI tract.' },
          { term: 'Granulomatosis with polyangiitis', why: 'Necrotizing granulomas of the respiratory tract and kidneys.' },
        ],
      },
    ],
  },
  {
    id: 'daily-0002',
    number: 2,
    type: 'daily',
    date: '2026-09-18',
    title: 'Eponyms & Animals',
    systems: ['Mixed / Step Review'],
    topicTags: ['inclusion bodies', 'portal system', 'wordplay'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Descriptor involves an animal',
        explanation:
          'Medicine borrows animal imagery whenever a finding looks like one — an odd but effective way to remember a distinctive exam or pathology finding.',
        remember: 'When a finding gets an animal nickname, picture the animal — it usually nails the finding.',
        items: [
          { term: 'Butterfly rash', why: 'The malar rash of lupus, shaped like a butterfly across the cheeks and nose.' },
          { term: 'Buffalo hump', why: 'Dorsocervical fat pad of Cushing syndrome.' },
          { term: "Owl's eye inclusions", why: "CMV-infected cells show a large owl's-eye intranuclear inclusion." },
          { term: 'Elephantiasis', why: "Chronic lymphatic filariasis causes massive limb swelling resembling an elephant's leg." },
        ],
      },
      {
        level: 2,
        title: '"___ bodies" (eponymous inclusions)',
        explanation:
          'Pathologists love naming inclusion bodies after whoever first described them — each is a microscopic signature of one specific disease.',
        remember: "A named 'body' on a slide is shorthand for one disease — learn the pairing, not the person.",
        items: [
          { term: 'Lewy', why: 'Alpha-synuclein inclusions in Parkinson disease and Lewy body dementia.' },
          { term: 'Aschoff', why: 'Granulomas found in the myocardium in rheumatic fever.' },
          { term: 'Councilman', why: 'Apoptotic hepatocytes seen in viral hepatitis and yellow fever.' },
          { term: 'Negri', why: 'Cytoplasmic inclusions in neurons infected with rabies virus.' },
        ],
      },
      {
        level: 3,
        title: 'Portal ___',
        explanation:
          "'Portal' describes the liver's unique blood-supply system — a second capillary bed between two veins — and everything downstream of it when that system backs up.",
        remember: "'Portal' always points back to blood flowing gut to liver, and what happens when that flow is blocked.",
        items: [
          { term: 'Hypertension', why: 'Elevated pressure in the portal venous system, usually from cirrhosis.' },
          { term: 'Vein', why: 'Carries nutrient-rich blood from the gut to the liver.' },
          { term: 'Triad', why: 'Portal vein, hepatic artery, and bile duct traveling together at the liver edge.' },
          { term: 'Hypertensive gastropathy', why: "Mucosal congestion from portal hypertension, causing a 'snakeskin' stomach lining." },
        ],
      },
      {
        level: 4,
        title: 'Starts with "hyper" but causes a LOW value',
        explanation:
          "Each condition's name describes what's overactive — the hormone, drive, or process — not the lab value that results from it.",
        remember: "Don't let the prefix fool you — 'hyper-' describes the driver, not always the number it produces.",
        items: [
          { term: 'Hyperventilation', why: 'Blowing off CO2 faster than it is produced causes hypocapnia.' },
          { term: 'Hyperparathyroidism', why: 'Excess PTH increases renal phosphate wasting, causing hypophosphatemia.' },
          { term: 'Hyperaldosteronism', why: 'Excess aldosterone drives renal potassium wasting, causing hypokalemia.' },
          { term: 'Hyperinsulinemia', why: 'Excess insulin drives cellular glucose uptake, causing hypoglycemia.' },
        ],
      },
    ],
  },
  {
    id: 'daily-0003',
    number: 3,
    type: 'daily',
    date: '2026-09-19',
    title: 'Named Things in Pathology',
    systems: ['Mixed / Step Review'],
    topicTags: ['eponymous triads', 'imaging patterns', 'paraneoplastic syndromes'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Eponymous medical triads',
        explanation: 'Each triad is a memorable three-finding pattern pointing to one specific diagnosis.',
        remember: 'A named triad is a diagnosis shortcut — learn the three findings as a set, not separately.',
        items: [
          { term: "Charcot's triad", why: 'Fever, jaundice, and RUQ pain — ascending cholangitis.' },
          { term: "Beck's triad", why: 'Hypotension, JVD, and muffled heart sounds — tamponade.' },
          { term: "Virchow's triad", why: 'Stasis, endothelial injury, and hypercoagulability — thrombosis risk.' },
          { term: "Cushing's triad", why: 'Hypertension, bradycardia, and irregular respirations — rising ICP.' },
        ],
      },
      {
        level: 2,
        title: 'Classic imaging descriptions',
        explanation:
          'Radiology loves a good visual metaphor — each phrase is shorthand for a specific, recognizable imaging pattern.',
        remember: 'Learn the picture the phrase paints, and the diagnosis usually follows.',
        items: [
          { term: 'String of pearls', why: "Dilated ovarian follicles arranged around the ovary's edge in PCOS." },
          { term: 'String of beads', why: 'Alternating stenosis and dilation of the renal artery in fibromuscular dysplasia.' },
          { term: 'Honeycombing', why: 'Subpleural cystic airspaces seen in usual interstitial pneumonia/pulmonary fibrosis.' },
          { term: 'Ground-glass opacity', why: 'Hazy increased lung density, classic for Pneumocystis pneumonia (also COVID).' },
        ],
      },
      {
        level: 3,
        title: 'Eponymous cells in pathology',
        explanation:
          'Each named cell type is a microscopic fingerprint that helps pathologists pin down a specific disease at a glance.',
        remember: 'A named giant/inclusion cell is pattern recognition at the microscope — learn cell shape, then disease.',
        items: [
          { term: 'Reed-Sternberg cells', why: "Binucleate 'owl-eye' cells diagnostic of Hodgkin lymphoma." },
          { term: 'Anitschkow cells', why: 'Activated macrophages with caterpillar-shaped nuclei, found in Aschoff bodies in rheumatic fever.' },
          { term: 'Langhans giant cells', why: 'Multinucleated macrophages with peripherally arranged nuclei, seen in TB granulomas.' },
          { term: 'Touton giant cells', why: 'Multinucleated cells with a wreath of nuclei around a foamy center, seen in xanthomas.' },
        ],
      },
      {
        level: 4,
        title: 'Paraneoplastic syndromes',
        explanation:
          "Tumors can act at a distance — secreting hormone-like substances or triggering autoimmunity — causing symptoms unrelated to the tumor's physical location.",
        remember: 'Lung cancer is the paraneoplastic overachiever — know which cell type causes which syndrome.',
        items: [
          { term: 'Lambert-Eaton myasthenic syndrome', why: 'Antibodies against presynaptic calcium channels, classically with small cell lung cancer.' },
          { term: 'SIADH', why: 'Ectopic ADH secretion, classically from small cell lung cancer.' },
          { term: 'Ectopic Cushing syndrome', why: 'Ectopic ACTH secretion, classically from small cell lung cancer.' },
          { term: 'Hypercalcemia of malignancy', why: 'PTHrP secretion, classically from squamous cell lung cancer.' },
        ],
      },
    ],
  },
]

export default dailyPuzzles
