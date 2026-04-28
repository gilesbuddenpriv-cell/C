'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Question, Rating } from '@/types'

interface FlashCardProps {
  question: Question
  index: number
  total: number
  tally: Record<Rating, number>
  onRate: (r: Rating) => void
}

const RATINGS: { value: Rating; label: string; key: string; colour: string; bg: string }[] = [
  { value: 'again', label: 'AGAIN', key: '1', colour: '#DC2626', bg: '#FEF2F2' },
  { value: 'hard',  label: 'HARD',  key: '2', colour: '#B07D20', bg: '#FDF3D0' },
  { value: 'good',  label: 'GOOD',  key: '3', colour: '#1B5E42', bg: '#F0FDF4' },
  { value: 'easy',  label: 'EASY',  key: '4', colour: '#0F766E', bg: '#CCFBF1' },
]

const TALLY_CONFIG: { value: Rating; icon: string; colour: string }[] = [
  { value: 'again', icon: '↻', colour: '#DC2626' },
  { value: 'hard',  icon: '~', colour: '#B07D20' },
  { value: 'good',  icon: '✓', colour: '#1B5E42' },
  { value: 'easy',  icon: '⚡', colour: '#0F766E' },
]

export default function FlashCard({ question, index, total, tally, onRate }: FlashCardProps) {
  const [flipped, setFlipped]     = useState(false)
  const [pressed, setPressed]     = useState<Rating | null>(null)
  const [hinting, setHinting]     = useState(false)   // space-bar hint pulse
  const touchStartY               = useRef<number | null>(null)
  const touchStartX               = useRef<number | null>(null)
  const ratingBtnsRef             = useRef<HTMLDivElement>(null)

  const correctOption = question.correct_option
  const correctText   = question[`option_${correctOption}` as keyof Question] as string

  const flip = useCallback(() => setFlipped(true), [])

  const rate = useCallback((r: Rating) => {
    setPressed(r)
    // brief highlight then advance
    setTimeout(() => {
      setPressed(null)
      onRate(r)
    }, 140)
  }, [onRate])

  // Keyboard handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // Don't fire when focus is inside an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      if (!flipped) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault()
          flip()
        }
        // Pulse hint
        if (e.code === 'Space') {
          setHinting(true)
          setTimeout(() => setHinting(false), 300)
        }
      } else {
        if (e.key === '1') rate('again')
        if (e.key === '2') rate('hard')
        if (e.key === '3') rate('good')
        if (e.key === '4') rate('easy')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flipped, flip, rate])

  // Touch swipe — swipe up to flip, swipe right/left to rate (when flipped)
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null || touchStartX.current === null) return
    const dy = touchStartY.current - e.changedTouches[0].clientY
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartY.current = null
    touchStartX.current = null

    if (!flipped && dy > 40) { flip(); return }
    if (flipped) {
      if (dx < -60) rate('again')
      else if (dx > 60) rate('easy')
    }
  }

  const progress = index / total   // 0→1

  return (
    <div className="animate-fade-in" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Progress dots + counter ── */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i < index
                  ? 'var(--forest)'
                  : i === index
                  ? 'var(--forest-light)'
                  : 'var(--border)',
                opacity: i === index ? 1 : i < index ? 0.7 : 0.4,
              }}
            />
          ))}
        </div>
        <span className="label shrink-0">{index + 1}/{total}</span>
      </div>

      {/* ── Flip card ── */}
      <div
        className="relative"
        style={{ perspective: '1400px', minHeight: '280px' }}
        onClick={() => !flipped && flip()}
      >
        {/* Inner (rotates) */}
        <div
          className="relative w-full"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '280px',
          }}
        >
          {/* ── FRONT ── */}
          <div
            className="absolute inset-0 flex flex-col rounded-sm"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--forest)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <div className="p-5 flex flex-col flex-1">
              <p className="label-green mb-4">QUESTION</p>
              <p className="font-serif text-base leading-relaxed text-ink flex-1">
                {question.question_text}
              </p>

              {/* Flip hint */}
              <div
                className="mt-6 flex flex-col items-center gap-2 transition-opacity duration-200"
                style={{ opacity: hinting ? 0.3 : 0.55 }}
              >
                <div
                  className="w-8 h-8 rounded border-2 flex items-center justify-center"
                  style={{ borderColor: 'var(--forest)', color: 'var(--forest)' }}
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1 }}>↑</span>
                </div>
                <span className="label" style={{ fontSize: '0.6rem' }}>
                  SPACE · ENTER · TAP · SWIPE UP
                </span>
              </div>
            </div>
          </div>

          {/* ── BACK ── */}
          <div
            className="absolute inset-0 flex flex-col rounded-sm overflow-auto"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--teal)',
              userSelect: 'none',
            }}
          >
            <div className="p-5 flex flex-col flex-1">
              {/* Answer header */}
              <div className="flex items-baseline gap-3 mb-3">
                <p className="label" style={{ color: 'var(--teal)' }}>ANSWER</p>
                <span
                  className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--teal)', color: 'white', fontSize: '0.65rem' }}
                >
                  {correctOption.toUpperCase()}
                </span>
              </div>

              <p className="font-serif text-base font-bold text-ink leading-snug mb-4">
                {correctText}
              </p>

              <div className="w-full h-px mb-4" style={{ background: 'var(--border)' }} />

              <p className="label mb-2">EXPLANATION</p>
              <p className="font-serif text-sm text-ink leading-relaxed flex-1">
                {question.explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rating buttons (slide in after flip) ── */}
      <div
        className="mt-4 overflow-hidden"
        style={{
          maxHeight: flipped ? '120px' : '0',
          opacity: flipped ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.25s ease',
        }}
      >
        <p className="label mb-2">HOW DID YOU FIND IT?</p>
        <div ref={ratingBtnsRef} className="flex gap-2">
          {RATINGS.map(({ value, label, key, colour, bg }) => {
            const isPressed = pressed === value
            return (
              <button
                key={value}
                onClick={() => rate(value)}
                className="flex-1 flex flex-col items-center gap-1 rounded py-2.5 border font-mono text-xs font-bold tracking-wide transition-all duration-150"
                style={{
                  borderColor: colour,
                  color: isPressed ? 'white' : colour,
                  background: isPressed ? colour : bg,
                  transform: isPressed ? 'scale(0.96)' : 'scale(1)',
                }}
              >
                <span>{label}</span>
                <span
                  className="rounded px-1"
                  style={{
                    fontSize: '0.55rem',
                    background: isPressed ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                    letterSpacing: '0',
                  }}
                >
                  [{key}]
                </span>
              </button>
            )
          })}
        </div>

        {/* Mobile swipe hint */}
        <p className="label text-center mt-3" style={{ opacity: 0.4, fontSize: '0.6rem' }}>
          ← SWIPE LEFT = AGAIN · SWIPE RIGHT = EASY
        </p>
      </div>

      {/* ── Session tally strip ── */}
      {(tally.again + tally.hard + tally.good + tally.easy) > 0 && (
        <div
          className="mt-5 flex items-center justify-center gap-4 py-2 rounded"
          style={{ background: 'var(--grid-line)', border: '1px solid var(--border)' }}
        >
          {TALLY_CONFIG.map(({ value, icon, colour }) => (
            <div key={value} className="flex items-center gap-1">
              <span className="font-mono text-xs font-bold" style={{ color: colour }}>{icon}</span>
              <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                {tally[value]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
