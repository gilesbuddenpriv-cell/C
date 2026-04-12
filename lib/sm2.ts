import type { Rating, SM2State, Question } from '@/types'

const QUALITY: Record<Rating, number> = {
  again: 0,
  hard: 1,
  good: 3,
  easy: 5,
}

export function getInitialSM2State(): SM2State {
  return {
    ease_factor: 2.5,
    interval_days: 0,
    repetitions: 0,
    next_review_at: new Date().toISOString(),
    last_rating: null,
  }
}

/**
 * SM-2 algorithm — returns the updated state after a rating.
 */
export function updateSM2(state: SM2State, rating: Rating): SM2State {
  const q = QUALITY[rating]
  const { ease_factor, interval_days, repetitions } = state

  let newInterval: number
  let newRepetitions: number
  let newEaseFactor: number

  if (q < 3) {
    // Incorrect / hard — reset sequence
    newRepetitions = 0
    newInterval = 1
    newEaseFactor = Math.max(1.3, ease_factor - 0.2)
  } else {
    // Correct — advance
    newRepetitions = repetitions + 1
    if (repetitions === 0) {
      newInterval = 1
    } else if (repetitions === 1) {
      newInterval = 6
    } else {
      newInterval = Math.round(interval_days * ease_factor)
    }
    newEaseFactor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    newEaseFactor = Math.max(1.3, newEaseFactor)
  }

  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + newInterval)

  return {
    ease_factor: newEaseFactor,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review_at: nextReview.toISOString(),
    last_rating: rating,
  }
}

export function isDue(state: SM2State): boolean {
  return new Date(state.next_review_at) <= new Date()
}

/**
 * Selects `count` questions for a session, prioritising:
 * 1. Due cards (overdue first)
 * 2. New cards (never seen)
 * 3. Not-yet-due cards (earliest due date first)
 */
export function selectSessionQuestions(
  questions: Question[],
  progress: Record<string, SM2State>,
  count = 10,
): Question[] {
  const now = new Date()

  const due: Question[] = []
  const fresh: Question[] = []
  const notDue: Question[] = []

  for (const q of questions) {
    const state = progress[q.id]
    if (!state) {
      fresh.push(q)
    } else if (new Date(state.next_review_at) <= now) {
      due.push(q)
    } else {
      notDue.push(q)
    }
  }

  // Sort due by most-overdue first
  due.sort((a, b) => {
    const aDate = new Date(progress[a.id].next_review_at)
    const bDate = new Date(progress[b.id].next_review_at)
    return aDate.getTime() - bDate.getTime()
  })

  // Sort not-due by soonest first
  notDue.sort((a, b) => {
    const aDate = new Date(progress[a.id].next_review_at)
    const bDate = new Date(progress[b.id].next_review_at)
    return aDate.getTime() - bDate.getTime()
  })

  const pool = [...due, ...fresh, ...notDue]
  return pool.slice(0, count)
}
