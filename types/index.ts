export type Category =
  | 'core_science'
  | 'clinical_practice'
  | 'rehabilitation'
  | 'professional_practice'

export interface Topic {
  id: string
  slug: string
  title: string
  subtitle: string
  emoji: string
  category: Category
  sort_order: number
  created_at: string
}

export interface CustomTopic {
  id: string
  user_id: string
  title: string
  document_url: string | null
  document_name: string | null
  status: 'processing' | 'ready' | 'error'
  created_at: string
}

export interface Question {
  id: string
  topic_id: string | null
  custom_topic_id: string | null
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'a' | 'b' | 'c' | 'd'
  explanation: string
  created_at: string
}

export type Rating = 'again' | 'hard' | 'good' | 'easy'

export interface SM2State {
  ease_factor: number      // default 2.5
  interval_days: number    // default 0
  repetitions: number      // default 0
  next_review_at: string   // ISO timestamp
  last_rating: Rating | null
}

export interface UserQuestionProgress {
  id: string
  user_id: string
  question_id: string
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review_at: string
  last_rating: Rating | null
  updated_at: string
}

export interface UserSettings {
  user_id: string
  exam_date: string  // YYYY-MM-DD
}

export interface StudySession {
  id: string
  user_id: string
  topic_id: string | null
  custom_topic_id: string | null
  questions_answered: number
  correct_answers: number
  session_date: string  // YYYY-MM-DD
  created_at: string
}

// Guest localStorage shape
export interface GuestData {
  exam_date: string
  questions: Record<string, Question[]>          // key: topicSlug or customTopicId
  progress: Record<string, SM2State>             // key: questionId
  sessions: GuestSession[]
  custom_topics: GuestCustomTopic[]
}

export interface GuestSession {
  id: string
  topic_slug: string
  questions_answered: number
  correct_answers: number
  date: string  // YYYY-MM-DD
}

export interface GuestCustomTopic {
  id: string
  title: string
  created_at: string
}

// UI helpers
export type QuizPhase = 'loading' | 'generating' | 'question' | 'feedback' | 'complete'

export interface QuizState {
  phase: QuizPhase
  questions: Question[]
  currentIndex: number
  selected: 'a' | 'b' | 'c' | 'd' | null
  correctCount: number
  progress: Record<string, SM2State>
}
