'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Question, Rating, SM2State } from '@/types'
import { updateSM2, getInitialSM2State, selectSessionQuestions } from '@/lib/sm2'
import {
  getGuestQuestions,
  saveGuestQuestions,
  getGuestProgress,
  saveGuestProgress,
  saveGuestSession,
} from '@/lib/localStorage'
import FlashCard from './FlashCard'
import { format } from 'date-fns'

type Phase = 'loading' | 'generating' | 'card' | 'complete'

const EMPTY_TALLY: Record<Rating, number> = { again: 0, hard: 0, good: 0, easy: 0 }

const TALLY_ITEMS: { value: Rating; icon: string; label: string; colour: string; bg: string }[] = [
  { value: 'again', icon: '↻', label: 'Again',  colour: '#DC2626', bg: '#FEF2F2' },
  { value: 'hard',  icon: '~', label: 'Hard',   colour: '#B07D20', bg: '#FDF3D0' },
  { value: 'good',  icon: '✓', label: 'Good',   colour: '#1B5E42', bg: '#F0FDF4' },
  { value: 'easy',  icon: '⚡', label: 'Easy',  colour: '#0F766E', bg: '#CCFBF1' },
]

interface FlashSessionProps {
  topicSlug: string
  topicTitle: string
  userId?: string
}

export default function FlashSession({ topicSlug, topicTitle, userId }: FlashSessionProps) {
  const router = useRouter()
  const [phase, setPhase]       = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<Record<string, SM2State>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tally, setTally]       = useState<Record<Rating, number>>({ ...EMPTY_TALLY })

  const currentQ = questions[currentIndex]

  useEffect(() => { void loadSession() }, [topicSlug, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSession() {
    setPhase('loading')
    setTally({ ...EMPTY_TALLY })
    setCurrentIndex(0)

    let allQuestions: Question[] = []
    let savedProgress: Record<string, SM2State> = {}

    if (userId) {
      const res  = await fetch(`/api/questions?topicSlug=${encodeURIComponent(topicSlug)}`)
      const data = await res.json()
      allQuestions  = data.questions ?? []
      savedProgress = data.progress  ?? {}
    } else {
      allQuestions = getGuestQuestions(topicSlug)
      if (allQuestions.length > 0) {
        savedProgress = getGuestProgress(topicSlug, allQuestions.map((q) => q.id))
      }
    }

    if (allQuestions.length === 0) {
      setPhase('generating')
      const res  = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicSlug, userId }),
      })
      const data = await res.json()
      allQuestions = data.questions ?? []
      if (!userId) saveGuestQuestions(topicSlug, allQuestions)
    }

    const sessionQs = selectSessionQuestions(allQuestions, savedProgress, 10)
    setProgress(savedProgress)
    setQuestions(sessionQs)
    setPhase('card')
  }

  const handleRate = useCallback(async (rating: Rating) => {
    if (!currentQ) return

    // Update tally
    setTally((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))

    // SM-2 update
    const current = progress[currentQ.id] ?? getInitialSM2State()
    const updated  = updateSM2(current, rating)
    const newProg  = { ...progress, [currentQ.id]: updated }
    setProgress(newProg)

    if (userId) {
      void fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: currentQ.id, sm2State: updated }),
      })
    } else {
      saveGuestProgress(currentQ.id, updated)
    }

    const isLast = currentIndex >= questions.length - 1

    if (isLast) {
      const today = format(new Date(), 'yyyy-MM-dd')
      if (userId) {
        void fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicSlug,
            questionsAnswered: questions.length,
            correctAnswers: questions.length,
          }),
        })
      } else {
        saveGuestSession({
          topic_slug: topicSlug,
          questions_answered: questions.length,
          correct_answers: questions.length,
          date: today,
        })
      }
      setPhase('complete')
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }, [currentQ, currentIndex, questions, progress, topicSlug, userId])

  // ── Loading / generating ──────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
        <p className="label text-center">
          {phase === 'generating'
            ? `GENERATING CARDS FOR ${topicTitle.toUpperCase()}…`
            : 'LOADING…'}
        </p>
        {phase === 'generating' && (
          <p className="text-xs text-muted text-center max-w-xs">
            Claude is writing 30 exam-standard questions. This takes about 15 seconds and only happens once.
          </p>
        )}
      </div>
    )
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (phase === 'complete') {
    const total    = questions.length
    const mastered = tally.good + tally.easy
    const pct      = Math.round((mastered / total) * 100)
    const emoji    = pct >= 70 ? '🎉' : pct >= 40 ? '💪' : '📖'

    return (
      <div className="flex flex-col items-center py-12 gap-6 animate-fade-in">
        {/* Score circle */}
        <div
          className="w-20 h-20 rounded-full flex flex-col items-center justify-center border-4"
          style={{ borderColor: 'var(--forest)', background: 'var(--card)' }}
        >
          <span className="text-2xl">{emoji}</span>
        </div>

        <div className="text-center">
          <p className="font-serif text-3xl font-bold text-ink">{pct}%</p>
          <p className="text-muted text-sm mt-1">Good or Easy · {total} cards</p>
        </div>

        {/* Tally breakdown */}
        <div className="w-full card p-4 flex flex-col gap-3">
          <p className="label mb-1">SESSION BREAKDOWN</p>
          {TALLY_ITEMS.map(({ value, icon, label, colour, bg }) => {
            const count = tally[value]
            const width = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={value} className="flex items-center gap-3">
                <span
                  className="font-mono text-xs font-bold w-4 text-center shrink-0"
                  style={{ color: colour }}
                >
                  {icon}
                </span>
                <span
                  className="font-mono text-xs w-12 shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {label}
                </span>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${width}%`, background: colour }}
                  />
                </div>
                <span
                  className="font-mono text-xs w-4 text-right shrink-0"
                  style={{ color: 'var(--muted)' }}
                >
                  {count}
                </span>
              </div>
            )
          })}
        </div>

        <p className="font-serif italic text-muted text-sm text-center max-w-xs">
          {pct >= 70
            ? 'Strong session. Spaced repetition will keep these fresh.'
            : pct >= 40
            ? 'Solid effort. The cards you found hard will come back sooner.'
            : 'These will resurface soon — repetition is the key.'}
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => router.push('/')}
            className="flex-1 border border-border text-ink text-sm py-2.5 rounded hover:bg-white transition-colors font-mono font-bold tracking-wide"
          >
            ← BACK
          </button>
          <button
            onClick={() => void loadSession()}
            className="flex-1 text-sm py-2.5 rounded transition-colors font-mono font-bold tracking-wide"
            style={{ background: 'var(--forest)', color: 'white' }}
          >
            GO AGAIN →
          </button>
        </div>
      </div>
    )
  }

  // ── Card ──────────────────────────────────────────────────────────────────
  if (!currentQ) return null

  return (
    <FlashCard
      key={currentQ.id}
      question={currentQ}
      index={currentIndex}
      total={questions.length}
      tally={tally}
      onRate={handleRate}
    />
  )
}
