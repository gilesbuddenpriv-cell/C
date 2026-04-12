import type { Question } from '@/types'

type Option = 'a' | 'b' | 'c' | 'd'

interface AnswerOptionsProps {
  question: Question
  selected: Option | null
  revealed: boolean
  onSelect: (option: Option) => void
}

const OPTION_KEYS: Option[] = ['a', 'b', 'c', 'd']

function optionText(question: Question, opt: Option): string {
  return question[`option_${opt}` as keyof Question] as string
}

export default function AnswerOptions({ question, selected, revealed, onSelect }: AnswerOptionsProps) {
  return (
    <div className="space-y-2 mt-4">
      {OPTION_KEYS.map((opt) => {
        const isSelected = selected === opt
        const isCorrect  = question.correct_option === opt
        const isWrong    = isSelected && !isCorrect

        let bg    = 'bg-card hover:bg-white'
        let border = 'border-border'
        let textColour = 'text-ink'
        let opacity = ''

        if (revealed) {
          if (isCorrect) {
            bg = 'bg-teal-50'
            border = 'border-teal'
            textColour = 'text-teal-800'
          } else if (isWrong) {
            bg = 'bg-red-50'
            border = 'border-red-400'
            textColour = 'text-red-700'
          } else {
            opacity = 'opacity-40'
          }
        }

        return (
          <button
            key={opt}
            onClick={() => !revealed && onSelect(opt)}
            disabled={revealed}
            className={`w-full flex items-start gap-3 border rounded p-3 text-left transition-all ${bg} ${border} ${textColour} ${opacity} disabled:cursor-default`}
          >
            <span
              className={`shrink-0 w-5 h-5 rounded-sm border flex items-center justify-center font-mono text-xs font-bold mt-0.5 ${
                revealed && isCorrect
                  ? 'bg-teal border-teal text-white'
                  : revealed && isWrong
                  ? 'bg-red-400 border-red-400 text-white'
                  : 'border-border text-muted'
              }`}
            >
              {opt.toUpperCase()}
            </span>
            <span className="font-serif text-sm leading-snug">{optionText(question, opt)}</span>
          </button>
        )
      })}
    </div>
  )
}
