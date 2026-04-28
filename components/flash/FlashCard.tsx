'use client'

import { useState } from 'react'
import type { Question, Rating } from '@/types'
import RatingBar from '@/components/quiz/RatingBar'

interface FlashCardProps {
  question: Question
  index: number
  total: number
  onRate: (r: Rating) => void
}

export default function FlashCard({ question, index, total, onRate }: FlashCardProps) {
  const [flipped, setFlipped] = useState(false)

  const correctOption = question.correct_option
  const correctText = question[`option_${correctOption}` as keyof Question] as string

  return (
    <div className="animate-fade-in">
      {/* Progress label */}
      <div className="flex items-center justify-between mb-3">
        <p className="label">CARD {index + 1} OF {total}</p>
        <p className="label">{Math.round(((index) / total) * 100)}% DONE</p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 bg-border rounded mb-5">
        <div
          className="h-0.5 bg-forest rounded transition-all duration-500"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>

      {/* Card flip container */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: '1200px', minHeight: '260px' }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '260px',
          }}
        >
          {/* Front face */}
          <div
            className="card p-6 absolute inset-0 flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              borderLeft: '4px solid var(--forest)',
            }}
          >
            <p className="label-green mb-4">QUESTION</p>
            <p className="font-serif text-base leading-relaxed text-ink flex-1">
              {question.question_text}
            </p>
            {!flipped && (
              <div className="mt-6 flex items-center justify-center gap-2 text-muted">
                <span className="text-base">↕</span>
                <span className="label">TAP TO REVEAL ANSWER</span>
              </div>
            )}
          </div>

          {/* Back face */}
          <div
            className="card p-6 absolute inset-0 flex flex-col"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              borderLeft: '4px solid var(--teal)',
            }}
          >
            <p className="label mb-1" style={{ color: 'var(--teal)' }}>ANSWER</p>
            <p className="font-mono text-xs font-bold mb-3" style={{ color: 'var(--teal)' }}>
              {correctOption.toUpperCase()}
            </p>
            <p className="font-serif text-base font-bold text-ink leading-snug mb-4">
              {correctText}
            </p>
            <div className="w-full h-px bg-border mb-4" />
            <p className="label mb-1">EXPLANATION</p>
            <p className="font-serif text-sm text-ink leading-relaxed flex-1">
              {question.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Rating — only visible after flip */}
      {flipped && (
        <div className="mt-5 animate-fade-in">
          <RatingBar onRate={(r) => { setFlipped(false); onRate(r) }} />
        </div>
      )}

      {/* Hint when not yet flipped */}
      {!flipped && (
        <p className="text-center label mt-4 opacity-50">OR PRESS SPACE TO FLIP</p>
      )}
    </div>
  )
}
