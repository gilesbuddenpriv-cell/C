import type { Category } from '@/types'

export interface TopicDef {
  slug: string
  title: string
  subtitle: string
  emoji: string
  category: Category
  sort_order: number
}

export const TOPICS: TopicDef[] = [
  // ── CORE SCIENCE ──────────────────────────────────────────
  {
    slug: 'musculoskeletal-anatomy',
    title: 'Musculoskeletal Anatomy',
    subtitle: 'Joints · ligaments · tendons',
    emoji: '🦴',
    category: 'core_science',
    sort_order: 1,
  },
  {
    slug: 'exercise-physiology',
    title: 'Exercise Physiology',
    subtitle: 'Energy systems · adaptation',
    emoji: '⚡',
    category: 'core_science',
    sort_order: 2,
  },
  {
    slug: 'neuroanatomy',
    title: 'Neuroanatomy',
    subtitle: 'PNS · dermatomes · reflexes',
    emoji: '🧠',
    category: 'core_science',
    sort_order: 3,
  },
  {
    slug: 'tissue-healing',
    title: 'Tissue Healing',
    subtitle: 'Pathophysiology · repair',
    emoji: '🔬',
    category: 'core_science',
    sort_order: 4,
  },
  {
    slug: 'pharmacology',
    title: 'Pharmacology',
    subtitle: 'Medications · WADA · doping',
    emoji: '💊',
    category: 'core_science',
    sort_order: 5,
  },
  {
    slug: 'biomechanics',
    title: 'Biomechanics',
    subtitle: 'Gait · force · kinematics',
    emoji: '⚙️',
    category: 'core_science',
    sort_order: 6,
  },

  // ── CLINICAL PRACTICE ─────────────────────────────────────
  {
    slug: 'clinical-assessment',
    title: 'Clinical Assessment',
    subtitle: 'History · examination · tests',
    emoji: '🔍',
    category: 'clinical_practice',
    sort_order: 7,
  },
  {
    slug: 'outcome-measures',
    title: 'Outcome Measures',
    subtitle: 'Validated tools · psychometrics',
    emoji: '📊',
    category: 'clinical_practice',
    sort_order: 8,
  },
  {
    slug: 'imaging-investigations',
    title: 'Imaging & Investigations',
    subtitle: 'Indications · triage · flags',
    emoji: '🩻',
    category: 'clinical_practice',
    sort_order: 9,
  },
  {
    slug: 'clinical-cardiology',
    title: 'Clinical Cardiology',
    subtitle: 'Screening · ECG · athlete heart',
    emoji: '❤️',
    category: 'clinical_practice',
    sort_order: 10,
  },
  {
    slug: 'pain-science',
    title: 'Pain Science',
    subtitle: 'Mechanisms · classification',
    emoji: '🧩',
    category: 'clinical_practice',
    sort_order: 11,
  },

  // ── REHABILITATION ────────────────────────────────────────
  {
    slug: 'strength-conditioning',
    title: 'Strength & Conditioning',
    subtitle: 'Periodisation · loading',
    emoji: '🏋️',
    category: 'rehabilitation',
    sort_order: 12,
  },
  {
    slug: 'return-to-sport',
    title: 'Return to Sport',
    subtitle: 'Criteria · testing · decisions',
    emoji: '🏃',
    category: 'rehabilitation',
    sort_order: 13,
  },
  {
    slug: 'lower-limb-rehab',
    title: 'Lower Limb Rehab',
    subtitle: 'ACL · patellofemoral · ankle',
    emoji: '🦵',
    category: 'rehabilitation',
    sort_order: 14,
  },
  {
    slug: 'upper-limb-rehab',
    title: 'Upper Limb Rehab',
    subtitle: 'Shoulder · elbow · wrist',
    emoji: '👋',
    category: 'rehabilitation',
    sort_order: 15,
  },
  {
    slug: 'manual-therapy',
    title: 'Manual Therapy',
    subtitle: 'Joint mob · soft tissue · evidence',
    emoji: '🙌',
    category: 'rehabilitation',
    sort_order: 16,
  },
  {
    slug: 'load-management',
    title: 'Load Management',
    subtitle: 'ACWR · monitoring · prevention',
    emoji: '📈',
    category: 'rehabilitation',
    sort_order: 17,
  },
  {
    slug: 'spinal-rehabilitation',
    title: 'Spinal Rehabilitation',
    subtitle: 'LBP · cervical · postural',
    emoji: '🌿',
    category: 'rehabilitation',
    sort_order: 18,
  },

  // ── PROFESSIONAL PRACTICE ─────────────────────────────────
  {
    slug: 'professional-ethics',
    title: 'Professional Ethics',
    subtitle: 'BASRaT · consent · scope',
    emoji: '⚖️',
    category: 'professional_practice',
    sort_order: 19,
  },
  {
    slug: 'safeguarding',
    title: 'Safeguarding',
    subtitle: 'Child protection · vulnerable adults',
    emoji: '🛡️',
    category: 'professional_practice',
    sort_order: 20,
  },
  {
    slug: 'research-ebp',
    title: 'Research & EBP',
    subtitle: 'Study design · stats · appraisal',
    emoji: '📚',
    category: 'professional_practice',
    sort_order: 21,
  },
  {
    slug: 'emergency-first-aid',
    title: 'Emergency & First Aid',
    subtitle: 'Pitch-side · ABCDE · concussion',
    emoji: '🚑',
    category: 'professional_practice',
    sort_order: 22,
  },
]

export const CATEGORY_LABELS: Record<Category, string> = {
  core_science: 'CORE SCIENCE',
  clinical_practice: 'CLINICAL PRACTICE',
  rehabilitation: 'REHABILITATION',
  professional_practice: 'PROFESSIONAL PRACTICE',
}

export const CATEGORY_ORDER: Category[] = [
  'core_science',
  'clinical_practice',
  'rehabilitation',
  'professional_practice',
]

export function getTopicBySlug(slug: string): TopicDef | undefined {
  return TOPICS.find((t) => t.slug === slug)
}
