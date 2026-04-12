interface FeedbackPanelProps {
  isCorrect: boolean
  explanation: string
}

export default function FeedbackPanel({ isCorrect, explanation }: FeedbackPanelProps) {
  return (
    <div
      className="mt-4 rounded p-4 animate-fade-in"
      style={{
        background: isCorrect ? 'var(--teal-bg, #CCFBF1)' : 'var(--red-bg, #FEF2F2)',
        borderLeft: `4px solid ${isCorrect ? 'var(--teal)' : 'var(--red)'}`,
      }}
    >
      <p
        className="font-mono text-xs font-bold mb-2 tracking-wide"
        style={{ color: isCorrect ? 'var(--teal)' : 'var(--red)' }}
      >
        {isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
      </p>
      <p className="font-serif text-sm text-ink leading-relaxed">{explanation}</p>
    </div>
  )
}
