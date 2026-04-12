import type { Rating } from '@/types'

const RATINGS: { value: Rating; label: string }[] = [
  { value: 'again', label: 'AGAIN' },
  { value: 'hard',  label: 'HARD'  },
  { value: 'good',  label: 'GOOD'  },
  { value: 'easy',  label: 'EASY'  },
]

const COLOURS: Record<Rating, string> = {
  again: 'border-red-400 text-red-600 hover:bg-red-50',
  hard:  'border-amber  text-amber  hover:bg-amber-bg',
  good:  'border-forest text-forest hover:bg-forest-pale',
  easy:  'border-teal   text-teal   hover:bg-teal-bg',
}

interface RatingBarProps {
  onRate: (rating: Rating) => void
  disabled?: boolean
}

export default function RatingBar({ onRate, disabled = false }: RatingBarProps) {
  return (
    <div className="mt-4">
      <p className="label mb-2">HOW DID YOU FIND IT?</p>
      <div className="flex gap-2">
        {RATINGS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onRate(value)}
            disabled={disabled}
            className={`flex-1 border rounded py-2 text-xs font-mono font-bold tracking-wide transition-colors disabled:opacity-40 ${COLOURS[value]}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
