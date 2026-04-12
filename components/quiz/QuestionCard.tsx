import type { Question } from '@/types'
import AnswerOptions from './AnswerOptions'
import FeedbackPanel from './FeedbackPanel'
import RatingBar from './RatingBar'
import type { Rating } from '@/types'

type Option = 'a' | 'b' | 'c' | 'd'

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  selected: Option | null
  revealed: boolean
  onSelect: (opt: Option) => void
  onRate: (r: Rating) => void
}

export default function QuestionCard({
  question,
  index,
  total,
  selected,
  revealed,
  onSelect,
  onRate,
}: QuestionCardProps) {
  const isCorrect = selected !== null && selected === question.correct_option

  return (
    <div className="animate-fade-in">
      {/* Question card */}
      <div
        className="card p-4 mb-1"
        style={{ borderLeft: '4px solid var(--forest)' }}
      >
        <p className="label-green mb-3">QUESTION {index + 1}</p>
        <p className="font-serif text-base leading-relaxed text-ink">{question.question_text}</p>
      </div>

      {/* Options */}
      <AnswerOptions
        question={question}
        selected={selected}
        revealed={revealed}
        onSelect={onSelect}
      />

      {/* Feedback + rating */}
      {revealed && (
        <>
          <FeedbackPanel isCorrect={isCorrect} explanation={question.explanation} />
          <RatingBar onRate={onRate} />
        </>
      )}
    </div>
  )
}
