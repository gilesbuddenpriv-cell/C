'use client'

import { useState, useEffect } from 'react'
import { differenceInCalendarDays, format, parseISO, isValid } from 'date-fns'
import { getGuestExamDate, setGuestExamDate } from '@/lib/localStorage'

interface ExamCountdownProps {
  userId?: string
  serverExamDate?: string  // fetched server-side for auth'd users
}

export default function ExamCountdown({ userId, serverExamDate }: ExamCountdownProps) {
  const [examDate, setExamDate] = useState<string>(serverExamDate ?? '2026-06-08')
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  useEffect(() => {
    if (!userId) {
      // Guest — read from localStorage
      const stored = getGuestExamDate()
      setExamDate(stored)
    }
  }, [userId])

  const parsed = parseISO(examDate)
  const daysLeft = isValid(parsed) ? differenceInCalendarDays(parsed, new Date()) : null

  async function handleSave() {
    if (!inputVal) { setEditing(false); return }
    setExamDate(inputVal)
    setEditing(false)

    if (userId) {
      await fetch('/api/exam-date', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examDate: inputVal }),
      })
    } else {
      setGuestExamDate(inputVal)
    }
  }

  return (
    <div className="flex items-center gap-3 border border-blue-200 bg-blue-50 rounded px-4 py-3 mb-6">
      <span className="text-xl shrink-0">📅</span>
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="border border-border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:border-forest"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="text-xs font-mono font-bold text-forest border border-forest/30 px-2 py-1 rounded hover:bg-forest-pale transition-colors"
            >
              SAVE
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-xs text-muted hover:text-ink"
            >
              cancel
            </button>
          </div>
        ) : (
          <>
            <p className="font-bold text-ink text-sm leading-tight">
              {daysLeft !== null && daysLeft >= 0
                ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} to go`
                : daysLeft !== null
                ? 'Exam passed'
                : '—'}
            </p>
            <p className="text-xs text-muted">
              BASRaT exam: {isValid(parsed) ? format(parsed, 'd MMMM yyyy') : '—'}
            </p>
          </>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => { setInputVal(examDate); setEditing(true) }}
          className="shrink-0 text-xs font-mono font-bold text-ink border border-border px-3 py-1.5 rounded hover:bg-white transition-colors tracking-wide"
        >
          CHANGE
        </button>
      )}
    </div>
  )
}
