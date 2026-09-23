// System Library puzzles: organized by organ system, unlimited replays,
// unlike the once-a-day Daily Puzzle. In a real backend this is the same
// `puzzles` table as dailyPuzzles.js, just with type='system' and date=null.

const systemPuzzles = [
  // ---------------------------------------------------------------
  // Reassigned from the original general pool
  // ---------------------------------------------------------------
  {
    id: 'sys-mixed-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Places & Passages',
    systems: ['Mixed / Step Review'],
    topicTags: ['eponymous geography', 'diaphragm', 'fetal circulation', 'thrombophilia'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Diseases named after places',
        explanation:
          "Geography is one of medicine's favorite naming conventions — usually marking where a disease was first identified or a notable outbreak occurred.",
        remember: "A place-name diagnosis just marks discovery location, not where you're likely to catch it today.",
        items: [
          { term: 'Rocky Mountain spotted fever', why: 'Rickettsia rickettsii, first recognized in the Rocky Mountain region.' },
          { term: 'Marburg virus disease', why: 'Named after Marburg, Germany, where it was first identified in 1967.' },
          { term: 'Lyme disease', why: 'First identified in Lyme, Connecticut.' },
          { term: 'West Nile virus', why: 'First isolated in the West Nile district of Uganda.' },
        ],
      },
      {
        level: 2,
        title: 'Passes through the diaphragm',
        explanation:
          '"I ate ten eggs at twelve" — the diaphragm has three major openings, each at a different vertebral level, each carrying specific structures.',
        remember: 'T8 = vena cava, T10 = esophagus (+vagus), T12 = aorta (+thoracic duct, azygous vein).',
        items: [
          { term: 'Aorta', why: 'Passes through the aortic hiatus at T12.' },
          { term: 'Esophagus', why: 'Passes through the esophageal hiatus at T10, alongside the vagus nerve.' },
          { term: 'Inferior vena cava', why: 'Passes through the caval opening at T8.' },
          { term: 'Vagus nerve', why: 'Travels with the esophagus through the esophageal hiatus at T10.' },
        ],
      },
      {
        level: 3,
        title: 'Fetal structure → adult remnant',
        explanation:
          'Fetal circulation bypasses the lungs and liver using shunts that close after birth and persist as fibrous cords or scars.',
        remember: 'Every fetal shunt leaves an adult remnant — closure is what changes, not disappearance.',
        items: [
          { term: 'Ductus arteriosus', why: 'Becomes the ligamentum arteriosum after birth.' },
          { term: 'Foramen ovale', why: 'Becomes the fossa ovalis once it seals.' },
          { term: 'Umbilical vein', why: 'Becomes the ligamentum teres hepatis.' },
          { term: 'Ductus venosus', why: 'Becomes the ligamentum venosum.' },
        ],
      },
      {
        level: 4,
        title: 'Inherited/acquired hypercoagulable states',
        explanation:
          'Each of these tips the coagulation balance toward clotting, whether by resisting anticoagulant proteins or by outright autoantibody attack.',
        remember: 'Recurrent clots in a young patient? Think inherited/acquired thrombophilia workup.',
        items: [
          { term: 'Factor V Leiden', why: 'Factor V resistant to degradation by protein C, the most common inherited thrombophilia.' },
          { term: 'Protein C deficiency', why: 'Reduced ability to inactivate factors Va and VIIIa.' },
          { term: 'Antiphospholipid syndrome', why: 'Autoantibodies promote clotting; acquired, often with lupus.' },
          { term: 'Prothrombin G20210A', why: 'A mutation that increases prothrombin levels.' },
        ],
      },
    ],
  },
  {
    id: 'sys-micro-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Micro Meets Path',
    systems: ['Microbiology'],
    topicTags: ['acid-fast', 'dimorphic fungi', 'spirochetes', 'intracellular organisms'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Acid-fast organisms',
        explanation:
          'Acid-fastness comes from a lipid-rich cell wall (mycobacteria) or a resistant oocyst wall (some parasites) that holds onto stain despite an acid wash.',
        remember: 'Acid-fast is not just TB — Nocardia, Cryptosporidium, and Cyclospora all stain the same way.',
        items: [
          { term: 'Mycobacterium tuberculosis', why: 'Waxy mycolic acid cell wall resists Gram stain but retains carbol fuchsin.' },
          { term: 'Nocardia asteroides', why: 'Partially acid-fast, unlike its look-alike Actinomyces.' },
          { term: 'Cryptosporidium parvum', why: 'Acid-fast oocysts seen in stool of immunocompromised patients.' },
          { term: 'Cyclospora cayetanensis', why: 'Acid-fast oocysts causing prolonged watery diarrhea.' },
        ],
      },
      {
        level: 2,
        title: 'Dimorphic fungi',
        explanation:
          'Dimorphic fungi live as mold in the cool environment and convert to yeast at body temperature — each with its own geographic hotspot.',
        remember: 'Dimorphic = mold in the cold, yeast in the heat — and each one has a home region.',
        items: [
          { term: 'Histoplasma capsulatum', why: 'Found in Ohio/Mississippi River valley soil, associated with bird/bat droppings.' },
          { term: 'Coccidioides immitis', why: "Found in the desert Southwest; causes 'Valley fever.'" },
          { term: 'Blastomyces dermatitidis', why: 'Found in the central/eastern US and Great Lakes region.' },
          { term: 'Paracoccidioides brasiliensis', why: "Found in Latin America; causes a 'captain's wheel' yeast pattern." },
        ],
      },
      {
        level: 3,
        title: 'Spirochetes',
        explanation: 'Spirochetes share a distinctive corkscrew shape that lets them move through tissue and evade easy staining.',
        remember: 'Thin, coiled, and hard to Gram stain — think spirochete, then narrow by exposure history.',
        items: [
          { term: 'Treponema pallidum', why: 'Causes syphilis; too thin to see on Gram stain, needs dark-field microscopy.' },
          { term: 'Borrelia burgdorferi', why: 'Causes Lyme disease, transmitted by Ixodes ticks.' },
          { term: 'Leptospira interrogans', why: 'Causes leptospirosis, transmitted via animal urine-contaminated water.' },
          { term: 'Borrelia recurrentis', why: 'Causes relapsing fever, transmitted by lice.' },
        ],
      },
      {
        level: 4,
        title: 'Obligate intracellular organisms',
        explanation:
          'These organisms depend on host cell machinery (often ATP) to survive, so they cannot be cultured on standard bacterial media.',
        remember: 'If it cannot be cultured outside a cell, think Rickettsia, Chlamydia, Coxiella, or Orientia.',
        items: [
          { term: 'Rickettsia rickettsii', why: "Can't make its own ATP; must live inside host cells." },
          { term: 'Chlamydia trachomatis', why: 'Lacks the machinery to make its own ATP outside a host cell.' },
          { term: 'Coxiella burnetii', why: 'Survives inside phagolysosomes of host cells; causes Q fever.' },
          { term: 'Orientia tsutsugamushi', why: 'Causes scrub typhus; obligate intracellular like other rickettsiae.' },
        ],
      },
    ],
  },
  {
    id: 'sys-mixed-0002',
    number: 2,
    type: 'system',
    date: null,
    title: 'Physical Exam Signs',
    systems: ['Mixed / Step Review'],
    topicTags: ['appendicitis', 'meningismus', 'hypocalcemia', 'tamponade'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Signs of appendicitis',
        explanation: 'Each sign reflects peritoneal or muscular irritation from an inflamed appendix in a particular anatomic position.',
        remember: 'Appendix position changes which sign shows up — retrocecal leads to psoas, pelvic leads to obturator.',
        items: [
          { term: "McBurney's point tenderness", why: 'Maximal tenderness one-third from the ASIS to the umbilicus.' },
          { term: "Rovsing's sign", why: 'Palpating the left lower quadrant causes right lower quadrant pain.' },
          { term: 'Psoas sign', why: 'Pain on hip extension suggests a retrocecal inflamed appendix irritating the psoas.' },
          { term: 'Obturator sign', why: 'Pain on internal rotation of the flexed hip suggests a pelvic appendix.' },
        ],
      },
      {
        level: 2,
        title: 'Signs of meningeal irritation',
        explanation:
          'Inflamed meninges hurt when stretched, so anything that stretches the spinal cord or its coverings reproduces pain or reflex guarding.',
        remember: 'Meningismus signs all work by stretching irritated meninges one way or another.',
        items: [
          { term: "Kernig's sign", why: 'Pain/resistance on knee extension with the hip flexed.' },
          { term: "Brudzinski's sign", why: 'Passive neck flexion causes involuntary hip/knee flexion.' },
          { term: 'Nuchal rigidity', why: 'Resistance to passive neck flexion.' },
          { term: 'Jolt accentuation', why: 'Headache worsens with horizontal head rotation.' },
        ],
      },
      {
        level: 3,
        title: 'Signs of hypocalcemia',
        explanation:
          "Calcium stabilizes neuromuscular membranes — take it away and nerves/muscles fire too easily, and the heart's repolarization slows.",
        remember: 'Low calcium means irritable nerves and muscles (Chvostek, Trousseau, spasm) plus a longer QT.',
        items: [
          { term: "Chvostek's sign", why: 'Tapping the facial nerve causes facial muscle twitching.' },
          { term: "Trousseau's sign", why: 'Inflating a BP cuff above systolic causes carpal spasm.' },
          { term: 'Carpopedal spasm', why: 'Sustained contraction of hand/foot muscles from neuromuscular irritability.' },
          { term: 'Prolonged QT interval', why: 'Low calcium delays ventricular repolarization.' },
        ],
      },
      {
        level: 4,
        title: 'Findings in cardiac tamponade',
        explanation:
          "Fluid compressing the heart from outside restricts filling and muffles both its sounds and its normal beat-to-beat consistency.",
        remember: 'Tamponade squeezes the heart from outside — filling drops, sounds muffle, and the axis wobbles beat to beat.',
        items: [
          { term: 'Pulsus paradoxus', why: 'An exaggerated drop in systolic BP with inspiration.' },
          { term: 'Electrical alternans', why: 'Beat-to-beat QRS amplitude variation from the heart swinging in fluid.' },
          { term: "Beck's triad", why: 'Hypotension, JVD, and muffled heart sounds.' },
          { term: 'Low-voltage QRS on ECG', why: 'Pericardial fluid dampens the electrical signal reaching surface leads.' },
        ],
      },
    ],
  },
  {
    id: 'sys-biochem-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Genetics & Inheritance',
    systems: ['Biochemistry/Genetics'],
    topicTags: ['autosomal dominant', 'autosomal recessive', 'X-linked', 'trinucleotide repeats'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Autosomal dominant conditions',
        explanation: 'One mutated copy is enough to cause disease — often affecting a structural protein or a dose-sensitive pathway.',
        remember: 'AD conditions need just one bad copy — think structural proteins and growth-regulating genes.',
        items: [
          { term: 'Huntington disease', why: 'CAG repeat expansion; one copy causes disease.' },
          { term: 'Marfan syndrome', why: 'Fibrillin-1 mutation affecting connective tissue.' },
          { term: 'Neurofibromatosis type 1', why: 'NF1 tumor suppressor mutation.' },
          { term: 'Familial hypercholesterolemia', why: 'LDL receptor mutation raising LDL from birth.' },
        ],
      },
      {
        level: 2,
        title: 'Autosomal recessive conditions',
        explanation: 'These are typically enzyme or transporter deficiencies — a single working copy usually makes enough protein to prevent disease.',
        remember: 'AR conditions usually knock out an enzyme — one working copy is usually enough to compensate.',
        items: [
          { term: 'Cystic fibrosis', why: 'CFTR mutation; needs two mutated copies.' },
          { term: 'Sickle cell disease', why: 'Beta-globin mutation; needs two copies for disease.' },
          { term: 'Phenylketonuria', why: 'Phenylalanine hydroxylase deficiency; needs two copies.' },
          { term: 'Tay-Sachs disease', why: 'Hexosaminidase A deficiency; needs two copies.' },
        ],
      },
      {
        level: 3,
        title: 'X-linked recessive conditions',
        explanation: 'With only one X chromosome, males need just one mutated copy to show disease — these conditions cluster heavily in men.',
        remember: 'X-linked recessive: sons of carrier mothers are the ones who get sick.',
        items: [
          { term: 'Hemophilia A', why: 'Factor VIII deficiency; mostly affects males.' },
          { term: 'Duchenne muscular dystrophy', why: 'Dystrophin mutation; mostly affects males.' },
          { term: 'G6PD deficiency', why: 'Glucose-6-phosphate dehydrogenase deficiency; mostly affects males.' },
          { term: 'Red-green color blindness', why: 'Opsin gene mutation on the X chromosome; mostly affects males.' },
        ],
      },
      {
        level: 4,
        title: 'Trinucleotide repeat disorders',
        explanation:
          'These diseases share a mechanism, not an inheritance pattern — an unstable repeated DNA sequence that expands and can worsen across generations.',
        remember: 'Repeat disorders often get worse each generation — that’s called anticipation.',
        items: [
          { term: 'Fragile X syndrome', why: 'CGG repeat expansion on the X chromosome.' },
          { term: 'Myotonic dystrophy', why: 'CTG repeat expansion.' },
          { term: 'Friedreich ataxia', why: 'GAA repeat expansion — an exception that is autosomal recessive.' },
          { term: 'Kennedy disease', why: 'CAG repeat expansion; X-linked spinobulbar muscular atrophy.' },
        ],
      },
    ],
  },
  {
    id: 'sys-hemeonc-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Onc & Heme',
    systems: ['Heme/Onc'],
    topicTags: ['leukemias', 'translocations', 'tumor markers'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Leukemias',
        explanation:
          'Leukemias are named by cell line (lymphoid vs myeloid) and pace (acute vs chronic) — each combination has a classic age group and marker.',
        remember: 'Kids get ALL, adults with Auer rods get AML, smudge cells mean CLL, Philadelphia chromosome means CML.',
        items: [
          { term: 'Acute lymphoblastic leukemia', why: 'Most common childhood leukemia; lymphoblasts crowd the marrow.' },
          { term: 'Acute myeloid leukemia', why: 'Myeloblasts, often with Auer rods; more common in adults.' },
          { term: 'Chronic lymphocytic leukemia', why: 'Mature-appearing lymphocytes with smudge cells; older adults.' },
          { term: 'Chronic myeloid leukemia', why: 'Driven by the Philadelphia chromosome; overproduction of granulocytes.' },
        ],
      },
      {
        level: 2,
        title: 'Disease-defining translocations',
        explanation: 'Each translocation fuses two genes into a fusion product that drives a specific, named blood cancer.',
        remember: 'A translocation is often the diagnosis — memorize the pairing, not just the number.',
        items: [
          { term: 't(9;22) Philadelphia chromosome', why: 'BCR-ABL fusion, defines chronic myeloid leukemia.' },
          { term: 't(15;17)', why: 'PML-RARA fusion, defines acute promyelocytic leukemia.' },
          { term: 't(8;14)', why: 'MYC-IGH fusion, defines Burkitt lymphoma.' },
          { term: 't(14;18)', why: 'BCL2-IGH fusion, defines follicular lymphoma.' },
        ],
      },
      {
        level: 3,
        title: 'Tumor markers',
        explanation: 'Tumor markers are proteins a cancer sheds into the blood — useful for monitoring treatment response more than screening.',
        remember: 'Tumor markers track disease; they rarely diagnose it on their own.',
        items: [
          { term: 'CA-125', why: 'Elevated in ovarian cancer.' },
          { term: 'CA 19-9', why: 'Elevated in pancreatic cancer.' },
          { term: 'Alpha-fetoprotein', why: 'Elevated in hepatocellular carcinoma and yolk sac tumors.' },
          { term: 'CEA', why: 'Elevated in colorectal cancer, though nonspecific.' },
        ],
      },
      {
        level: 4,
        title: 'Classic lab/pathology findings in leukemia',
        explanation: 'Each finding is a lab or smear clue pathologists use to pin a leukemia diagnosis at the bench.',
        remember: 'Auer rods mean AML, smudge cells mean CLL, TdT means ALL, TRAP means hairy cell.',
        items: [
          { term: 'Auer rods', why: 'Needle-like cytoplasmic inclusions in AML blasts.' },
          { term: 'Smudge cells', why: 'Fragile lymphocytes that rupture during a blood smear in CLL.' },
          { term: 'TdT positivity', why: 'Marker of immature lymphoblasts, positive in ALL.' },
          { term: 'TRAP positivity', why: 'Tartrate-resistant acid phosphatase, positive in hairy cell leukemia.' },
        ],
      },
    ],
  },
  {
    id: 'sys-pharm-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Toxidromes & Pharm',
    systems: ['Pharmacology'],
    topicTags: ['toxidromes', 'serotonin syndrome', 'antidotes', 'zero-order kinetics'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: "Anticholinergic toxidrome ('mad, blind, red, dry')",
        explanation:
          'Blocking muscarinic receptors everywhere at once produces this whole-body constellation, classically from antihistamines, TCAs, or plant alkaloids.',
        remember: "The anticholinergic mnemonic ('mad, blind, red, dry, hot') is a whole toxidrome in five words.",
        items: [
          { term: 'Confusion/delirium', why: "'Mad as a hatter' — central muscarinic blockade." },
          { term: 'Mydriasis', why: "'Blind as a bat' — pupillary sphincter blockade." },
          { term: 'Flushed skin', why: "'Red as a beet' — cutaneous vasodilation." },
          { term: 'Dry mucous membranes', why: "'Dry as a bone' — blocked secretions." },
        ],
      },
      {
        level: 2,
        title: 'Can precipitate serotonin syndrome',
        explanation:
          'Any drug that raises synaptic serotonin can push a patient into serotonin syndrome, especially when combined with another serotonergic agent.',
        remember: 'Serotonin syndrome risk rises whenever two serotonin-raising drugs are combined — even unexpected ones like linezolid.',
        items: [
          { term: 'SSRIs', why: 'Increase synaptic serotonin by blocking reuptake.' },
          { term: 'MAOIs', why: 'Prevent serotonin breakdown, sharply raising levels.' },
          { term: 'Tramadol', why: 'Weak opioid with added serotonergic activity.' },
          { term: 'Linezolid', why: 'An antibiotic that also inhibits monoamine oxidase.' },
        ],
      },
      {
        level: 3,
        title: 'Antidote',
        explanation:
          "Each antidote works by directly countering its toxin's mechanism — replenishing what's depleted or blocking what's overactive.",
        remember: "Match the antidote to the mechanism it blocks, not just the drug it's 'for.'",
        items: [
          { term: 'N-acetylcysteine', why: 'Antidote for acetaminophen toxicity; replenishes glutathione.' },
          { term: 'Fomepizole', why: 'Antidote for methanol/ethylene glycol; blocks alcohol dehydrogenase.' },
          { term: 'Physostigmine', why: 'Antidote for anticholinergic toxicity; boosts acetylcholine.' },
          { term: 'Naloxone', why: 'Antidote for opioid overdose; competitive opioid receptor antagonist.' },
        ],
      },
      {
        level: 4,
        title: 'Zero-order elimination kinetics',
        explanation:
          'Once the enzyme or clearance system handling these drugs is saturated, a constant AMOUNT (not percentage) is cleared per unit time — Heparin is the debated 4th member here (see note).',
        remember: 'PEA: Phenytoin, Ethanol, Aspirin (in overdose) are the textbook-clean zero-order drugs.',
        items: [
          { term: 'Ethanol', why: 'Eliminated at a constant rate regardless of concentration.' },
          { term: 'Phenytoin', why: 'Follows zero-order kinetics at therapeutic-to-toxic doses.' },
          { term: 'Aspirin (high dose)', why: 'Switches to zero-order kinetics in overdose.' },
          { term: 'Heparin', why: 'Cleared by saturable mechanisms — dose-dependent kinetics often taught as "zero-order-like," though sources disagree on how clean-cut this classification is.' },
        ],
        // Content audit: Heparin's inclusion as a "classic" zero-order
        // drug alongside PEA is taught in some board-review sources but
        // is genuinely contested in others (mixed saturable + first-order
        // clearance, not pure zero-order like phenytoin/ethanol/aspirin).
        // Flagged for the bank migration rather than removed outright —
        // wording above was already softened to stop overclaiming.
        needsReview: true,
        reviewNote:
          'Heparin\'s classification as a "classic" zero-order drug is contested across pharmacology references; verify against a current source before fully trusting this category.',
      },
    ],
  },
  {
    id: 'sys-mixed-0003',
    number: 3,
    type: 'system',
    date: null,
    title: 'Congenital & Development',
    systems: ['Mixed / Step Review'],
    topicTags: ['cyanotic heart disease', 'pharyngeal arches', 'TORCH', 'neural tube defects'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Cyanotic congenital heart defects',
        explanation: 'Each defect lets deoxygenated blood bypass the lungs and reach systemic circulation directly, causing cyanosis.',
        remember: 'Cyanotic heart defects all share one theme: blood skips the lungs.',
        items: [
          { term: 'Tetralogy of Fallot', why: 'Most common cyanotic congenital heart defect.' },
          { term: 'Transposition of the great arteries', why: 'Aorta and pulmonary artery are swapped, creating two parallel circuits.' },
          { term: 'Truncus arteriosus', why: 'A single great vessel fails to separate into aorta and pulmonary artery.' },
          { term: 'Tricuspid atresia', why: "No tricuspid valve forms, so blood can't flow right atrium to right ventricle." },
        ],
      },
      {
        level: 2,
        title: 'Pharyngeal arch derivatives',
        explanation: 'Each pharyngeal arch carries its own cartilage, nerve, and muscle — arch number predicts which adult structure it becomes.',
        remember: 'Pharyngeal arch number maps to a specific bone/cartilage: 1st jaw, 2nd ear, 3rd/4th-6th throat.',
        items: [
          { term: 'Mandible', why: "Derived from the first pharyngeal arch (Meckel's cartilage)." },
          { term: 'Stapes', why: "Derived from the second pharyngeal arch (Reichert's cartilage)." },
          { term: 'Greater horn of hyoid', why: 'Derived from the third pharyngeal arch.' },
          { term: 'Thyroid cartilage', why: 'Derived from the fourth and sixth pharyngeal arches.' },
        ],
      },
      {
        level: 3,
        title: 'TORCH infections',
        explanation:
          'TORCH infections cross the placenta (or are acquired at delivery) and share a tendency to affect the developing brain, eyes, and ears.',
        remember: 'TORCH organisms all target the same vulnerable trio: brain, eyes, ears.',
        items: [
          { term: 'Toxoplasmosis', why: 'Congenital infection causing intracranial calcifications and chorioretinitis.' },
          { term: 'Rubella', why: 'Congenital infection causing cataracts, deafness, and cardiac defects.' },
          { term: 'Cytomegalovirus', why: 'Most common congenital infection; causes periventricular calcifications.' },
          { term: 'Herpes simplex virus', why: 'Congenital/perinatal infection causing skin, eye, and CNS disease.' },
        ],
      },
      {
        level: 4,
        title: 'Neural tube defects',
        explanation:
          'All arise from incomplete closure of the neural tube early in development — low maternal folate is the classic shared risk factor.',
        remember: 'Neural tube defects share one preventable risk factor: folate deficiency.',
        items: [
          { term: 'Spina bifida occulta', why: 'Failure of vertebral arch fusion without herniation of neural tissue.' },
          { term: 'Anencephaly', why: 'Failure of the rostral neuropore to close, absent forebrain/skull.' },
          { term: 'Chiari II malformation', why: 'Downward displacement of the cerebellum, associated with myelomeningocele.' },
          { term: 'Meningomyelocele', why: 'Herniation of meninges and spinal cord through a vertebral defect.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // New: Cardiology (3)
  // ---------------------------------------------------------------
  {
    id: 'sys-cardio-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Heart Sounds & ECG Clues',
    systems: ['Cardiology'],
    topicTags: ['murmurs', 'systole', 'diastole', 'ECG waveforms'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Systolic murmurs',
        explanation: 'Each of these murmurs occurs between S1 and S2, while the ventricles are contracting and ejecting or leaking blood.',
        remember: 'Systolic murmurs happen while the ventricle squeezes — regurgitant AV valves and forward-flow obstruction both fit.',
        items: [
          { term: 'Mitral regurgitation', why: 'Blood leaks backward into the left atrium during ventricular systole.' },
          { term: 'Aortic stenosis', why: 'A narrowed valve makes the LV work harder to eject blood, all in systole.' },
          { term: 'Tricuspid regurgitation', why: 'Blood leaks backward into the right atrium during systole.' },
          { term: 'Ventricular septal defect', why: 'Blood shunts left-to-right through the septal defect during systole.' },
        ],
      },
      {
        level: 2,
        title: 'Diastolic murmurs',
        explanation:
          'These occur between S2 and S1, while the ventricles fill — either through a narrowed inflow valve or a leaking outflow valve.',
        remember: 'Diastolic murmurs point to filling problems — a stiff inflow valve or a leaky outflow valve.',
        items: [
          { term: 'Aortic regurgitation', why: 'Blood leaks backward from the aorta into the LV during diastole.' },
          { term: 'Mitral stenosis', why: 'A narrowed valve obstructs LA-to-LV filling during diastole.' },
          { term: 'Pulmonic regurgitation', why: 'Blood leaks backward from the pulmonary artery into the RV during diastole.' },
          { term: 'Austin Flint murmur', why: 'A severe aortic regurgitation jet hits the mitral valve, mimicking mitral stenosis.' },
        ],
      },
      {
        level: 3,
        title: 'Right-sided valve disease that gets louder with inspiration',
        explanation:
          "Inspiration increases venous return to the right heart, augmenting any right-sided murmur (Rivero-Carvallo sign) — including these conditions that produce one.",
        remember: "Right-sided murmurs get louder on inspiration; left-sided murmurs don't.",
        items: [
          { term: 'Tricuspid stenosis', why: 'Increased right heart filling on inspiration augments flow across the stenotic valve.' },
          { term: 'Pulmonic stenosis', why: 'Increased right heart filling on inspiration augments the murmur.' },
          { term: 'Ebstein anomaly', why: 'The apically displaced tricuspid valve regurgitates, and that murmur augments with inspiration.' },
          { term: 'Carcinoid heart disease', why: 'Serotonin-driven fibrosis scars the tricuspid and pulmonic valves, producing right-sided murmurs that augment with inspiration.' },
        ],
      },
      {
        level: 4,
        title: 'Named ECG waveform findings',
        explanation:
          'Each of these is a distinctive ECG waveform that, once recognized, points straight to one diagnosis.',
        remember: 'A named ECG wave is a pattern-recognition shortcut — learn the wave, then the disease.',
        items: [
          { term: 'Electrical alternans', why: 'Beat-to-beat QRS amplitude variation from the heart swinging in pericardial fluid — tamponade.' },
          { term: 'Delta wave', why: 'Slurred QRS upstroke from ventricular pre-excitation in Wolff-Parkinson-White syndrome.' },
          { term: 'Osborn wave', why: 'A hump at the QRS-ST junction, classic for hypothermia.' },
          { term: 'Epsilon wave', why: 'A small deflection after the QRS in arrhythmogenic right ventricular cardiomyopathy.' },
        ],
      },
    ],
  },
  {
    id: 'sys-cardio-0002',
    number: 2,
    type: 'system',
    date: null,
    title: 'Shock, Pressures & Flow',
    systems: ['Cardiology'],
    topicTags: ['cardiogenic shock', 'obstructive shock', 'PCWP', 'pulse pressure'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of cardiogenic shock',
        explanation: "Each directly cripples the heart's ability to pump, dropping cardiac output despite adequate volume.",
        remember: 'Cardiogenic shock = the pump itself is failing, not the tank or the pipes.',
        items: [
          { term: 'Massive myocardial infarction', why: 'Large territory infarction knocks out enough myocardium to drop cardiac output.' },
          { term: 'Acute myocarditis', why: 'Inflammation impairs contractility, acutely reducing cardiac output.' },
          { term: 'Acute valve rupture', why: "Sudden severe regurgitation overwhelms the ventricle's ability to maintain forward flow." },
          { term: 'Sustained ventricular tachycardia', why: "A fast, ineffective rhythm can't maintain adequate cardiac output." },
        ],
      },
      {
        level: 2,
        title: 'Causes of obstructive shock',
        explanation: 'Something outside the heart or great vessels is physically blocking blood from filling or leaving it.',
        remember: 'Obstructive shock = a mechanical blockage to filling or output, not a pump or volume problem.',
        items: [
          { term: 'Cardiac tamponade', why: 'Pericardial fluid compresses the heart, restricting filling.' },
          { term: 'Tension pneumothorax', why: 'Elevated intrathoracic pressure kinks the vena cava, restricting venous return.' },
          { term: 'Massive pulmonary embolism', why: 'A large clot obstructs right ventricular outflow into the pulmonary circulation.' },
          { term: 'Acute constrictive pericarditis', why: 'A rigid pericardium restricts diastolic filling.' },
        ],
      },
      {
        level: 3,
        title: 'Raises pulmonary capillary wedge pressure',
        explanation:
          'PCWP estimates left atrial pressure — anything that raises LA pressure, whether from LV failure or valve disease, raises the wedge.',
        remember: 'High PCWP = a left-heart/left-atrial pressure problem, not a lung problem.',
        items: [
          { term: 'Left heart failure', why: 'A failing LV backs pressure up into the left atrium and pulmonary veins.' },
          { term: 'Mitral stenosis', why: 'A narrowed valve raises left atrial pressure directly.' },
          { term: 'Mitral regurgitation', why: 'Regurgitant volume raises left atrial pressure.' },
          { term: 'Fluid overload', why: 'Excess intravascular volume raises filling pressures throughout, including the left atrium.' },
        ],
      },
      {
        level: 4,
        title: 'Causes of a widened pulse pressure',
        explanation:
          'Each raises systolic pressure, lowers diastolic pressure, or both — by increasing stroke volume or dropping peripheral resistance.',
        remember: 'A wide pulse pressure means high flow or a leaky diastolic runoff — think AR, thyrotoxicosis, anemia, or an AV fistula.',
        items: [
          { term: 'Aortic regurgitation', why: 'Diastolic runoff back into the LV drops diastolic pressure.' },
          { term: 'Hyperthyroidism', why: 'Increased contractility and reduced systemic vascular resistance widen the pulse pressure.' },
          { term: 'Severe anemia', why: 'Compensatory increased stroke volume and reduced viscosity widen the pulse pressure.' },
          { term: 'Arteriovenous fistula', why: 'A low-resistance shunt drops diastolic pressure while stroke volume rises.' },
        ],
      },
    ],
  },
  {
    id: 'sys-cardio-0003',
    number: 3,
    type: 'system',
    date: null,
    title: 'Arrhythmias & Conduction',
    systems: ['Cardiology'],
    topicTags: ['bradycardia', 'narrow-complex tachycardia', 'AV block', 'torsades'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of bradycardia',
        explanation: "Each slows the sinus node's firing rate or the conduction that follows it.",
        remember: 'Bradycardia = something is slowing the pacemaker or its output — drug, hormone, disease, or training.',
        items: [
          { term: 'Beta-blocker use', why: 'Blocks sympathetic drive to the sinus node, slowing heart rate.' },
          { term: 'Hypothyroidism', why: 'Reduced metabolic drive slows the sinus rate.' },
          { term: 'Sick sinus syndrome', why: 'Intrinsic sinus node dysfunction causes inappropriate bradycardia.' },
          { term: "Athlete's heart", why: 'High vagal tone from conditioning slows resting heart rate.' },
        ],
      },
      {
        level: 2,
        title: 'Causes of narrow-complex tachycardia',
        explanation:
          'Each originates above or within the AV node, so the QRS stays narrow because ventricular activation follows the normal His-Purkinje pathway.',
        remember: 'Narrow QRS tachycardia = the problem starts above the ventricles.',
        items: [
          { term: 'Atrial fibrillation', why: 'Chaotic atrial activity conducts irregularly through an intact AV node/His-Purkinje system.' },
          { term: 'AVNRT', why: 'A reentrant circuit within the AV node uses the normal conduction pathway to the ventricles.' },
          { term: 'Atrial flutter', why: 'Organized atrial reentry conducts through the normal AV node/His-Purkinje system.' },
          { term: 'Sinus tachycardia', why: 'Normal sinus node activity, just faster, conducting normally.' },
        ],
      },
      {
        level: 3,
        title: 'AV block type',
        explanation:
          'Each describes a different pattern of impaired conduction from atria to ventricles, of increasing severity.',
        remember: 'AV block severity: prolonged PR, then progressive PR lengthening, then sudden dropped beats, then no conduction at all.',
        items: [
          { term: 'First-degree AV block', why: 'Prolonged but consistent PR interval; every beat still conducts.' },
          { term: 'Mobitz type I (Wenckebach)', why: 'Progressively lengthening PR interval until a beat is dropped.' },
          { term: 'Mobitz type II', why: 'Fixed PR interval with intermittently and unpredictably dropped beats.' },
          { term: 'Third-degree (complete) AV block', why: 'No atrial impulses conduct to the ventricles; atria and ventricles beat independently.' },
        ],
      },
      {
        level: 4,
        title: 'Torsades de pointes risk factors',
        explanation:
          'Each prolongs the QT interval or destabilizes repolarization enough to trigger this specific polymorphic VT.',
        remember: 'Torsades needs a long QT as the setup — magnesium, channel mutations, drugs, and bradycardia are the classic triggers.',
        items: [
          { term: 'Hypomagnesemia', why: 'Low magnesium destabilizes repolarization, prolonging QT.' },
          { term: 'Congenital long QT syndrome', why: 'Inherited ion channel mutations delay repolarization.' },
          { term: 'Class IA/III antiarrhythmics', why: 'These drugs prolong repolarization by design, risking excessive QT prolongation.' },
          { term: 'Profound bradycardia', why: 'Slow rates prolong the QT interval and allow early afterdepolarizations.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // New: Pulmonary (3)
  // ---------------------------------------------------------------
  {
    id: 'sys-pulm-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Obstructive vs Restrictive Physiology',
    systems: ['Pulmonary'],
    topicTags: ['obstructive lung disease', 'restrictive lung disease', 'DLCO'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Obstructive lung diseases',
        explanation: 'Each narrows the airways, so air gets trapped and is exhaled slowly — a reduced FEV1/FVC ratio.',
        remember: 'Obstructive disease = hard to get air OUT; low FEV1/FVC.',
        items: [
          { term: 'COPD', why: 'Chronic airway inflammation and destruction narrow airflow, especially on exhalation.' },
          { term: 'Asthma', why: 'Reversible bronchoconstriction and airway inflammation narrow the airways.' },
          { term: 'Bronchiectasis', why: 'Permanently dilated, damaged airways trap mucus and obstruct airflow.' },
          { term: 'Cystic fibrosis', why: 'Thick mucus plugs and damages airways, causing obstruction.' },
        ],
      },
      {
        level: 2,
        title: 'Restrictive lung diseases',
        explanation:
          'Each limits how much the lungs (or chest wall) can expand, reducing total lung capacity — a normal or high FEV1/FVC ratio.',
        remember: 'Restrictive disease = hard to get air IN; low total lung capacity but normal/high FEV1/FVC.',
        items: [
          { term: 'Idiopathic pulmonary fibrosis', why: 'Scarring stiffens the lung parenchyma, limiting expansion.' },
          { term: 'Pulmonary sarcoidosis', why: 'Granulomatous inflammation stiffens lung tissue over time.' },
          { term: 'Obesity hypoventilation syndrome', why: 'Excess chest wall mass restricts lung expansion.' },
          { term: 'Kyphoscoliosis', why: 'Spinal deformity mechanically restricts chest wall expansion.' },
        ],
      },
      {
        level: 3,
        title: 'Causes a low DLCO',
        explanation:
          "Each reduces the lung's ability to transfer gas across the alveolar-capillary membrane, whether by destroying surface area, thickening the membrane, or reducing available hemoglobin.",
        remember: 'Low DLCO = a gas-transfer problem: less surface area, a thicker membrane, less blood, or less hemoglobin.',
        items: [
          { term: 'Emphysema', why: 'Alveolar wall destruction reduces surface area for gas exchange.' },
          { term: 'Pulmonary fibrosis', why: 'A thickened alveolar-capillary membrane slows gas diffusion.' },
          { term: 'Pulmonary hypertension', why: 'Reduced pulmonary capillary blood volume limits gas uptake.' },
          { term: 'Anemia', why: 'Less hemoglobin available to bind carbon monoxide lowers the measured DLCO.' },
        ],
      },
      {
        level: 4,
        title: 'Normal or high DLCO despite lung disease',
        explanation:
          "Each either doesn't damage the gas-exchange membrane or actively increases the lung's capacity to pick up gas.",
        remember: 'DLCO rises when there is extra blood/hemoglobin to bind CO, or extra capillary recruitment — hemorrhage, polycythemia, shunt, and exercise all fit.',
        items: [
          { term: 'Exercise', why: 'Recruitment of extra pulmonary capillaries during exertion increases the surface area available for gas transfer.' },
          { term: 'Pulmonary hemorrhage', why: 'Free hemoglobin in the alveoli binds extra carbon monoxide, raising measured DLCO.' },
          { term: 'Polycythemia', why: 'More circulating hemoglobin increases gas-binding capacity.' },
          { term: 'Left-to-right cardiac shunt', why: 'Increased pulmonary blood flow increases DLCO.' },
        ],
      },
    ],
  },
  {
    id: 'sys-pulm-0002',
    number: 2,
    type: 'system',
    date: null,
    title: 'Pleural Fluid & Zonal Lung Disease',
    systems: ['Pulmonary'],
    topicTags: ['pleural effusion', 'upper lobe disease', 'lower lobe disease'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of a transudative pleural effusion',
        explanation: 'Each changes hydrostatic or oncotic pressure system-wide rather than damaging the pleura itself.',
        remember: "Transudate = a pressure/protein problem, not a pleural problem — Light's criteria negative.",
        items: [
          { term: 'Congestive heart failure', why: 'Elevated hydrostatic pressure pushes fluid into the pleural space.' },
          { term: 'Cirrhosis', why: 'Low oncotic pressure and fluid shifts favor pleural fluid accumulation.' },
          { term: 'Nephrotic syndrome', why: 'Urinary protein loss lowers oncotic pressure, favoring fluid leakage.' },
          { term: 'Hypoalbuminemia', why: 'Low oncotic pressure lets fluid leak into the pleural space.' },
        ],
      },
      {
        level: 2,
        title: 'Causes of an exudative pleural effusion',
        explanation:
          'Each directly injures or invades the pleura or lung, increasing capillary permeability and protein-rich fluid leakage.',
        remember: "Exudate = the pleura itself is inflamed, infected, or invaded — Light's criteria positive.",
        items: [
          { term: 'Parapneumonic effusion', why: 'Adjacent lung infection inflames the pleura, leaking protein-rich fluid.' },
          { term: 'Malignancy', why: 'Tumor invasion of the pleura increases capillary permeability.' },
          { term: 'Pulmonary embolism', why: 'Pleural inflammation from infarction produces an exudate.' },
          { term: 'Tuberculosis', why: 'Pleural infection provokes an intensely exudative, lymphocyte-rich effusion.' },
        ],
      },
      {
        level: 3,
        title: 'Upper lobe predominant lung disease',
        explanation:
          'Each preferentially affects the upper lobes — from high oxygen tension favoring TB reactivation to inhaled particle deposition patterns in pneumoconioses.',
        remember: 'Upper-lobe disease: reactivation TB and the pneumoconioses (silicosis, CWP), or smoking-related histiocytosis.',
        items: [
          { term: 'Reactivation tuberculosis', why: 'High oxygen tension in the upper lobes favors mycobacterial growth.' },
          { term: 'Silicosis', why: 'Inhaled silica particles preferentially deposit in the upper lung zones.' },
          { term: "Coal workers' pneumoconiosis", why: 'Coal dust deposition and fibrosis predominate in the upper lobes.' },
          { term: 'Pulmonary Langerhans cell histiocytosis', why: 'A smoking-related disease with upper-lobe cystic and nodular changes.' },
        ],
      },
      {
        level: 4,
        title: 'Lower lobe predominant lung disease',
        explanation:
          'Each preferentially affects the lower lobes — from gravity-dependent aspiration to the basal fibrosis pattern of IPF and asbestos exposure.',
        remember: 'Lower-lobe disease: IPF, asbestosis, and aspiration all settle toward the bases.',
        items: [
          { term: 'Idiopathic pulmonary fibrosis (UIP)', why: 'Classically starts at the lung bases.' },
          { term: 'Aspiration pneumonia', why: 'Gravity carries aspirated material into the lower/posterior lobes.' },
          { term: 'Asbestosis', why: 'Inhaled asbestos fibers cause fibrosis predominantly at the lung bases.' },
          { term: 'Bronchiectasis (non-CF)', why: 'Gravity-dependent mucus pooling favors lower-lobe airway damage.' },
        ],
      },
    ],
  },
  {
    id: 'sys-pulm-0003',
    number: 3,
    type: 'system',
    date: null,
    title: 'Gas Exchange & V/Q',
    systems: ['Pulmonary'],
    topicTags: ['A-a gradient', 'hypoventilation', 'oxygen dissociation curve', 'V/Q mismatch'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of a high A-a gradient',
        explanation:
          'Each impairs gas exchange within the lung itself — a V/Q mismatch or a shunt — while the drive to breathe stays intact.',
        remember: 'A high A-a gradient means the problem is IN the lung — V/Q mismatch or shunt.',
        items: [
          { term: 'Pulmonary embolism', why: 'Ventilated but under-perfused lung creates V/Q mismatch.' },
          { term: 'Pneumonia', why: 'Fluid-filled alveoli are perfused but poorly ventilated, mismatching V/Q.' },
          { term: 'Pulmonary edema', why: 'Fluid in alveoli impairs oxygen diffusion into the blood.' },
          { term: 'Right-to-left shunt', why: 'Deoxygenated blood bypasses ventilated alveoli entirely.' },
        ],
      },
      {
        level: 2,
        title: 'Hypoventilation with a NORMAL A-a gradient',
        explanation:
          "Each reduces the drive or ability to breathe without directly damaging the lungs themselves — the lung's own gas exchange machinery is fine.",
        remember: 'Hypoventilation with a normal A-a gradient means the lungs are fine — the pump or the drive to breathe is the problem.',
        items: [
          { term: 'Opioid overdose', why: 'Suppresses the central respiratory drive without damaging the lungs.' },
          { term: 'Central sleep apnea', why: 'Absent respiratory drive during sleep, lungs otherwise normal.' },
          { term: 'Guillain-Barré syndrome', why: 'Respiratory muscle weakness impairs the ability to breathe, not the lungs themselves.' },
          { term: 'Severe obesity', why: 'Chest wall load reduces ventilation, though gas exchange machinery is intact.' },
        ],
      },
      {
        level: 3,
        title: 'Shifts the oxygen-hemoglobin curve RIGHT (unloads O2 more easily)',
        explanation:
          'Each reflects a tissue that needs more oxygen right now — exercising muscle, for example — and each makes hemoglobin let go of oxygen more readily.',
        remember: 'Right shift = hemoglobin releases oxygen more easily; think of exercising tissue: hot, acidic, high CO2, high 2,3-BPG.',
        items: [
          { term: 'Increased temperature', why: 'Heat reduces hemoglobin’s oxygen affinity, favoring unloading.' },
          { term: 'Increased 2,3-BPG', why: 'Binds deoxyhemoglobin preferentially, promoting oxygen release.' },
          { term: 'Acidosis', why: "Lower pH reduces hemoglobin's oxygen affinity (the Bohr effect)." },
          { term: 'Increased CO2', why: 'Raises local H+ and directly reduces oxygen affinity.' },
        ],
      },
      {
        level: 4,
        title: 'V/Q ratio extremes',
        explanation:
          "V/Q ratio varies by location and pathology — from pure dead space (ventilated, not perfused) to pure shunt (perfused, not ventilated), with the healthy lung's apex-to-base gradient in between.",
        remember: 'V/Q ratio spans a spectrum: dead space (infinite) to shunt (zero), with the apex naturally higher and the base naturally lower.',
        items: [
          { term: 'Dead space', why: 'Ventilation without perfusion drives the V/Q ratio toward infinity.' },
          { term: 'Shunt', why: 'Perfusion without ventilation drives the V/Q ratio toward zero.' },
          { term: 'Lung apex', why: 'Relatively more ventilation than perfusion gives the apex the highest V/Q ratio in an upright lung.' },
          { term: 'Lung base', why: 'Relatively more perfusion than ventilation gives the base the lowest V/Q ratio in an upright lung.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // New: Renal (3)
  // ---------------------------------------------------------------
  {
    id: 'sys-renal-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Acid-Base Disorders',
    systems: ['Renal'],
    topicTags: ['anion gap acidosis', 'metabolic alkalosis', 'respiratory acidosis'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of anion gap metabolic acidosis',
        explanation: 'Each generates an unmeasured acid that consumes bicarbonate, widening the anion gap.',
        remember: 'Anion gap acidosis (MUDPILES) means an extra acid is being produced or retained, not just bicarbonate being lost.',
        items: [
          { term: 'Methanol', why: 'Metabolized to formic acid, an unmeasured acid.' },
          { term: 'Diabetic ketoacidosis', why: 'Ketoacids accumulate as unmeasured acids.' },
          { term: 'Uremia', why: 'Retained organic acids and sulfates/phosphates widen the gap in renal failure.' },
          { term: 'Lactic acidosis', why: 'Accumulated lactate is an unmeasured acid.' },
        ],
      },
      {
        level: 2,
        title: 'Causes of non-anion gap metabolic acidosis',
        explanation:
          'Each loses bicarbonate directly (GI or renal) and the body retains chloride to compensate, keeping the anion gap normal.',
        remember: 'Non-anion gap acidosis = bicarbonate is lost directly and replaced by chloride.',
        items: [
          { term: 'Diarrhea', why: 'GI bicarbonate loss is replaced by chloride retention.' },
          { term: 'Renal tubular acidosis', why: 'Impaired renal acid excretion or bicarbonate reabsorption, with chloride retention.' },
          { term: 'Acetazolamide', why: 'Inhibits renal bicarbonate reabsorption, causing a hyperchloremic acidosis.' },
          { term: 'Early renal failure', why: 'Reduced ammonium excretion causes an early hyperchloremic acidosis before the gap widens.' },
        ],
      },
      {
        level: 3,
        title: 'Causes of metabolic alkalosis',
        explanation:
          'Each either removes acid directly (vomiting) or drives renal hydrogen/potassium loss that generates new bicarbonate.',
        remember: 'Metabolic alkalosis: lose acid (vomiting) or drive the kidney to make more bicarbonate (diuretics, aldosterone excess).',
        items: [
          { term: 'Vomiting', why: 'Loss of gastric HCl directly removes acid.' },
          { term: 'Loop or thiazide diuretics', why: 'Volume contraction and hypokalemia drive renal bicarbonate generation.' },
          { term: 'Primary hyperaldosteronism', why: 'Excess aldosterone drives renal H+ and K+ secretion, generating bicarbonate.' },
          { term: 'Milk-alkali syndrome', why: 'Excess calcium/absorbable alkali intake directly raises bicarbonate.' },
        ],
      },
      {
        level: 4,
        title: 'Causes of respiratory acidosis',
        explanation: 'Each impairs ventilation enough that CO2 is retained faster than it can be exhaled.',
        remember: 'Respiratory acidosis = CO2 is not being blown off fast enough — drive, lungs, or muscles are the usual culprits.',
        items: [
          { term: 'Opioid overdose', why: 'Suppressed respiratory drive causes CO2 retention.' },
          { term: 'COPD exacerbation', why: 'Impaired ventilation and air trapping cause CO2 retention.' },
          { term: 'Guillain-Barré syndrome', why: 'Respiratory muscle weakness limits ventilation, retaining CO2.' },
          { term: 'Obesity hypoventilation syndrome', why: 'Chest wall load limits ventilation, retaining CO2.' },
        ],
      },
    ],
  },
  {
    id: 'sys-renal-0002',
    number: 2,
    type: 'system',
    date: null,
    title: 'Nephrotic, Nephritic & Glomerular Patterns',
    systems: ['Renal'],
    topicTags: ['nephrotic syndrome', 'nephritic syndrome', 'RPGN', 'glomerulonephritis'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Nephrotic syndrome findings',
        explanation:
          'Each is a direct downstream consequence of a damaged glomerular filtration barrier leaking large amounts of protein.',
        remember: 'Nephrotic syndrome is one mechanism (a leaky filter) causing four linked findings — protein loss drives everything else.',
        items: [
          { term: 'Massive proteinuria', why: 'A damaged filtration barrier lets large amounts of protein pass into urine.' },
          { term: 'Hypoalbuminemia', why: 'Ongoing urinary protein loss outpaces hepatic synthesis.' },
          { term: 'Edema', why: 'Low oncotic pressure from hypoalbuminemia lets fluid leak into tissue.' },
          { term: 'Hyperlipidemia', why: 'The liver ramps up lipoprotein synthesis in response to low oncotic pressure.' },
        ],
      },
      {
        level: 2,
        title: 'Nephritic syndrome findings',
        explanation:
          'Each reflects glomerular inflammation that damages the filtration barrier just enough to leak blood, and reduces filtration itself.',
        remember: 'Nephritic syndrome is about inflammation and reduced filtration — blood in the urine, not massive protein loss.',
        items: [
          { term: 'Hematuria with RBC casts', why: 'Glomerular inflammation lets red blood cells leak through and get molded in the tubules.' },
          { term: 'Hypertension', why: 'Reduced GFR triggers sodium and water retention, raising blood pressure.' },
          { term: 'Oliguria', why: 'Glomerular inflammation reduces the filtration rate itself.' },
          { term: 'Mild-to-moderate proteinuria', why: 'The filtration barrier is disrupted, but less severely than in nephrotic syndrome.' },
        ],
      },
      {
        level: 3,
        title: "Diseases with 'crescents' on biopsy (RPGN)",
        explanation:
          "Each can provoke a severe, rapidly progressive inflammatory response that fills Bowman's space with cellular crescents.",
        remember: 'Crescents on biopsy mean rapidly progressive glomerulonephritis — a nephrology emergency, whatever the underlying cause.',
        items: [
          { term: 'Goodpasture syndrome', why: 'Anti-GBM antibodies cause severe linear immune injury and crescent formation.' },
          { term: 'Granulomatosis with polyangiitis', why: 'Pauci-immune vasculitis can cause severe crescentic glomerulonephritis.' },
          { term: 'Severe lupus nephritis', why: 'Immune complex deposition can be severe enough to form crescents.' },
          { term: 'Severe post-streptococcal GN', why: 'Occasionally severe enough to progress to a crescentic pattern.' },
        ],
      },
      {
        level: 4,
        title: 'Matches a microscopy pattern to its disease',
        explanation:
          'Each glomerular disease has a signature microscopy or immunofluorescence pattern that essentially IS the diagnosis under the microscope.',
        remember: 'Glomerular pathology is pattern recognition — linear, spike-and-dome, mesangial, and tram-track each name one disease.',
        items: [
          { term: 'Linear IgG deposition', why: 'Antibodies bind uniformly along the glomerular basement membrane in Goodpasture syndrome.' },
          { term: "'Spike and dome' pattern", why: 'Subepithelial immune deposits create this appearance in membranous nephropathy.' },
          { term: 'Mesangial IgA deposits', why: 'IgA deposits in the mesangium define IgA nephropathy (Berger disease).' },
          { term: "'Tram-track' basement membrane", why: 'Basement membrane splitting from subendothelial deposits in membranoproliferative GN.' },
        ],
      },
    ],
  },
  {
    id: 'sys-renal-0003',
    number: 3,
    type: 'system',
    date: null,
    title: 'Electrolytes, Diuretics & Water Balance',
    systems: ['Renal'],
    topicTags: ['hyperkalemia', 'hypokalemia', 'diuretics', 'SIADH', 'diabetes insipidus'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Causes of hyperkalemia',
        explanation: 'Each either impairs renal potassium excretion or shifts potassium out of cells and into the blood.',
        remember: "Hyperkalemia: the kidney isn't excreting it, or it's shifting out of cells.",
        items: [
          { term: 'Renal failure', why: 'Reduced excretory capacity lets potassium accumulate.' },
          { term: 'ACE inhibitors', why: 'Reduced aldosterone activity impairs renal potassium excretion.' },
          { term: 'Rhabdomyolysis', why: 'Damaged muscle cells release intracellular potassium into the blood.' },
          { term: 'Metabolic acidosis', why: 'Extracellular H+ exchanges for intracellular K+, shifting potassium out of cells.' },
        ],
      },
      {
        level: 2,
        title: 'Causes of hypokalemia',
        explanation: 'Each either drives renal/GI potassium loss or shifts potassium into cells.',
        remember: "Hypokalemia: it's being lost (kidney/gut) or shifted into cells.",
        items: [
          { term: 'Loop or thiazide diuretics', why: 'Increased distal sodium delivery drives renal potassium wasting.' },
          { term: 'Vomiting', why: 'Volume contraction and alkalosis drive renal potassium wasting.' },
          { term: 'Primary hyperaldosteronism', why: 'Excess aldosterone directly drives renal potassium secretion.' },
          { term: 'Insulin therapy', why: 'Insulin drives potassium into cells.' },
        ],
      },
      {
        level: 3,
        title: 'Site of action of a diuretic class',
        explanation: 'Each diuretic class targets a different nephron segment, which is why their electrolyte side effects differ.',
        remember: "Diuretic site of action predicts its electrolyte effects — learn the nephron map, not just the drug names.",
        items: [
          { term: 'Loop diuretics', why: 'Block the Na-K-2Cl cotransporter in the thick ascending limb.' },
          { term: 'Thiazides', why: 'Block the Na-Cl cotransporter in the distal convoluted tubule.' },
          { term: 'Potassium-sparing diuretics', why: 'Act on the collecting duct, blocking sodium reabsorption or aldosterone’s effect.' },
          { term: 'Carbonic anhydrase inhibitors', why: 'Block bicarbonate reabsorption in the proximal tubule.' },
        ],
      },
      {
        level: 4,
        title: 'Diabetes insipidus vs SIADH',
        explanation:
          'DI and SIADH are opposite water-balance disorders, and each finding here maps to exactly one of them.',
        remember: "DI can't concentrate urine (too dilute); SIADH can't dilute it (too concentrated) — opposite problems, opposite fixes.",
        items: [
          { term: 'Dilute urine despite high serum osmolality', why: 'Inadequate ADH action means the kidney cannot concentrate urine — diabetes insipidus.' },
          { term: 'Concentrated urine despite low serum osmolality', why: 'Excess ADH action inappropriately concentrates urine — SIADH.' },
          { term: 'Responds to desmopressin', why: 'Central DI improves because the missing ADH is being replaced.' },
          { term: 'Improves with free water restriction', why: "Reducing water intake corrects SIADH's dilutional hyponatremia." },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // New: Neurology (2)
  // ---------------------------------------------------------------
  {
    id: 'sys-neuro-0001',
    number: 1,
    type: 'system',
    date: null,
    title: 'Stroke Syndromes & Vascular Territories',
    systems: ['Neurology'],
    topicTags: ['MCA stroke', 'ACA stroke', 'lacunar stroke', 'brainstem syndromes'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Signs of a middle cerebral artery stroke',
        explanation:
          'The MCA supplies the lateral cortex — face/arm motor and sensory cortex, plus language or attention areas depending on hemisphere.',
        remember: 'MCA stroke = face and arm weak, leg relatively spared, plus language or neglect depending on side.',
        items: [
          { term: 'Contralateral face/arm weakness, leg-sparing', why: 'The MCA supplies the lateral motor cortex representing the face and arm.' },
          { term: 'Aphasia', why: "The dominant (usually left) MCA territory includes Broca's and Wernicke's areas." },
          { term: 'Contralateral hemineglect', why: 'The non-dominant (usually right) parietal cortex governs spatial attention.' },
          { term: 'Homonymous hemianopia with gaze preference', why: 'Involvement of the frontal eye fields and optic radiations causes gaze preference toward the lesion.' },
        ],
      },
      {
        level: 2,
        title: 'Signs of an anterior cerebral artery stroke',
        explanation:
          'The ACA supplies the medial frontal and parietal cortex — leg motor cortex and frontal lobe structures governing behavior and continence.',
        remember: 'ACA stroke = leg weak, face/arm spared — the mirror image of MCA.',
        items: [
          { term: 'Contralateral leg weakness, face/arm-sparing', why: 'The ACA supplies the medial motor cortex representing the leg.' },
          { term: 'Urinary incontinence', why: 'Medial frontal lobe involvement disrupts bladder inhibition.' },
          { term: 'Personality/behavioral changes', why: 'Frontal lobe territory governs behavior and executive function.' },
          { term: 'Gait apraxia', why: 'Frontal lobe damage impairs the learned motor pattern of walking.' },
        ],
      },
      {
        level: 3,
        title: 'Lacunar stroke syndromes',
        explanation:
          'Each results from a small-vessel infarct in a deep structure, classically from chronic hypertension, with a clean, isolated deficit.',
        remember: 'Lacunar strokes are small-vessel, deep, and produce one clean deficit — no cortical signs like aphasia or neglect.',
        items: [
          { term: 'Pure motor hemiparesis', why: 'A lacune in the internal capsule affects the descending motor pathway alone.' },
          { term: 'Pure sensory stroke', why: 'A lacune in the thalamus affects the sensory relay alone.' },
          { term: 'Ataxic hemiparesis', why: 'A lacune affecting both motor and cerebellar pathways causes weakness with incoordination.' },
          { term: 'Clumsy hand-dysarthria syndrome', why: 'A lacune in the pons affects corticobulbar and corticospinal fibers together.' },
        ],
      },
      {
        level: 4,
        title: 'Named brainstem syndromes',
        explanation:
          "Brainstem lesions produce very specific, often 'crossed' findings — the exact combination of cranial nerve and long-tract signs pinpoints the level of the lesion.",
        remember: 'Brainstem syndromes are named by their specific sign combination — crossed findings mean the brainstem, not the cortex.',
        items: [
          { term: 'Locked-in syndrome', why: 'A ventral pontine (basilar artery) lesion spares consciousness but severs nearly all motor output except vertical gaze.' },
          { term: 'Lateral medullary (Wallenberg) syndrome', why: 'Damage to crossed and uncrossed pathways at the medulla causes a classic crossed sensory pattern.' },
          { term: 'Internuclear ophthalmoplegia', why: 'A lesion in the medial longitudinal fasciculus disconnects the two eyes’ horizontal gaze coordination.' },
          { term: 'Lateral pontine/cerebellar syndrome', why: 'Vestibular and cerebellar pathway involvement produces vertigo with ipsilateral ataxia.' },
        ],
      },
    ],
  },
  {
    id: 'sys-neuro-0002',
    number: 2,
    type: 'system',
    date: null,
    title: 'Movement Disorders & Neurodegeneration',
    systems: ['Neurology'],
    topicTags: ['Parkinson disease', 'chorea', 'dementia subtypes', 'proteinopathy'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Features of Parkinson disease',
        explanation: 'These four cardinal features (TRAP) reflect loss of dopaminergic neurons in the substantia nigra.',
        remember: 'TRAP: Tremor, Rigidity, Akinesia/bradykinesia, Postural instability — the core of Parkinson disease.',
        items: [
          { term: 'Resting tremor', why: "A classic 'pill-rolling' tremor that improves with movement, from dopaminergic loss." },
          { term: 'Bradykinesia', why: 'Slowed initiation and execution of movement from dopamine deficiency.' },
          { term: "Cogwheel rigidity", why: 'Increased muscle tone with a ratchety quality on passive movement.' },
          { term: 'Postural instability', why: 'Impaired postural reflexes appear later in disease progression.' },
        ],
      },
      {
        level: 2,
        title: 'Causes of chorea',
        explanation:
          'Each involves basal ganglia dysfunction (structural, autoimmune, or drug-induced) producing involuntary, dance-like movements.',
        remember: 'Chorea points to basal ganglia trouble — genetic, post-infectious, drug-induced, or autoimmune.',
        items: [
          { term: 'Huntington disease', why: 'CAG repeat expansion causes striatal neurodegeneration and chorea.' },
          { term: 'Sydenham chorea', why: 'Post-streptococcal antibodies cross-react with basal ganglia tissue.' },
          { term: 'Levodopa-induced dyskinesia', why: 'Long-term dopaminergic therapy can itself produce chorea-like movements.' },
          { term: 'Systemic lupus erythematosus', why: 'Antiphospholipid or other autoantibodies can affect the basal ganglia.' },
        ],
      },
      {
        level: 3,
        title: 'Dementia with a distinctive early clue',
        explanation:
          'Each dementia subtype has a distinguishing early feature that helps separate it from the others before advanced disease blurs the picture.',
        remember: 'Early clues separate the dementias: hallucinations (Lewy body), personality change (frontotemporal), memory loss (Alzheimer), stepwise decline (vascular).',
        items: [
          { term: 'Lewy body dementia', why: 'Alpha-synuclein pathology causes early visual hallucinations and fluctuating attention.' },
          { term: 'Frontotemporal dementia', why: 'Frontal/temporal lobe degeneration causes early behavioral and personality changes.' },
          { term: 'Alzheimer disease', why: 'Hippocampal/entorhinal involvement causes early, prominent short-term memory loss.' },
          { term: 'Vascular dementia', why: 'Cumulative infarcts produce a stepwise, rather than smoothly progressive, decline.' },
        ],
      },
      {
        level: 4,
        title: 'Matches abnormal protein to disease',
        explanation:
          'Each neurodegenerative disease has a signature misfolded protein that aggregates and drives neuronal damage.',
        remember: 'Neurodegeneration is a proteinopathy — learn the protein-disease pairing, not just the disease name.',
        items: [
          { term: 'Alpha-synuclein', why: 'Aggregates as Lewy bodies in Parkinson disease and Lewy body dementia.' },
          { term: 'Tau', why: 'Forms neurofibrillary tangles in Alzheimer disease.' },
          { term: 'Huntingtin', why: 'The mutant polyglutamine-expanded protein in Huntington disease.' },
          { term: 'TDP-43', why: 'Aggregates in a subset of frontotemporal dementia and ALS.' },
        ],
      },
    ],
  },

  // ---------------------------------------------------------------
  // New: Pharmacology (1 — the reassigned Toxidromes puzzle above covers the 2nd)
  // ---------------------------------------------------------------
  {
    id: 'sys-pharm-0002',
    number: 2,
    type: 'system',
    date: null,
    title: 'Autonomic & Receptor Pharmacology',
    systems: ['Pharmacology'],
    topicTags: ['beta-blockers', 'alpha blockers', 'muscarinic antagonists', 'receptor pharmacology'],
    status: 'published',
    source: 'Internal question bank — board-review style',
    categories: [
      {
        level: 1,
        title: 'Beta-blocker use',
        explanation:
          'Beta-blockade reduces heart rate, contractility, and sympathetic drive — useful across a surprisingly broad set of conditions.',
        remember: 'Beta-blockers show up everywhere sympathetic drive is a problem — pressure, rate, remodeling, and even migraine.',
        items: [
          { term: 'Hypertension', why: 'Reduced cardiac output and renin release lower blood pressure.' },
          { term: 'Atrial fibrillation (rate control)', why: 'Slows AV nodal conduction, controlling ventricular rate.' },
          { term: 'Post-MI secondary prevention', why: 'Reduces myocardial oxygen demand and arrhythmia risk after infarction.' },
          { term: 'Migraine prophylaxis', why: 'Mechanism unclear, but proven to reduce migraine frequency.' },
        ],
      },
      {
        level: 2,
        title: 'Alpha-1 blocker use/effect',
        explanation:
          'Blocking alpha-1 receptors relaxes smooth muscle (vasculature and prostate) but also removes vasoconstrictive tone, causing predictable side effects.',
        remember: 'Alpha-1 blockade relaxes smooth muscle everywhere it’s found — vessels and the prostate — with orthostatic hypotension as the price.',
        items: [
          { term: 'Benign prostatic hyperplasia', why: 'Relaxes prostatic and bladder neck smooth muscle, easing urinary flow.' },
          { term: 'Hypertensive emergency (phentolamine)', why: 'Direct vasodilation rapidly lowers blood pressure, e.g. in pheochromocytoma crisis.' },
          { term: 'Orthostatic hypotension', why: 'Loss of vasoconstrictive tone on standing drops blood pressure.' },
          { term: 'Reflex tachycardia', why: 'Vasodilation triggers baroreceptor-mediated compensatory tachycardia.' },
        ],
      },
      {
        level: 3,
        title: 'Muscarinic antagonist effect',
        explanation:
          'Blocking muscarinic receptors removes parasympathetic tone throughout the body — pupils dilate, secretions dry up, and smooth muscle relaxes.',
        remember: 'Antimuscarinic effects follow one rule: parasympathetic tone is removed everywhere at once.',
        items: [
          { term: 'Mydriasis', why: 'Blocked pupillary sphincter tone leaves the pupil dilated.' },
          { term: 'Dry mouth', why: 'Blocked salivary gland muscarinic receptors reduce secretions.' },
          { term: 'Urinary retention', why: 'Blocked bladder detrusor contraction impairs voiding.' },
          { term: 'Tachycardia', why: 'Blocked vagal tone on the SA node increases heart rate.' },
        ],
      },
      {
        level: 4,
        title: "A drug's effect explained by an unexpected receptor",
        explanation:
          "Each drug's clinically relevant (or surprisingly absent) effect makes sense only once you know exactly which receptor, and where, it's acting on.",
        remember: "A drug's effect is defined by its receptor AND where that receptor sits — same class, different location, very different effect.",
        items: [
          { term: 'Diphenhydramine causing sedation', why: 'Crosses into the CNS and blocks central H1 receptors, causing drowsiness.' },
          { term: 'Clozapine causing weight gain', why: 'Antagonism of H1 and 5-HT2C receptors drives increased appetite.' },
          { term: 'Loperamide avoiding CNS opioid effects', why: "Acts on peripheral mu-opioid receptors in the gut but doesn't cross the blood-brain barrier." },
          { term: 'Ondansetron treating nausea', why: 'Blocks 5-HT3 receptors in the chemoreceptor trigger zone and gut, reducing nausea.' },
        ],
      },
    ],
  },
]

export default systemPuzzles
