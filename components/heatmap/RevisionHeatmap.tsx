'use client'

import { useEffect, useState } from 'react'
import { eachDayOfInterval, format, startOfWeek, subMonths, parseISO, getDay } from 'date-fns'
import { getGuestHeatmapData } from '@/lib/localStorage'

interface RevisionHeatmapProps {
  userId?: string
  serverData?: Record<string, number>
}

function getColour(count: number): string {
  if (count === 0) return '#E8E4DC'
  if (count < 5)  return '#B7DFC9'
  if (count < 15) return '#68BB93'
  if (count < 30) return '#2D7A57'
  return '#1B5E42'
}

export default function RevisionHeatmap({ userId, serverData = {} }: RevisionHeatmapProps) {
  const [data, setData] = useState<Record<string, number>>(serverData)

  useEffect(() => {
    if (!userId) setData(getGuestHeatmapData())
    else setData(serverData)
  }, [userId, serverData])

  const today = new Date()
  const start = startOfWeek(subMonths(today, 5), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end: today })

  // Group into weeks (columns)
  const weeks: Date[][] = []
  let current: Date[] = []
  for (const day of days) {
    const dow = getDay(day) // 0 = Sunday
    const weekDay = dow === 0 ? 6 : dow - 1  // Mon=0 … Sun=6
    if (weekDay === 0 && current.length > 0) {
      weeks.push(current)
      current = []
    }
    current.push(day)
  }
  if (current.length) weeks.push(current)

  const totalQuestions = Object.values(data).reduce((a, b) => a + b, 0)
  const activeDays = Object.values(data).filter((v) => v > 0).length

  if (totalQuestions === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="label">REVISION ACTIVITY</h2>
        <p className="text-xs text-muted">
          {totalQuestions} questions · {activeDays} days
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => {
                const key = format(day, 'yyyy-MM-dd')
                const count = data[key] ?? 0
                return (
                  <div
                    key={di}
                    title={`${format(day, 'd MMM')}: ${count} question${count === 1 ? '' : 's'}`}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getColour(count) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs text-muted mr-1">Less</span>
        {[0, 3, 10, 20, 35].map((n) => (
          <div key={n} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColour(n) }} />
        ))}
        <span className="text-xs text-muted ml-1">More</span>
      </div>
    </div>
  )
}
