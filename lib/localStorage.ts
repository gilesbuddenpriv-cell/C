import type { GuestData, GuestSession, SM2State, Question, GuestCustomTopic } from '@/types'

const KEY = 'basrat_v1'

const DEFAULT_EXAM_DATE = '2026-06-08'

function getDefaults(): GuestData {
  return {
    exam_date: DEFAULT_EXAM_DATE,
    questions: {},
    progress: {},
    sessions: [],
    custom_topics: [],
  }
}

export function getGuestData(): GuestData {
  if (typeof window === 'undefined') return getDefaults()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return getDefaults()
    return { ...getDefaults(), ...JSON.parse(raw) }
  } catch {
    return getDefaults()
  }
}

function save(data: GuestData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getGuestExamDate(): string {
  return getGuestData().exam_date
}

export function setGuestExamDate(date: string): void {
  const data = getGuestData()
  save({ ...data, exam_date: date })
}

export function getGuestQuestions(topicKey: string): Question[] {
  return getGuestData().questions[topicKey] ?? []
}

export function saveGuestQuestions(topicKey: string, questions: Question[]): void {
  const data = getGuestData()
  save({ ...data, questions: { ...data.questions, [topicKey]: questions } })
}

export function getGuestProgress(topicKey: string, questionIds: string[]): Record<string, SM2State> {
  const { progress } = getGuestData()
  return Object.fromEntries(
    questionIds.filter((id) => progress[id]).map((id) => [id, progress[id]]),
  )
}

export function saveGuestProgress(questionId: string, state: SM2State): void {
  const data = getGuestData()
  save({ ...data, progress: { ...data.progress, [questionId]: state } })
}

export function saveGuestSession(session: Omit<GuestSession, 'id'>): void {
  const data = getGuestData()
  const newSession: GuestSession = {
    ...session,
    id: crypto.randomUUID(),
  }
  save({ ...data, sessions: [...data.sessions, newSession] })
}

export function getGuestSessions(): GuestSession[] {
  return getGuestData().sessions
}

export function getGuestCustomTopics(): GuestCustomTopic[] {
  return getGuestData().custom_topics
}

export function addGuestCustomTopic(topic: GuestCustomTopic): void {
  const data = getGuestData()
  save({ ...data, custom_topics: [...data.custom_topics, topic] })
}

/**
 * Returns a record of { 'YYYY-MM-DD': count } for the heatmap.
 */
export function getGuestHeatmapData(): Record<string, number> {
  const sessions = getGuestSessions()
  const map: Record<string, number> = {}
  for (const s of sessions) {
    map[s.date] = (map[s.date] ?? 0) + s.questions_answered
  }
  return map
}
