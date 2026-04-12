'use client'

import { useState, useEffect } from 'react'
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
import QuestionCard from './QuestionCard'
import { format } from 'date-fns'

type Phase = 'loading' | 'generating' | 'question' | 'feedback' | 'complete'
type Option = 'a' | 'b' | 'c' | 'd'

interface QuizSessionProps {
  topicSlug: string          // pre-built slug or 'custom-<id>'
  topicTitle: string
  userId?: string
}

export default function QuizSession({ topicSlug, topicTitle, userId }: QuizSessionProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('loading')
  const [questions, setQuestions] = useState<Question[]>([])
  const [progress, setProgress] = useState<Record<string, SM2State>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<Option | null>(null)
  const [correctCount, setCorrectCount] = useState(0)

  const currentQ = questions[currentIndex]

  useEffect(() => {
    void loadSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicSlug, userId])

  async function loadSession() {
    setPhase('loading')

    let allQuestions: Question[] = []
    let savedProgress: Record<string, SM2State> = {}

    if (userId) {
      const res = await fetch(`/api/questions?topicSlug=${encodeURIComponent(topicSlug)}`)
      const data = await res.json()
      allQuestions   = data.questions ?? []
      savedProgress  = data.progress  ?? {}
    } else {
      allQuestions  = getGuestQuestions(topicSlug)
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
    setPhase('question')
  }

  function handleSelect(opt: Option) {
    setSelected(opt)
    setPhase('feedback')
    if (opt === currentQ.correct_option) {
      setCorrectCount((c) => c + 1)
    }
  }

  async function handleRate(rating: Rating) {
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
    const finalCorrect = correctCount + (selected === currentQ.correct_option ? 1 : 0)

    if (isLast) {
      // Record session
      const today = format(new Date(), 'yyyy-MM-dd')
      if (userId) {
        void fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicSlug,
            questionsAnswered: questions.length,
            correctAnswers: finalCorrect,
          }),
        })
      } else {
        saveGuestSession({
          topic_slug: topicSlug,
          questions_answered: questions.length,
          correct_answers: finalCorrect,
          date: today,
        })
      }
      setPhase('complete')
    } else {
      setCurrentIndex((i) => i + 1)
      setSelected(null)
      setPhase('question')
    }
  }

  // ── Loading / generating ─────────────────────────────────
  if (phase === 'loading' || phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-forest border-t-transparent animate-spin" />
        <p className="label text-center">
          {phase === 'generating' ? `GENERATING QUESTIONS FOR ${topicTitle.toUpperCase()}…` : 'LOADING…'}
        </p>
        {phase === 'generating' && (
          <p className="text-xs text-muted text-center max-w-xs">
            Claude is writing 30 exam-standard MCQs. This takes about 15 seconds and only happens once.
          </p>
        )}
      </div>
    )
  }

  // ── Complete ─────────────────────────────────────────────
  if (phase === 'complete') {
    const score = Math.round((correctCount / questions.length) * 100)
    return (
      <div className="flex flex-col items-center py-16 gap-6 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center text-2xl text-white">
          {score >= 70 ? '🎉' : score >= 50 ? '💪' : '📖'}
        </div>
        <div>
          <p className="font-serif text-3xl font-bold text-ink">{score}%</p>
          <p className="text-muted text-sm mt-1">
            {correctCount} of {questions.length} correct
          </p>
        </div>
        <p className="font-serif italic text-muted text-sm max-w-xs">
          {score >= 70
            ? 'Strong session. Keep the streak going.'
            : score >= 50
            ? 'Good effort. The spaced repetition will bring the tricky ones back.'
            : 'These will resurface soon — repetition is the key.'}
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
              setSelected(null)
              setCorrectCount(0)
              void loadSession()
            }}
            className="bg-forest text-white text-sm px-4 py-2 rounded hover:bg-forest-light transition-colors"
          >
            Go again →
          </button>
        </div>
      </div>
    )
  }

  // ── Question ─────────────────────────────────────────────
  return (
    <div>
      <QuestionCard
        question={currentQ}
        index={currentIndex}
        total={questions.length}
        selected={selected}
        revealed={phase === 'feedback'}
        onSelect={handleSelect}
        onRate={handleRate}
      />

      {/* Next button */}
      {phase === 'feedback' && currentIndex < questions.length - 1 && (
        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              setCurrentIndex((i) => i + 1)
              setSelected(null)
              setPhase('question')
            }}
            className="bg-forest text-white text-sm font-mono font-bold px-5 py-2.5 rounded hover:bg-forest-light transition-colors tracking-wide"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  )
}
