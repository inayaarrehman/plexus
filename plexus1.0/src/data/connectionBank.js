// ---------------------------------------------------------------------
// Medical Connection Bank
// ---------------------------------------------------------------------
// This is the raw, reusable content layer the puzzle ASSEMBLER draws from
// (see src/utils/puzzleAssembler.js). It is intentionally separate from
// the playable puzzle schema in src/data/dailyPuzzles.js /
// src/data/systemPuzzles.js: a bank "category" is a single 4-tile
// connection with no knowledge of which other 3 categories it will be
// combined with. The assembler is what turns 4 compatible categories
// (one per difficulty) into an actual playable puzzle object.
//
// Design so hundreds/thousands of categories can be added later without
// touching game logic or UI components: nothing here is imported by
// Game.jsx, Home.jsx, etc. Only the assembler + the (auto-generated)
// puzzles it produces ever reach the player-facing components.
//
// SCHEMA (per category):
//   id              unique string id
//   title           the hidden connection, revealed only after solving
//   tiles           exactly 4 strings, what the player sees on tiles
//   difficulty      'easy' | 'medium' | 'hard' | 'expert'
//   systems         1+ organ systems this category touches (see SYSTEMS
//                   in constants.js) — a category may span more than one
//   connectionType  one of CONNECTION_TYPES (below)
//   explanation     1-2 sentences on why all four tiles belong together
//   tileExplanations  exactly 4 strings, parallel to `tiles` — why THIS
//                   tile specifically belongs to the connection
//   remember        one short, high-yield takeaway sentence
//   tags            concept tags used for Weak Spot tracking (a tile can
//                   plausibly belong to several real-world concepts;
//                   these are the ones this category is really testing)
//   overlapTags     concepts this category's tiles ALSO plausibly relate
//                   to, purely informational — documents *why* a tile
//                   might tempt a player into a wrong grouping when this
//                   category is combined with certain others. Not used
//                   by any validation logic; it's authoring context.
//   status          'verified' | 'needs_review' | 'rejected'
//   notes           optional — why something is needs_review/rejected,
//                   or a caveat worth knowing before publishing
//
// Only 'verified' categories are ever eligible for auto-assembled
// puzzles (see puzzleAssembler.js) or the Daily Puzzle. 'needs_review'
// categories stay in the bank (visible in the Dev Viewer's bank browser)
// rather than being deleted, per the "keep the idea, don't discard it"
// content-development rule.
// ---------------------------------------------------------------------

import migratedBankCategories from './migratedBankCategories.js'
import { SYSTEMS } from './constants.js'

export const CONNECTION_TYPES = [
  'knowledge',
  'mechanism',
  'anatomy',
  'physiology',
  'pathology',
  'microbiology',
  'pharmacology',
  'laboratory',
  'language',
  'visual',
  'timing',
  'cause-effect',
  'meta-wordplay',
  'cross-system',
]

export const DIFFICULTY_TIERS = ['easy', 'medium', 'hard', 'expert']
export const BANK_STATUS = ['verified', 'needs_review', 'rejected']

