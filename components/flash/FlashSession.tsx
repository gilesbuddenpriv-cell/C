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

interface FlashSessionProps {
  topicSlug: string
  topicTitle: string
  userId?: string
}

export default function FlashSession({ topicSlug, topicTitle, userId }: FlashSessionProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<Record<string, SM2State>>({})
  const [currentIndex, setCurrentIndex] = useState(0)

  const currentQ = questions[currentIndex]

  useEffect(() => {
    void loadSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSlug, userId])

  // Spacebar flips card — handled by FlashCard via click, but we also wire keydown here
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  async function loadSession() {
    setPhase('loading')

    let allQuestions: Question[] = []
    let savedProgress: Record<string, SM2State> = {}

    if (userId) {
      const res = await fetch(`/api/questions?topicSlug=${encodeURIComponent(topicSlug)}`)
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
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicSlug, userId }),
      })
      const data = await res.json()
      allQuestions = data.questions ?? []

      if (!userId) {
        saveGuestQuestions(topicSlug, allQuestions)
      }
    }

    const sessionQs = selectSessionQuestions(allQuestions, savedProgress, 10)
    setProgress(savedProgress)
    setQuestions(sessionQs)
    setCurrentIndex(0)
    setPhase('card')
  }

  const handleRate = useCallback(async (rating: Rating) => {
    if (!currentQ) return

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
            correctAnswers: questions.length, // flash mode — all self-assessed
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
      setPhase('card')
    }
  }, [currentQ, currentIndex, questions, progress, topicSlug, userId])

  // ── Loading / generating ─────────────────────────────────
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

  // ── Complete ─────────────────────────────────────────────
  if (phase === 'complete') {
    return (
      <div className="flex flex-col items-center py-16 gap-6 animate-fade-in text-center">
        <div
          className="w-16 h-16 rounded-full bg-forest flex items-center justify-center"
          style={{ fontSize: '1.75rem' }}
        >
          🎴
        </div>
        <div>
          <p className="font-serif text-3xl font-bold text-ink">Session done</p>
          <p className="text-muted text-sm mt-1">{questions.length} cards reviewed</p>
        </div>
        <p className="font-serif italic text-muted text-sm max-w-xs">
          Spaced repetition will surface the cards you found hard again soon.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/')}
            className="border border-border text-ink text-sm px-4 py-2 rounded hover:bg-white transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => {
              setCurrentIndex(0)
              void loadSession()
            }}
            className="text-sm px-4 py-2 rounded transition-colors"
            style={{ background: 'var(--forest)', color: 'white' }}
          >
            Go again →
          </button>
        </div>
      </div>
    )
  }

  // ── Card ─────────────────────────────────────────────────
  if (!currentQ) return null

  return (
    <FlashCard
      key={currentQ.id}
      question={currentQ}
      index={currentIndex}
      total={questions.length}
      onRate={handleRate}
    />
  )
}