const connectionBank = [
  // =====================================================================
  // EASY
  // =====================================================================
  {
    id: 'bank-easy-01',
    title: 'Causes of elevated JVP',
    tiles: ['Cardiac tamponade', 'Constrictive pericarditis', 'Right ventricular failure', 'Tricuspid stenosis'],
    difficulty: 'easy',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each raises central venous pressure by impairing right heart filling or output, backing pressure up into the jugular veins.',
    tileExplanations: [
      'Fluid in the pericardial sac compresses the heart and impairs filling, raising venous pressure.',
      'A rigid, thickened pericardium restricts diastolic filling, raising venous pressure.',
      'A failing right ventricle backs pressure up into the venous system.',
      'A narrowed tricuspid valve obstructs right atrial emptying, raising venous pressure upstream.',
    ],
    remember: 'Elevated JVP = something is blocking right-heart filling or failing to pump it forward.',
    tags: ['jvp', 'right-heart', 'venous-pressure'],
    overlapTags: ['pericardial-disease', 'right-heart-failure'],
    status: 'verified',
  },
  {
    id: 'bank-easy-02',
    title: 'QT-prolonging drug classes',
    tiles: ['Sotalol', 'Macrolides', 'Fluoroquinolones', 'Antipsychotics'],
    difficulty: 'easy',
    systems: ['Pharmacology', 'Cardiology'],
    primarySystem: 'Pharmacology',
    secondarySystems: ['Cardiology'],
    connectionType: 'pharmacology',
    explanation: 'Each drug class is a well-recognized cause of QT prolongation, raising torsades de pointes risk.',
    tileExplanations: [
      'A class III antiarrhythmic that blocks potassium channels, directly prolonging repolarization.',
      'This antibiotic class blocks the delayed rectifier potassium current in a dose-related way.',
      'This antibiotic class prolongs the QT interval, especially at higher doses or with other risk factors.',
      'Many first- and second-generation agents in this class block cardiac potassium channels.',
    ],
    remember: 'QT-prolonging drug classes span antiarrhythmics, antibiotics, and antipsychotics — always worth a mental checklist.',
    tags: ['QT_interval', 'antiarrhythmics', 'drug-safety'],
    overlapTags: ['arrhythmia', 'electrolytes'],
    status: 'verified',
  },
  {
    id: 'bank-easy-03',
    title: 'Noncaseating granulomas',
    tiles: ['Sarcoidosis', 'Crohn disease', 'Berylliosis', 'Foreign-body granuloma'],
    difficulty: 'easy',
    systems: ['Immunology', 'Pulmonary', 'GI'],
    primarySystem: 'Immunology',
    secondarySystems: ['Pulmonary','GI'],
    connectionType: 'pathology',
    explanation: 'Each classically forms granulomas without the central necrosis seen in caseating (infectious) granulomas.',
    tileExplanations: [
      'A systemic granulomatous disease of unknown cause, classically noncaseating on biopsy.',
      'Transmural granulomatous inflammation of the GI tract, classically noncaseating.',
      'Chronic beryllium exposure triggers a cell-mediated noncaseating granulomatous reaction.',
      'A retained foreign body provokes a noncaseating granulomatous response around it.',
    ],
    remember: 'Noncaseating granulomas point away from infection — think sarcoid, Crohn, beryllium, or a foreign body.',
    tags: ['granuloma', 'immunology', 'pathology'],
    overlapTags: ['hypercalcemia', 'restrictive-lung-disease', 'pulmonary-disease'],
    status: 'verified',
  },
  {
    id: 'bank-easy-04',
    title: 'Granulomatous infections with necrotizing (caseating) granulomas',
    tiles: ['Tuberculosis', 'Histoplasmosis', 'Coccidioidomycosis', 'Blastomycosis'],
    difficulty: 'easy',
    systems: ['Microbiology', 'Pulmonary'],
    primarySystem: 'Microbiology',
    secondarySystems: ['Pulmonary'],
    connectionType: 'microbiology',
    explanation: 'Each classically produces necrotizing (caseating) granulomas, in contrast to the noncaseating pattern of sarcoid-type disease.',
    tileExplanations: [
      'Mycobacterium tuberculosis is the prototype cause of caseating granulomas.',
      'A dimorphic fungus (endemic to river valleys) that classically causes caseating granulomas resembling TB.',
      'A dimorphic fungus (endemic to the southwestern US) whose granulomas are often described as caseating/necrotizing, though this can vary by lesion.',
      'A dimorphic fungus causing granulomatous, often necrotizing lung and skin disease.',
    ],
    remember: 'Caseating granulomas point toward infection — TB is the prototype, but endemic dimorphic fungi can mimic it.',
    tags: ['granuloma', 'microbiology', 'fungal-infection'],
    overlapTags: ['noncaseating-granuloma', 'pulmonary-nodule'],
    status: 'needs_review',
    notes:
      'Coccidioidomycosis (and to a lesser extent blastomycosis) granulomas are described inconsistently across pathology references as caseating vs. non-caseating/suppurative-granulomatous — worth confirming against a current pathology source before this is eligible for the Daily Puzzle. TB and histoplasmosis are unambiguous.',
  },
  {
    id: 'bank-easy-05',
    title: 'HLA-B27-associated spondyloarthropathies',
    tiles: ['Ankylosing spondylitis', 'Reactive arthritis', 'Psoriatic arthritis', 'IBD-associated arthritis'],
    difficulty: 'easy',
    systems: ['MSK', 'Immunology'],
    primarySystem: 'MSK',
    secondarySystems: ['Immunology'],
    connectionType: 'knowledge',
    explanation:
      'Each belongs to the seronegative spondyloarthropathy family linked to HLA-B27, though the strength of the B27 association varies (strongest in ankylosing spondylitis and reactive arthritis, weaker in psoriatic and IBD-associated arthritis).',
    tileExplanations: [
      'The classic HLA-B27 disease — inflammatory back pain and sacroiliitis.',
      'Post-infectious arthritis (classically after GI or GU infection) with a strong HLA-B27 association.',
      'A seronegative spondyloarthropathy with axial involvement, HLA-B27-associated in its axial form.',
      'Arthritis accompanying IBD, part of the same seronegative spondyloarthropathy spectrum.',
    ],
    remember: 'Seronegative + axial/asymmetric arthritis + HLA-B27 = think spondyloarthropathy, not rheumatoid arthritis.',
    tags: ['HLA-B27', 'spondyloarthropathy', 'rheumatology'],
    overlapTags: ['seronegative-arthritis', 'uveitis'],
    status: 'verified',
  },
  {
    id: 'bank-easy-06',
    title: 'Causes of digital clubbing',
    tiles: ['Lung cancer', 'Cystic fibrosis', 'Bronchiectasis', 'Cyanotic congenital heart disease'],
    difficulty: 'easy',
    systems: ['Pulmonary', 'Cardiology'],
    primarySystem: 'Pulmonary',
    secondarySystems: ['Cardiology'],
    connectionType: 'knowledge',
    explanation: 'Each is a classic cause of digital clubbing, generally via chronic hypoxia or circulating vasodilatory mediators.',
    tileExplanations: [
      'A classic paraneoplastic-adjacent cause of clubbing, especially non-small cell lung cancer.',
      'Chronic suppurative lung disease and hypoxia drive clubbing.',
      'Chronic infection and hypoxia from dilated, damaged airways causes clubbing.',
      'Chronic hypoxemia from right-to-left shunting is a classic pediatric cause of clubbing.',
    ],
    remember: 'Clubbing usually means chronic hypoxia or a hypoxia-adjacent chronic lung/heart process.',
    tags: ['clubbing', 'chronic-hypoxia'],
    overlapTags: ['hypoxemia', 'chronic-lung-disease'],
    status: 'verified',
  },
  {
    id: 'bank-easy-07',
    title: 'Causes of hypercalcemia',
    tiles: ['Primary hyperparathyroidism', 'Malignancy', 'Sarcoidosis', 'Thiazide diuretics'],
    difficulty: 'easy',
    systems: ['Endocrine', 'Renal'],
    primarySystem: 'Endocrine',
    secondarySystems: ['Renal'],
    connectionType: 'knowledge',
    explanation: 'Each raises serum calcium by a different mechanism — excess PTH, PTHrP or bone lysis, excess vitamin D activation, or reduced renal calcium excretion.',
    tileExplanations: [
      'Excess PTH drives bone resorption and renal calcium reabsorption.',
      'PTHrP secretion or direct bone lysis from metastases raises calcium.',
      'Granulomas activate vitamin D, increasing intestinal calcium absorption.',
      'These diuretics reduce renal calcium excretion, raising serum calcium.',
    ],
    remember: 'Hypercalcemia: think excess PTH, malignancy, excess active vitamin D, or a drug that keeps calcium in.',
    tags: ['hypercalcemia', 'calcium-homeostasis'],
    overlapTags: ['granuloma', 'bone-disease'],
    status: 'verified',
  },
  {
    id: 'bank-easy-08',
    title: 'Causes of hypokalemia',
    tiles: ['Loop or thiazide diuretics', 'Hyperaldosteronism', 'Diarrhea', 'Insulin administration'],
    difficulty: 'easy',
    systems: ['Renal', 'Endocrine'],
    primarySystem: 'Renal',
    secondarySystems: ['Endocrine'],
    connectionType: 'knowledge',
    explanation: 'Each lowers serum potassium either by increasing renal or GI losses, or by shifting potassium into cells.',
    tileExplanations: [
      'Increased distal sodium delivery drives renal potassium wasting.',
      'Excess aldosterone increases renal potassium secretion.',
      'GI potassium losses accompany fluid loss in diarrhea.',
      'Insulin drives potassium into cells via the Na+/K+-ATPase, independent of total body potassium.',
    ],
    remember: 'Hypokalemia: losing it (renal or GI) or shifting it into cells — insulin is the classic intracellular shift.',
    tags: ['hypokalemia', 'potassium-homeostasis'],
    overlapTags: ['metabolic-alkalosis', 'diuretics'],
    status: 'verified',
  },
  {
    id: 'bank-easy-09',
    title: 'Nephrotic-pattern glomerular diseases',
    tiles: ['Minimal change disease', 'Focal segmental glomerulosclerosis', 'Membranous nephropathy', 'Diabetic nephropathy'],
    difficulty: 'easy',
    systems: ['Renal'],
    primarySystem: 'Renal',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each damages the glomerular filtration barrier itself, producing heavy proteinuria with relatively bland urine sediment.',
    tileExplanations: [
      'Podocyte foot process effacement causes massive proteinuria, classically in children.',
      'Segmental scarring of some glomeruli, a common cause of nephrotic syndrome in adults.',
      'Subepithelial immune deposits thicken the basement membrane, causing proteinuria.',
      'Chronic hyperglycemia causes glomerular basement membrane thickening and mesangial expansion.',
    ],
    remember: 'Nephrotic pattern = a filtration-barrier problem — heavy proteinuria, bland sediment, edema.',
    tags: ['nephrotic-syndrome', 'glomerular-disease'],
    overlapTags: ['edema', 'proteinuria'],
    status: 'verified',
  },
  {
    id: 'bank-easy-10',
    title: 'Nephritic-pattern glomerular diseases',
    tiles: ['Poststreptococcal glomerulonephritis', 'IgA nephropathy', 'Rapidly progressive glomerulonephritis', 'Alport syndrome'],
    difficulty: 'easy',
    systems: ['Renal'],
    primarySystem: 'Renal',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each causes glomerular inflammation with an active urine sediment — hematuria, red cell casts, and variable proteinuria.',
    tileExplanations: [
      'Immune complex deposition after a streptococcal infection triggers glomerular inflammation.',
      'Mesangial IgA deposition, often presenting with hematuria after a mucosal infection.',
      'Crescent formation on biopsy defines this rapidly progressive, inflammatory pattern.',
      'A hereditary collagen IV defect causing progressive nephritic-pattern kidney disease.',
    ],
    remember: 'Nephritic pattern = an inflammatory glomerular problem — hematuria and red cell casts are the giveaway.',
    tags: ['nephritic-syndrome', 'glomerular-disease'],
    overlapTags: ['hematuria', 'immune-complex-disease'],
    status: 'verified',
  },
  {
    id: 'bank-easy-11',
    title: 'Restrictive lung diseases',
    tiles: ['Idiopathic pulmonary fibrosis', 'Sarcoidosis', 'Silicosis', 'Asbestosis'],
    difficulty: 'easy',
    systems: ['Pulmonary'],
    primarySystem: 'Pulmonary',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each stiffens or scars the lung parenchyma, limiting expansion and reducing total lung capacity with a preserved or high FEV1/FVC ratio.',
    tileExplanations: [
      'Progressive parenchymal scarring of unknown cause stiffens the lungs.',
      'Granulomatous inflammation can progress to pulmonary fibrosis in advanced disease.',
      'Inhaled silica particles provoke fibrotic nodules, classically in the upper lobes.',
      'Inhaled asbestos fibers cause lower-lobe-predominant pulmonary fibrosis.',
    ],
    remember: 'Restrictive disease = hard to get air IN — a scarred or occupational-exposure lung, low TLC.',
    tags: ['restrictive-lung-disease', 'pulmonary-fibrosis'],
    overlapTags: ['granuloma', 'occupational-exposure'],
    status: 'verified',
  },
  {
    id: 'bank-easy-12',
    title: 'Obstructive lung diseases',
    tiles: ['Asthma', 'COPD', 'Bronchiectasis', 'Cystic fibrosis'],
    difficulty: 'easy',
    systems: ['Pulmonary'],
    primarySystem: 'Pulmonary',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each narrows the airways, trapping air and slowing exhalation — a reduced FEV1/FVC ratio.',
    tileExplanations: [
      'Reversible bronchoconstriction and airway inflammation narrow the airways.',
      'Chronic airway inflammation and alveolar destruction impair airflow, especially on exhalation.',
      'Permanently dilated, damaged airways trap mucus and obstruct airflow.',
      'Thick mucus plugs and damages airways, causing chronic obstruction.',
    ],
    remember: 'Obstructive disease = hard to get air OUT — low FEV1/FVC is the signature.',
    tags: ['obstructive-lung-disease', 'airflow-limitation'],
    overlapTags: ['chronic-hypoxia', 'clubbing'],
    status: 'verified',
  },
  {
    id: 'bank-easy-13',
    title: 'Causes of acute pancreatitis',
    tiles: ['Gallstones', 'Alcohol use', 'Hypertriglyceridemia', 'Hypercalcemia'],
    difficulty: 'easy',
    systems: ['GI'],
    primarySystem: 'GI',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each is a well-established trigger of acinar cell injury and premature enzyme activation in the pancreas.',
    tileExplanations: [
      'The single most common cause — a stone obstructing the ampulla triggers pancreatitis.',
      'The second most common cause, via direct acinar toxicity and duct effects.',
      'Severe elevation (often >1000 mg/dL) directly injures acinar cells.',
      'Calcium can activate trypsinogen prematurely within the pancreas.',
    ],
    remember: 'The big two causes of pancreatitis are gallstones and alcohol — the rest is a shorter differential.',
    tags: ['pancreatitis', 'GI'],
    overlapTags: ['hypercalcemia'],
    status: 'verified',
  },
  {
    id: 'bank-easy-14',
    title: 'Causes of secondary hypertension',
    tiles: ['Renal artery stenosis', 'Pheochromocytoma', 'Cushing syndrome', 'Primary hyperaldosteronism'],
    difficulty: 'easy',
    systems: ['Cardiology', 'Endocrine', 'Renal'],
    primarySystem: 'Endocrine',
    secondarySystems: ['Cardiology','Renal'],
    connectionType: 'knowledge',
    explanation: 'Each is an identifiable, potentially reversible cause of hypertension rather than primary (essential) hypertension.',
    tileExplanations: [
      'Reduced renal perfusion activates the renin-angiotensin system, raising blood pressure.',
      'Catecholamine excess from an adrenal medullary tumor raises blood pressure, often episodically.',
      'Excess cortisol raises blood pressure through several mineralocorticoid-adjacent effects.',
      'Excess aldosterone drives sodium and water retention, raising blood pressure.',
    ],
    remember: 'Secondary hypertension has a name and a mechanism — always worth screening for it when the picture is atypical.',
    tags: ['secondary-hypertension', 'endocrine-hypertension'],
    overlapTags: ['hypokalemia', 'adrenal-disease'],
    status: 'verified',
  },
  {
    id: 'bank-easy-15',
    title: 'Cyanotic congenital heart disease',
    tiles: ['Tetralogy of Fallot', 'Transposition of the great arteries', 'Truncus arteriosus', 'Tricuspid atresia'],
    difficulty: 'easy',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each allows deoxygenated blood to reach the systemic circulation, causing cyanosis from birth or early infancy.',
    tileExplanations: [
      'Right-to-left shunting through a VSD, worsened by RV outflow obstruction, causes cyanosis.',
      'The aorta and pulmonary artery are swapped, so systemic and pulmonic circulations run in parallel.',
      'A single great vessel receives blood from both ventricles, mixing oxygenated and deoxygenated blood.',
      'An absent tricuspid valve forces right-to-left shunting at the atrial level.',
    ],
    remember: 'Cyanotic congenital heart disease means deoxygenated blood is reaching the systemic circulation somewhere.',
    tags: ['congenital-heart-disease', 'cyanosis'],
    overlapTags: ['clubbing', 'shunt-physiology'],
    status: 'verified',
  },

  // =====================================================================
  // MEDIUM
  // =====================================================================
  {
    id: 'bank-medium-01',
    title: 'Gs-coupled receptors (increased cAMP)',
    tiles: ['β1 receptor', 'β2 receptor', 'D1 receptor', 'H2 receptor'],
    difficulty: 'medium',
    systems: ['Pharmacology'],
    primarySystem: 'Pharmacology',
    secondarySystems: [],
    connectionType: 'mechanism',
    explanation: 'Each couples to Gs, activating adenylyl cyclase and raising intracellular cAMP.',
    tileExplanations: [
      'Increases heart rate and contractility via Gs/cAMP.',
      'Relaxes bronchial and vascular smooth muscle via Gs/cAMP.',
      'Relaxes renal vascular smooth muscle via Gs/cAMP.',
      'Increases gastric acid secretion via Gs/cAMP.',
    ],
    remember: 'Gs raises cAMP — β1, β2, D1, and H2 all push the same intracellular lever.',
    tags: ['G-protein-coupled-receptors', 'second-messengers', 'pharmacology'],
    overlapTags: ['autonomic-pharmacology'],
    status: 'verified',
  },
  {
    id: 'bank-medium-02',
    title: 'Gq-coupled receptors',
    tiles: ['α1 receptor', 'H1 receptor', 'V1 receptor', 'M1 receptor'],
    difficulty: 'medium',
    systems: ['Pharmacology'],
    primarySystem: 'Pharmacology',
    secondarySystems: [],
    connectionType: 'mechanism',
    explanation: 'Each couples to Gq, activating phospholipase C to raise IP3 and intracellular calcium.',
    tileExplanations: [
      'Contracts vascular smooth muscle via Gq/IP3/calcium.',
      'Contracts smooth muscle and increases vascular permeability via Gq.',
      'Contracts vascular smooth muscle (vasopressin) via Gq.',
      'Stimulates gastric acid secretion and CNS effects via Gq.',
    ],
    remember: 'Gq raises IP3/calcium — α1, H1, V1, and M1 all share this pathway.',
    tags: ['G-protein-coupled-receptors', 'second-messengers', 'pharmacology'],
    overlapTags: ['autonomic-pharmacology'],
    status: 'verified',
  },
  {
    id: 'bank-medium-03',
    title: 'Gi-coupled receptors',
    tiles: ['α2 receptor', 'M2 receptor', 'D2 receptor', 'Somatostatin receptor'],
    difficulty: 'medium',
    systems: ['Pharmacology'],
    primarySystem: 'Pharmacology',
    secondarySystems: [],
    connectionType: 'mechanism',
    explanation: 'Each couples to Gi, inhibiting adenylyl cyclase and lowering intracellular cAMP.',
    tileExplanations: [
      'Inhibits further norepinephrine release via Gi (presynaptic autoreceptor).',
      'Slows heart rate via Gi in the SA/AV node.',
      'Inhibits dopaminergic signaling via Gi, the main antipsychotic drug target.',
      'Broadly inhibits hormone release throughout the gut and endocrine system via Gi.',
    ],
    remember: 'Gi lowers cAMP — α2, M2, D2, and somatostatin receptors all put the brakes on.',
    tags: ['G-protein-coupled-receptors', 'second-messengers', 'pharmacology'],
    overlapTags: ['autonomic-pharmacology'],
    status: 'verified',
  },
  {
    id: 'bank-medium-04',
    title: 'Structures traversing the cavernous sinus',
    tiles: ['CN III', 'CN IV', 'CN V1', 'CN VI'],
    difficulty: 'medium',
    systems: ['Neurology'],
    primarySystem: 'Neurology',
    secondarySystems: [],
    connectionType: 'anatomy',
    explanation:
      'All four pass through the cavernous sinus region, though not identically: CN III, IV, and V1 run in the lateral wall, while CN VI runs freely through the sinus itself alongside the internal carotid artery — which is why isolated CN VI palsy is the most common finding in cavernous sinus pathology.',
    tileExplanations: [
      'Runs in the lateral wall of the cavernous sinus.',
      'Runs in the lateral wall of the cavernous sinus, superior to CN III.',
      'The ophthalmic division of the trigeminal nerve runs in the lateral wall.',
      'Runs through the body of the sinus itself, making it the most vulnerable to compression.',
    ],
    remember: "CN VI runs through the cavernous sinus proper; III, IV, and V1 run in its lateral wall — that's why CN VI palsy is the classic early sign.",
    tags: ['cavernous-sinus', 'cranial-nerves', 'skull-base-anatomy'],
    overlapTags: ['diplopia', 'orbital-anatomy'],
    status: 'verified',
  },
  {
    id: 'bank-medium-05',
    title: 'External carotid artery branches',
    tiles: ['Facial artery', 'Lingual artery', 'Maxillary artery', 'Superior thyroid artery'],
    difficulty: 'medium',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'anatomy',
    explanation: 'Each is a direct branch of the external carotid artery, supplying the face, tongue, deep face/skull base, or thyroid.',
    tileExplanations: [
      'Supplies the face, crossing the mandible near the masseter.',
      'Supplies the tongue and floor of the mouth.',
      'The largest terminal branch, supplying the deep face and meninges (middle meningeal artery).',
      'The first anterior branch, supplying the thyroid gland and larynx.',
    ],
    remember: 'The external carotid feeds the face and neck structures — the internal carotid feeds the brain and orbit.',
    tags: ['carotid-anatomy', 'head-and-neck'],
    overlapTags: ['vascular-anatomy'],
    status: 'verified',
  },
  {
    id: 'bank-medium-06',
    title: 'Neural crest derivatives',
    tiles: ['Melanocytes', 'Schwann cells', 'Adrenal medulla', 'Peripheral autonomic ganglia'],
    difficulty: 'medium',
    systems: ['Biochemistry/Genetics'],
    primarySystem: 'Biochemistry/Genetics',
    secondarySystems: [],
    connectionType: 'anatomy',
    explanation: 'Each arises embryologically from neural crest cells, which migrate widely and give rise to diverse peripheral tissues.',
    tileExplanations: [
      'Pigment-producing skin cells derived from migrating neural crest.',
      'Peripheral nervous system myelinating cells derived from neural crest.',
      'A modified sympathetic ganglion, derived from neural crest, that secretes catecholamines.',
      'Sympathetic and parasympathetic ganglia derive from neural crest cells.',
    ],
    remember: 'Neural crest travels far — skin pigment, peripheral nerve support cells, and the adrenal medulla all trace back to it.',
    tags: ['embryology', 'neural-crest'],
    overlapTags: ['pheochromocytoma'],
    status: 'verified',
  },
  {
    id: 'bank-medium-07',
    title: 'Endoderm-derived tissues',
    tiles: ['Thyroid follicular cells', 'Hepatocytes', 'Pancreatic epithelium', 'Respiratory epithelium'],
    difficulty: 'medium',
    systems: ['Biochemistry/Genetics'],
    primarySystem: 'Biochemistry/Genetics',
    secondarySystems: [],
    connectionType: 'anatomy',
    explanation: 'Each arises from embryonic endoderm, the germ layer that lines the gut tube and its outgrowths.',
    tileExplanations: [
      'The thyroid develops from an endodermal outpouching of the pharynx.',
      'The liver develops from an endodermal bud of the foregut.',
      'The pancreas develops from endodermal buds of the foregut.',
      'The lung develops as an endodermal outgrowth of the foregut.',
    ],
    remember: 'Endoderm becomes the gut tube and everything that buds off it — liver, pancreas, thyroid, lungs.',
    tags: ['embryology', 'germ-layers'],
    overlapTags: ['organogenesis'],
    status: 'verified',
  },
  {
    id: 'bank-medium-08',
    title: 'Systolic murmurs',
    tiles: ['Aortic stenosis', 'Mitral regurgitation', 'Tricuspid regurgitation', 'Hypertrophic cardiomyopathy'],
    difficulty: 'medium',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'physiology',
    explanation: 'Each murmur occurs between S1 and S2, during ventricular contraction and ejection or leakage.',
    tileExplanations: [
      'A narrowed valve makes the LV work harder to eject blood, all in systole.',
      'Blood leaks backward into the left atrium during systole.',
      'Blood leaks backward into the right atrium during systole.',
      'Dynamic outflow obstruction from the hypertrophied septum produces a systolic murmur.',
    ],
    remember: 'Systolic murmurs happen while the ventricle squeezes — regurgitant AV valves and outflow obstruction both fit.',
    tags: ['heart-murmurs', 'cardiac-auscultation'],
    overlapTags: ['valvular-disease'],
    status: 'verified',
  },
  {
    id: 'bank-medium-09',
    title: 'Diastolic murmurs',
    tiles: ['Aortic regurgitation', 'Pulmonic regurgitation', 'Mitral stenosis', 'Tricuspid stenosis'],
    difficulty: 'medium',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'physiology',
    explanation: 'Each occurs between S2 and S1, while the ventricles fill — either a leaking outflow valve or a narrowed inflow valve.',
    tileExplanations: [
      'Blood leaks backward from the aorta into the LV during diastole.',
      'Blood leaks backward from the pulmonary artery into the RV during diastole.',
      'A narrowed valve obstructs left atrial-to-ventricular filling during diastole.',
      'A narrowed valve obstructs right atrial-to-ventricular filling during diastole.',
    ],
    remember: 'Diastolic murmurs point to filling problems — a leaky outflow valve or a stiff inflow valve.',
    tags: ['heart-murmurs', 'cardiac-auscultation'],
    overlapTags: ['valvular-disease'],
    status: 'verified',
  },
  {
    id: 'bank-medium-10',
    title: 'Causes of a widened pulse pressure',
    tiles: ['Aortic regurgitation', 'Patent ductus arteriosus', 'Hyperthyroidism', 'Exercise'],
    difficulty: 'medium',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'physiology',
    explanation: 'Each raises stroke volume, lowers diastolic pressure via runoff, or both — widening the gap between systolic and diastolic pressure.',
    tileExplanations: [
      'Diastolic runoff back into the LV drops diastolic pressure.',
      'A left-to-right shunt creates continuous diastolic runoff, dropping diastolic pressure.',
      'Increased contractility and reduced systemic vascular resistance widen the pulse pressure.',
      'Increased stroke volume with vasodilation in working muscle widens the pulse pressure.',
    ],
    remember: 'A wide pulse pressure means high flow or a leaky diastolic runoff.',
    tags: ['pulse-pressure', 'cardiovascular-physiology'],
    overlapTags: ['valvular-disease'],
    status: 'verified',
  },
  {
    id: 'bank-medium-11',
    title: 'Causes of pulsus paradoxus',
    tiles: ['Cardiac tamponade', 'Severe asthma exacerbation', 'Tension pneumothorax', 'Massive pulmonary embolism'],
    difficulty: 'medium',
    systems: ['Cardiology', 'Pulmonary'],
    primarySystem: 'Cardiology',
    secondarySystems: ['Pulmonary'],
    connectionType: 'physiology',
    explanation: 'Each exaggerates the normal inspiratory drop in systolic blood pressure, either by restricting ventricular filling or from large intrathoracic pressure swings during labored breathing.',
    tileExplanations: [
      'Pericardial fluid restricts filling enough that inspiration further compromises the LV.',
      'Large negative intrathoracic pressure swings during labored breathing exaggerate the effect.',
      'Elevated intrathoracic pressure and impaired venous return exaggerate the effect.',
      'Acute right heart strain from a large clot can exaggerate ventricular interdependence effects.',
    ],
    remember: 'Pulsus paradoxus = an exaggerated inspiratory drop in blood pressure — tamponade is the classic cause, but it is not the only one.',
    tags: ['pulsus-paradoxus', 'cardiovascular-physiology'],
    overlapTags: ['elevated-jvp', 'obstructive-shock'],
    status: 'verified',
  },
  {
    id: 'bank-medium-12',
    title: 'Hypocomplementemic diseases',
    tiles: ['Systemic lupus erythematosus', 'Poststreptococcal glomerulonephritis', 'Membranoproliferative glomerulonephritis', 'Cryoglobulinemia'],
    difficulty: 'medium',
    systems: ['Immunology', 'Renal'],
    primarySystem: 'Immunology',
    secondarySystems: ['Renal'],
    connectionType: 'laboratory',
    explanation: 'Each consumes complement through immune-complex-mediated activation, producing low serum C3/C4.',
    tileExplanations: [
      'Immune complexes activate and consume complement, lowering C3/C4.',
      'Immune complex deposition after streptococcal infection consumes complement.',
      'Immune complex deposition in the glomerulus consumes complement.',
      'Circulating immune complexes (cryoglobulins) consume complement.',
    ],
    remember: 'Low complement points to immune-complex disease consuming it — SLE, PSGN, MPGN, and cryoglobulinemia are the classic four.',
    tags: ['complement', 'immune-complex-disease'],
    overlapTags: ['nephritic-syndrome'],
    status: 'verified',
  },
  {
    id: 'bank-medium-13',
    title: 'Causes of eosinophilia',
    tiles: ['Parasitic infection', 'Asthma', 'Drug hypersensitivity reaction', 'Eosinophilic granulomatosis with polyangiitis'],
    difficulty: 'medium',
    systems: ['Immunology', 'Pulmonary'],
    primarySystem: 'Immunology',
    secondarySystems: ['Pulmonary'],
    connectionType: 'laboratory',
    explanation: 'Each is a classic trigger of peripheral eosinophilia, spanning infectious, allergic, drug-related, and autoimmune causes.',
    tileExplanations: [
      'Invasive helminths classically trigger a marked eosinophilic response.',
      'Type 2 (allergic) airway inflammation drives eosinophil recruitment.',
      'A hypersensitivity reaction to a drug can trigger eosinophilia, sometimes with rash and organ involvement (DRESS).',
      'A small-vessel vasculitis with asthma, eosinophilia, and granulomatous inflammation.',
    ],
    remember: 'Think "PACE" for eosinophilia — parasites, allergy/asthma, connective tissue/drug reaction, EGPA.',
    tags: ['eosinophilia', 'laboratory'],
    overlapTags: ['asthma', 'vasculitis'],
    status: 'verified',
  },
  {
    id: 'bank-medium-14',
    title: 'Causes of metabolic alkalosis',
    tiles: ['Vomiting', 'Loop or thiazide diuretics', 'Hyperaldosteronism', 'Bartter syndrome'],
    difficulty: 'medium',
    systems: ['Renal'],
    primarySystem: 'Renal',
    secondarySystems: [],
    connectionType: 'physiology',
    explanation: 'Each generates or maintains metabolic alkalosis, chiefly through loss of acid or volume-mediated bicarbonate retention.',
    tileExplanations: [
      'Loss of gastric HCl directly generates alkalosis.',
      'Volume contraction and potassium loss maintain alkalosis (contraction alkalosis).',
      'Excess aldosterone increases distal H+ and K+ secretion, generating alkalosis.',
      'A hereditary loop-transporter defect mimics chronic loop-diuretic use, causing alkalosis.',
    ],
    remember: 'Metabolic alkalosis is usually about acid loss (vomiting) or volume/aldosterone-driven bicarbonate retention.',
    tags: ['acid-base', 'metabolic-alkalosis'],
    overlapTags: ['hypokalemia'],
    status: 'verified',
  },
  {
    id: 'bank-medium-15',
    title: 'Causes of type IV renal tubular acidosis',
    tiles: ['Diabetic nephropathy', 'ACE inhibitors', 'NSAIDs', 'Primary adrenal insufficiency'],
    difficulty: 'medium',
    systems: ['Renal', 'Endocrine'],
    primarySystem: 'Renal',
    secondarySystems: ['Endocrine'],
    connectionType: 'physiology',
    explanation: 'Each causes hypoaldosteronism or aldosterone resistance, producing the hallmark hyperkalemic, non-anion-gap metabolic acidosis of type IV RTA.',
    tileExplanations: [
      'Hyporeninemic hypoaldosteronism is a classic complication of diabetic kidney disease.',
      'Reduced angiotensin II lowers aldosterone secretion.',
      'Reduced renal prostaglandins lower renin and aldosterone secretion.',
      'Direct aldosterone deficiency from adrenal failure.',
    ],
    remember: 'Type IV RTA = too little aldosterone effect, so potassium and acid both build up.',
    tags: ['acid-base', 'renal-tubular-acidosis'],
    overlapTags: ['hyperkalemia'],
    status: 'verified',
  },
  {
    id: 'bank-medium-16',
    title: 'Causes of high-output heart failure',
    tiles: ['Severe anemia', 'Thyrotoxicosis', 'Arteriovenous fistula', 'Thiamine deficiency (beriberi)'],
    difficulty: 'medium',
    systems: ['Cardiology'],
    primarySystem: 'Cardiology',
    secondarySystems: [],
    connectionType: 'physiology',
    explanation: 'Each lowers effective systemic vascular resistance or tissue oxygen delivery, forcing cardiac output up until the heart eventually cannot keep pace.',
    tileExplanations: [
      'Reduced oxygen-carrying capacity forces compensatory increases in cardiac output.',
      'Increased metabolic demand and reduced vascular resistance raise cardiac output.',
      'A low-resistance shunt increases venous return and cardiac output.',
      'Impaired oxidative metabolism and peripheral vasodilation raise cardiac output (wet beriberi).',
    ],
    remember: 'High-output heart failure: the heart is failing from working too hard against low resistance, not from weak contractility.',
    tags: ['heart-failure', 'cardiovascular-physiology'],
    overlapTags: ['wide-pulse-pressure'],
    status: 'verified',
  },

  // =====================================================================
  // HARD
  // =====================================================================
  {
    id: 'bank-hard-01',
    title: '___ body',
    tiles: ['Lewy', 'Heinz', 'Howell-Jolly', 'Psammoma'],
    difficulty: 'hard',
    // Deliberately cross-field wordplay (Neuro/Heme/Path), same as its
    // sibling "___ triad"/"___ sign" categories — tagged as a single
    // Mixed/Step Review category rather than multi-tagged to 3 systems,
    // since no single tile is really "Biochemistry/Genetics" (a content
    // audit found that tag didn't fit any of the 4 tiles).
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym/term is followed by "body" in pathology, despite describing completely unrelated structures.',
    tileExplanations: [
      'Lewy body — an intraneuronal alpha-synuclein aggregate seen in Parkinson disease and Lewy body dementia.',
      'Heinz body — denatured, precipitated hemoglobin seen in G6PD deficiency.',
      'Howell-Jolly body — a nuclear remnant in red cells seen after splenectomy or in asplenia.',
      'Psammoma body — a concentric, laminated calcification seen in papillary thyroid cancer, meningioma, and serous ovarian tumors.',
    ],
    remember: '"___ body" spans four unrelated fields — the suffix is doing all the connecting, not the biology.',
    tags: ['eponyms', 'histopathology', 'terminology'],
    overlapTags: ['inclusion-bodies'],
    status: 'verified',
  },
  {
    id: 'bank-hard-02',
    title: '___ triad',
    tiles: ['Virchow', 'Charcot', 'Beck', 'Whipple'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym names a classic three-part clinical or pathophysiologic triad.',
    tileExplanations: [
      'Virchow triad — stasis, endothelial injury, hypercoagulability (thrombosis risk factors).',
      'Charcot triad — fever, jaundice, RUQ pain (ascending cholangitis).',
      'Beck triad — hypotension, JVD, muffled heart sounds (cardiac tamponade).',
      "Whipple triad — hypoglycemic symptoms, low glucose, relief with glucose (confirms hypoglycemia's cause).",
    ],
    remember: 'A triad eponym is a memory shortcut — three findings, one diagnosis.',
    tags: ['eponyms', 'clinical-triads', 'terminology'],
    overlapTags: ['diagnostic-criteria'],
    status: 'verified',
  },
  {
    id: 'bank-hard-03',
    title: '___ nodes',
    tiles: ['Osler', 'Heberden', 'Bouchard', 'Virchow'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym is followed by "node(s)" but describes findings across completely different diseases.',
    tileExplanations: [
      "Osler nodes — tender nodules on fingers/toes in infective endocarditis (immune complex-mediated).",
      'Heberden nodes — bony DIP joint nodules in osteoarthritis.',
      'Bouchard nodes — bony PIP joint nodules in osteoarthritis.',
      'Virchow node — a firm left supraclavicular lymph node, classically from metastatic gastric cancer.',
    ],
    remember: 'DIP is Heberden, PIP is Bouchard — Osler nodes are tender (endocarditis), Virchow node is a lymph node (malignancy).',
    tags: ['eponyms', 'terminology'],
    overlapTags: ['osteoarthritis', 'endocarditis'],
    status: 'verified',
  },
  {
    id: 'bank-hard-04',
    title: '___ spots',
    tiles: ['Roth', 'Koplik', 'Bitot', 'Brushfield'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym is followed by "spots," each describing a completely different finding on exam.',
    tileExplanations: [
      'Roth spots — retinal hemorrhages with pale centers, seen in infective endocarditis.',
      'Koplik spots — small white oral lesions preceding the measles rash.',
      'Bitot spots — foamy conjunctival patches from vitamin A deficiency.',
      "Brushfield spots — light-colored iris spots associated with Down syndrome.",
    ],
    remember: 'Four "spots," four different organ systems — the finding, not the word, is what identifies the disease.',
    tags: ['eponyms', 'physical-exam', 'terminology'],
    overlapTags: ['endocarditis'],
    status: 'verified',
  },
  {
    id: 'bank-hard-05',
    title: '___ lines',
    tiles: ['Kerley B', 'Pastia', 'Beau', 'Blaschko'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym/term is followed by "lines," describing unrelated radiographic, dermatologic, or nail findings.',
    tileExplanations: [
      'Kerley B lines — short horizontal lines on chest X-ray from interstitial pulmonary edema.',
      "Pastia lines — linear petechiae in skin folds, seen in scarlet fever.",
      'Beau lines — transverse nail ridges from a systemic illness that paused nail growth.',
      "Blaschko lines — developmental skin lines that some mosaic skin conditions follow.",
    ],
    remember: 'Four "lines," four different exams — chest X-ray, skin folds, nails, and dermatomal-like skin patterning.',
    tags: ['eponyms', 'terminology'],
    overlapTags: ['pulmonary-edema'],
    status: 'verified',
  },
  {
    id: 'bank-hard-06',
    title: '___ sign',
    tiles: ['Murphy', 'Kernig', 'Babinski', 'Trousseau'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym is followed by "sign," each testing a completely different organ system on exam.',
    tileExplanations: [
      'Murphy sign — inspiratory arrest on RUQ palpation, seen in cholecystitis.',
      'Kernig sign — resistance to knee extension with the hip flexed, seen in meningitis.',
      'Babinski sign — great toe extension with plantar stimulation, an upper motor neuron sign.',
      'Trousseau sign (of latent tetany) — carpal spasm with blood pressure cuff inflation, seen in hypocalcemia.',
    ],
    remember: 'Four "signs," four systems — gallbladder, meninges, corticospinal tract, and calcium homeostasis.',
    tags: ['eponyms', 'physical-exam', 'terminology'],
    overlapTags: ['meningitis', 'hypocalcemia'],
    status: 'verified',
  },
  {
    id: 'bank-hard-07',
    title: '___ phenomenon',
    tiles: ['Raynaud', 'Koebner', 'Arthus', 'Somogyi'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each eponym is followed by "phenomenon," describing unrelated vascular, dermatologic, immunologic, or endocrine findings.',
    tileExplanations: [
      'Raynaud phenomenon — episodic digital vasospasm triggered by cold or stress.',
      'Koebner phenomenon — new skin lesions at sites of trauma, seen in psoriasis and lichen planus.',
      'Arthus phenomenon — a local type III hypersensitivity reaction to a repeated antigen injection.',
      'Somogyi phenomenon — rebound morning hyperglycemia after nocturnal hypoglycemia.',
    ],
    remember: 'Four "phenomena," four mechanisms — vasospasm, koebnerization, immune complex injury, and counter-regulatory hormone rebound.',
    tags: ['eponyms', 'terminology'],
    overlapTags: ['autoimmune-disease'],
    status: 'verified',
  },
  {
    id: 'bank-hard-08',
    title: 'Portal ___',
    tiles: ['vein', 'hypertension', 'triad', 'circulation'],
    difficulty: 'hard',
    systems: ['GI'],
    primarySystem: 'GI',
    secondarySystems: [],
    connectionType: 'meta-wordplay',
    explanation: 'Each term follows "portal" in hepatic anatomy/physiology, unlike the eponym-suffix categories — here the shared word comes first.',
    tileExplanations: [
      'Portal vein — carries nutrient-rich blood from the gut to the liver.',
      'Portal hypertension — elevated pressure in the portal venous system, classically from cirrhosis.',
      'Portal triad — the bile duct, hepatic artery, and portal vein found together in each hepatic lobule.',
      'Portal circulation — a venous system draining into a second capillary bed instead of directly to the heart.',
    ],
    remember: '"Portal" describes hepatic venous anatomy and its consequences — vein, pressure, triad, and circulation are all connected to it.',
    tags: ['liver-anatomy', 'terminology'],
    overlapTags: ['cirrhosis'],
    status: 'verified',
  },
  {
    id: 'bank-hard-09',
    title: 'Food/color-based pathology descriptions',
    tiles: ['Nutmeg liver', 'Currant jelly stool', 'Blueberry muffin rash', 'Chocolate cyst'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'visual',
    explanation: 'Each is a memorable food-based descriptor for a specific gross pathology finding.',
    tileExplanations: [
      'Nutmeg liver — a mottled cut surface from chronic passive congestion, resembling a cut nutmeg seed.',
      'Currant jelly stool — dark red, mucoid stool classically seen in intussusception.',
      'Blueberry muffin rash — bluish-purple dermal nodules from extramedullary hematopoiesis in congenital infection.',
      'Chocolate cyst — a blood-filled ovarian cyst from endometriosis, so-named for its dark, thickened contents.',
    ],
    remember: 'Food-based descriptors are a shortcut to a gross-pathology image — picture the food, then picture the disease.',
    tags: ['gross-pathology', 'visual-descriptors'],
    overlapTags: ['color-based-descriptors'],
    status: 'needs_review',
    notes: 'Content audit: the food-vs-color split is weaker than intended — 3 of the 4 "color-based" tiles (bank-hard-10) are themselves fruit/food names (strawberry, cherry, peau d\'orange evokes citrus peel), so a tile could plausibly sort into either category. Needs the distinguishing axis redefined (e.g. "names a specific food/dish" vs. "names only a color") before re-verifying alongside bank-hard-10.',
  },
  {
    id: 'bank-hard-10',
    title: 'Color-based pathology descriptions',
    tiles: ['Strawberry tongue', 'Apple-green birefringence', "Peau d'orange skin", 'Cherry-red spot'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'visual',
    explanation: 'Each is a memorable color-based descriptor tied to one specific diagnosis or finding.',
    tileExplanations: [
      'Strawberry tongue — a red, bumpy tongue seen in scarlet fever and Kawasaki disease.',
      'Apple-green birefringence — Congo red-stained amyloid viewed under polarized light.',
      "Peau d'orange skin — dimpled, orange-peel-like skin from dermal lymphatic obstruction (classically inflammatory breast cancer).",
      'Cherry-red spot — a bright red macula against a pale retina, seen in central retinal artery occlusion or Tay-Sachs disease.',
    ],
    remember: 'A color-based descriptor is doing the same job as a food-based one — picture it, then picture the disease.',
    tags: ['gross-pathology', 'visual-descriptors'],
    overlapTags: ['food-based-descriptors'],
    status: 'needs_review',
    notes: 'Content audit: paired with bank-hard-09 — several tiles here (strawberry, cherry, peau d\'orange) are themselves food/fruit-derived names, so the food-vs-color boundary against bank-hard-09 is ambiguous. Needs the distinguishing axis redefined before re-verifying.',
  },
  {
    id: 'bank-hard-11',
    title: 'Star-related medical terminology',
    tiles: ['Stellate cells', 'Starry-sky appearance', 'Stellate scar', 'Stellate ganglion'],
    difficulty: 'hard',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each term uses "star"-rooted language (stellate/starry) to describe a completely different structure or finding.',
    tileExplanations: [
      'Stellate (hepatic) cells — star-shaped liver cells that store vitamin A and drive fibrosis when activated.',
      'Starry-sky appearance — pale macrophages scattered among dark lymphoma cells, classic for Burkitt lymphoma.',
      'Stellate scar — a star-shaped fibrous scar seen in hepatocellular adenoma/focal nodular hyperplasia and radial scars of the breast.',
      'Stellate ganglion — a sympathetic ganglion in the neck, a target for nerve blocks in CRPS and some arrhythmias.',
    ],
    remember: '"Stellate/starry" language shows up in liver histology, lymphoma histology, imaging, and neuroanatomy alike.',
    tags: ['terminology', 'histopathology'],
    overlapTags: ['liver-pathology'],
    status: 'verified',
  },

  // =====================================================================
  // EXPERT
  // =====================================================================
  {
    id: 'bank-expert-01',
    title: 'Starts with "hyper-" but produces a LOW value',
    tiles: ['Hyperventilation', 'Primary hyperparathyroidism', 'Hyperaldosteronism', 'Hyperinsulinemia'],
    difficulty: 'expert',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'meta-wordplay',
    explanation: 'Each condition\'s name describes what is elevated, but its downstream physiologic effect is a DECREASE in a different measured value.',
    tileExplanations: [
      'Excess ventilation blows off CO2, lowering PaCO2.',
      'Excess PTH increases renal phosphate wasting, lowering serum phosphate.',
      'Excess aldosterone increases renal potassium secretion, lowering serum potassium.',
      'Excess insulin drives cellular glucose uptake, lowering serum glucose.',
    ],
    remember: 'The prefix names what is increased — the physiologic consequence can still be a decrease in something else entirely.',
    tags: ['acid-base', 'endocrine-feedback', 'terminology'],
    overlapTags: ['electrolytes'],
    status: 'verified',
  },
  {
    id: 'bank-expert-02',
    title: 'Starts with "hypo-" but produces a HIGH value',
    tiles: ['Hypoventilation', 'Hypoaldosteronism', 'Primary hypothyroidism', 'Hypoparathyroidism'],
    difficulty: 'expert',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'meta-wordplay',
    explanation: 'Each condition\'s name describes what is reduced, but its downstream physiologic effect is an INCREASE in a different measured value.',
    tileExplanations: [
      'Reduced ventilation retains CO2, raising PaCO2.',
      'Reduced aldosterone impairs renal potassium excretion, raising serum potassium.',
      'A failing thyroid gland removes negative feedback, raising TSH.',
      'Reduced PTH impairs renal phosphate excretion, raising serum phosphate.',
    ],
    remember: 'The mirror image of the "hyper-" category — a deficiency name can still describe something rising downstream.',
    tags: ['acid-base', 'endocrine-feedback', 'terminology'],
    overlapTags: ['electrolytes'],
    status: 'verified',
  },
  {
    id: 'bank-expert-03',
    title: 'Excess hormone that suppresses its own upstream signal',
    tiles: ['Exogenous corticosteroids', 'Levothyroxine overreplacement', 'Anabolic steroid use', 'Estrogen-containing oral contraceptives'],
    difficulty: 'expert',
    systems: ['Endocrine'],
    primarySystem: 'Endocrine',
    secondarySystems: [],
    connectionType: 'physiology',
    explanation: 'Each floods the body with an end-organ hormone (or its analog), which negative-feedback-suppresses the pituitary/hypothalamic signal that would normally drive its own production.',
    tileExplanations: [
      'Exogenous glucocorticoids suppress CRH and ACTH, risking adrenal insufficiency on withdrawal.',
      'Excess thyroid hormone suppresses TSH, the classic cause of a low TSH with a normal gland.',
      'Exogenous testosterone suppresses GnRH-driven LH/FSH, shutting down endogenous testosterone and sperm production.',
      'Exogenous estrogen suppresses GnRH-driven FSH/LH, the basis of hormonal contraception.',
    ],
    remember: 'Flooding the body with an end-hormone always risks shutting off the axis that normally makes it.',
    tags: ['endocrine-feedback', 'hpa-axis', 'hpt-axis', 'hpg-axis'],
    overlapTags: ['adrenal-insufficiency'],
    status: 'verified',
  },
  {
    id: 'bank-expert-04',
    title: 'Diseases named after geographic locations',
    tiles: ['Rocky Mountain spotted fever', 'Lyme disease', 'Ebola virus disease', 'West Nile virus infection'],
    difficulty: 'expert',
    systems: ['Microbiology'],
    primarySystem: 'Microbiology',
    secondarySystems: [],
    connectionType: 'language',
    explanation: 'Each disease is named for the geographic location where it was first identified or is classically associated with, not for a person or a mechanism.',
    tileExplanations: [
      'First recognized in the Rocky Mountain region, despite occurring more broadly in the US today.',
      'Named for Lyme, Connecticut, where it was first characterized.',
      'Named for the Ebola River in the Democratic Republic of Congo, near the first identified outbreak.',
      'Named for the West Nile region of Uganda, where the virus was first isolated.',
    ],
    remember: 'A disease named for a place tells you nothing about its biology — only about geography and discovery history.',
    tags: ['microbiology', 'nomenclature'],
    overlapTags: ['vector-borne-illness'],
    status: 'verified',
  },
  {
    id: 'bank-expert-05',
    title: 'Elevated because the target tissue is resistant, not because more is needed',
    tiles: ['Insulin resistance', 'Pseudohypoparathyroidism', 'Leptin resistance (obesity)', 'Nephrogenic diabetes insipidus'],
    difficulty: 'expert',
    systems: ['Endocrine'],
    primarySystem: 'Endocrine',
    secondarySystems: [],
    connectionType: 'mechanism',
    explanation: 'In each, a signaling hormone is elevated not from oversecretion but because its target tissue fails to respond normally, so the body compensates by making more.',
    tileExplanations: [
      'Cells resist insulin\'s effect, so the pancreas compensates by secreting more — hyperinsulinemia.',
      'End-organ (renal) resistance to PTH raises PTH as the body tries to compensate, despite low calcium.',
      'Adipose tissue signaling is elevated but the hypothalamus resists its appetite-suppressing effect.',
      'The kidney is unresponsive to ADH, so ADH rises as the body tries (and fails) to compensate.',
    ],
    remember: 'A high hormone level does not always mean oversecretion — sometimes the target simply will not listen.',
    tags: ['hormone-resistance', 'endocrine-feedback'],
    overlapTags: ['hypocalcemia'],
    status: 'verified',
  },
  {
    id: 'bank-expert-06',
    title: 'A measurement that falls as the disease gets worse',
    tiles: ['Chronic kidney disease', 'Systolic heart failure', 'Chronic obstructive pulmonary disease', 'Pulmonary fibrosis'],
    difficulty: 'expert',
    systems: ['Mixed / Step Review'],
    primarySystem: 'Mixed / Step Review',
    secondarySystems: [],
    connectionType: 'cross-system',
    explanation: 'Each disease is tracked by a specific number that falls as severity worsens — GFR, ejection fraction, FEV1, and DLCO, respectively.',
    tileExplanations: [
      'Tracked by glomerular filtration rate (GFR), which falls as the disease progresses.',
      'Tracked by ejection fraction (EF), which falls as contractility worsens.',
      'Tracked by FEV1, which falls as airflow obstruction worsens.',
      'Tracked by DLCO, which falls as the gas-exchange membrane scars and thickens.',
    ],
    remember: 'Four organ systems, four falling numbers — each disease has its own quiet, quantifiable severity marker.',
    tags: ['disease-severity', 'cross-system'],
    overlapTags: ['chronic-disease-monitoring'],
    status: 'verified',
  },
  {
    id: 'bank-neuro-01',
    title: 'Causes of peripheral neuropathy',
    tiles: ['Diabetes mellitus', 'Vitamin B12 deficiency', 'Chronic alcohol use', 'Vincristine'],
    difficulty: 'medium',
    systems: ['Neurology'],
    primarySystem: 'Neurology',
    secondarySystems: [],
    connectionType: 'knowledge',
    explanation: 'Each is a well-established cause of peripheral nerve damage, via chronic hyperglycemia, impaired myelin synthesis, direct axonal toxicity, or microtubule disruption.',
    tileExplanations: [
      'Chronic hyperglycemia damages small vessels and nerves, the most common cause of peripheral neuropathy overall.',
      'Needed for myelin synthesis; deficiency causes a demyelinating, often symmetric neuropathy.',
      'Direct axonal toxicity, often worsened by concurrent thiamine deficiency.',
      'A vinca alkaloid that disrupts microtubules needed for axonal transport, causing a dose-limiting neuropathy.',
    ],
    remember: 'Peripheral neuropathy has a short, high-yield differential: diabetes, B12 deficiency, alcohol, and specific neurotoxic drugs.',
    tags: ['peripheral-neuropathy', 'neurology'],
    overlapTags: ['diabetes-complications'],
    status: 'verified',
  },
  {
    id: 'bank-neuro-02',
    title: 'Cranial nerve palsy — the eye finding it produces',
    tiles: ['CN III palsy', 'CN IV palsy', 'CN VI palsy', 'Horner syndrome'],
    difficulty: 'hard',
    systems: ['Neurology'],
    primarySystem: 'Neurology',
    secondarySystems: [],
    connectionType: 'anatomy',
    explanation: 'Each produces a distinctive, localizable eye finding — the exam clue that lets you name the lesion before imaging.',
    tileExplanations: [
      'A "down and out" eye with ptosis and a dilated, poorly reactive pupil.',
      'Vertical/torsional diplopia, classically worse looking down and in (e.g., descending stairs).',
      'An eye that cannot abduct, resting medially deviated from unopposed medial rectus tone.',
      'Ptosis, miosis, and anhidrosis from disrupted sympathetic outflow to the eye — not a cranial nerve palsy at all, but it belongs on the same differential for an abnormal eye exam.',
    ],
    remember: 'Each cranial nerve (or sympathetic pathway) has one classic, localizing eye sign — learn the sign, name the lesion.',
    tags: ['cranial-nerves', 'diplopia', 'ptosis'],
    overlapTags: ['brainstem-syndromes'],
    status: 'verified',
  },
  {
    id: 'bank-neuro-03',
    title: 'Spinal cord lesion patterns',
    tiles: ['Brown-Séquard syndrome', 'Subacute combined degeneration', 'Anterior spinal artery syndrome', 'Syringomyelia'],
    difficulty: 'hard',
    systems: ['Neurology'],
    primarySystem: 'Neurology',
    secondarySystems: [],
    connectionType: 'pathology',
    explanation: 'Each damages a specific combination of spinal cord tracts, producing a deficit pattern distinctive enough to localize the lesion by exam alone.',
    tileExplanations: [
      'Hemisection of the cord: ipsilateral weakness/proprioceptive loss, contralateral pain/temperature loss below the lesion.',
      'B12 deficiency damages the dorsal columns and corticospinal tracts together — combined sensory ataxia and spasticity.',
      'Infarction spares the dorsal columns, producing bilateral weakness and pain/temperature loss with preserved proprioception.',
      'A central cord cavity damages crossing spinothalamic fibers first, producing a "cape-like" loss of pain/temperature.',
    ],
    remember: 'Learn which tracts a lesion hits, not just its name — the tract pattern is what actually localizes it.',
    tags: ['spinal-cord', 'tract-lesions'],
    overlapTags: ['vitamin-deficiency'],
    status: 'verified',
  },
  {
    id: 'bank-neuro-04',
    title: 'Neuro deficits that are ipsilateral, not crossed',
    tiles: ['Cerebellar hemisphere lesion', 'Dorsal column lesion (in the cord)', 'Lateral medullary (Wallenberg) Horner syndrome', 'Lower motor neuron lesion'],
    difficulty: 'expert',
    systems: ['Neurology'],
    primarySystem: 'Neurology',
    secondarySystems: [],
    connectionType: 'anatomy',
    explanation:
      'Most people default to "brain lesions cause contralateral deficits" — true for the corticospinal and spinothalamic tracts once they\'ve crossed, but each of these produces a same-side deficit because the relevant pathway hasn\'t decussated yet (or decussates twice).',
    tileExplanations: [
      'Cerebellar output effectively crosses twice, so a hemisphere lesion causes ipsilateral ataxia.',
      'Dorsal column fibers ascend uncrossed and only decussate in the medulla, so a cord lesion causes ipsilateral proprioceptive loss below it.',
      'The descending sympathetic tract hasn\'t crossed at the medulla, so a lateral medullary stroke causes an ipsilateral Horner syndrome.',
      'A lower motor neuron lesion is peripheral to any decussation, so weakness is always on the same side as the lesion.',
    ],
    remember: '"Contralateral" is the exception that gets taught as the rule — cerebellum, dorsal columns, and pre-decussation sympathetic/LMN pathways are all ipsilateral.',
    tags: ['decussation', 'localization', 'neuroanatomy'],
    overlapTags: ['brainstem-syndromes'],
    status: 'verified',
  },
  {
    id: 'bank-expert-07',
    title: 'A compensatory response that creates its own measurable abnormality',
    tiles: ['Metabolic acidosis', 'Metabolic alkalosis', 'Hypovolemia', 'Hypoxemia'],
    difficulty: 'expert',
    systems: ['Renal', 'Pulmonary'],
    primarySystem: 'Renal',
    secondarySystems: ['Pulmonary'],
    connectionType: 'cause-effect',
    explanation: 'Each primary problem triggers a physiologic compensation that itself produces a second, distinct measurable abnormality.',
    tileExplanations: [
      'Triggers compensatory hyperventilation, producing a secondary low PaCO2.',
      'Triggers compensatory hypoventilation, producing a secondary high PaCO2.',
      'Triggers ADH release to preserve volume, risking a secondary dilutional hyponatremia.',
      'Triggers hyperventilation to raise oxygenation, producing a secondary respiratory alkalosis.',
    ],
    remember: 'The body\'s fix for one problem is often visible on labs as a second, distinct abnormality.',
    tags: ['acid-base', 'compensation', 'cross-system'],
    overlapTags: ['electrolytes'],
    status: 'verified',
  },
]

// Merge in the categories migrated from the hand-written systemPuzzles.js
// content (see scripts/migrateBank.mjs) — same schema, same validation,
// just sourced from already-reviewed puzzles instead of authored directly
// here. This is what gives the dynamic per-system assembler real depth
// without retyping existing, verified content.
connectionBank.push(...migratedBankCategories)

export default connectionBank

// Structural validator for a single bank category — used by the Dev Viewer's
// "paste a category to validate" box, and by anything that ingests new
// hand-authored content before it's added to the array above. Deliberately
// mirrors the shape of `validatePuzzle` in src/puzzles.js, but for the bank
// schema rather than the playable-puzzle schema.
export function validateBankCategory(c) {
  const errors = []
  if (!c || typeof c !== 'object') return ['category must be an object']
  if (!c.id) errors.push('missing id')
  if (!c.title) errors.push('missing title')
  if (!Array.isArray(c.tiles) || c.tiles.length !== 4) {
    errors.push('must have exactly 4 tiles')
  } else {
    c.tiles.forEach((t, i) => {
      if (typeof t !== 'string' || !t.trim()) errors.push(`tile ${i} is empty/invalid`)
    })
    const unique = new Set(c.tiles.map((t) => String(t).trim().toLowerCase()))
    if (unique.size !== c.tiles.length) errors.push('duplicate tile text within this category')
  }
  if (!DIFFICULTY_TIERS.includes(c.difficulty)) errors.push(`difficulty must be one of: ${DIFFICULTY_TIERS.join(', ')}`)
  if (!Array.isArray(c.systems) || c.systems.length === 0) errors.push('missing systems[]')
  // primarySystem is the ONE system whose puzzle library this category is
  // eligible for in organ-specific (pure) mode — see puzzleAssembler.js's
  // tierPools(). secondarySystems are real but non-central systems this
  // category can still serve as a "defensible cross-system" fallback for
  // (never an arbitrary unrelated category). Both must be real SYSTEMS
  // entries; primarySystem must also appear in `systems`, and
  // secondarySystems must be exactly `systems` minus the primary — this
  // keeps the two fields from silently drifting apart as content is added.
  if (!c.primarySystem || !SYSTEMS.includes(c.primarySystem)) {
    errors.push('missing/invalid primarySystem (must be one of the named SYSTEMS)')
  } else if (Array.isArray(c.systems) && !c.systems.includes(c.primarySystem)) {
    errors.push('primarySystem must also appear in systems[]')
  }
  if (!Array.isArray(c.secondarySystems)) {
    errors.push('missing secondarySystems[] (use [] if this category is single-system)')
  } else {
    c.secondarySystems.forEach((s) => {
      if (!SYSTEMS.includes(s)) errors.push(`secondarySystems contains unknown system "${s}"`)
    })
    if (Array.isArray(c.systems) && c.primarySystem) {
      const expected = c.systems.filter((s) => s !== c.primarySystem)
      const same =
        expected.length === c.secondarySystems.length && expected.every((s) => c.secondarySystems.includes(s))
      if (!same) errors.push('secondarySystems must equal systems[] minus primarySystem')
    }
  }
  if (!CONNECTION_TYPES.includes(c.connectionType)) errors.push(`connectionType must be one of: ${CONNECTION_TYPES.join(', ')}`)
  if (!c.explanation) errors.push('missing explanation')
  if (!Array.isArray(c.tileExplanations) || c.tileExplanations.length !== 4) {
    errors.push('must have exactly 4 tileExplanations, parallel to tiles')
  } else {
    c.tileExplanations.forEach((e, i) => {
      if (typeof e !== 'string' || !e.trim()) errors.push(`tileExplanations[${i}] is empty/invalid`)
    })
  }
  if (!c.remember) errors.push('missing remember line')
  if (!Array.isArray(c.tags) || c.tags.length === 0) errors.push('missing tags[] (concept tags for Weak Spot tracking)')
  if (!BANK_STATUS.includes(c.status)) errors.push(`status must be one of: ${BANK_STATUS.join(', ')}`)
  // Optional medical-source scaffold (never shown during gameplay — see
  // ReviewConnections.jsx). Not required yet since most existing content
  // predates this field, but if present it must be well-formed so the
  // Content Audit view can trust it.
  if (c.source !== undefined) {
    if (typeof c.source !== 'object' || c.source === null) {
      errors.push('source, if present, must be an object ({ sourceTitle, sourceURL, dateReviewed })')
    } else if (!c.source.sourceTitle) {
      errors.push('source.sourceTitle is required when source is present')
    }
  }
  return errors
}

// Internal-only quality heuristic for a single category (never shown to
// players). Rewards categories most likely to produce educational or
// "aha" puzzles: verified content, a clearer explanation/remember line,
// and — when scoring a *combination* of categories in the assembler —
// reused elsewhere to reward connection-type diversity across a puzzle.
export function scoreCategory(c) {
  let score = 0
  if (c.status === 'verified') score += 3
  if (c.explanation && c.explanation.length > 40) score += 1
  if (c.remember && c.remember.length > 20) score += 1
  if (Array.isArray(c.tags) && c.tags.length >= 2) score += 1
  return score
}
