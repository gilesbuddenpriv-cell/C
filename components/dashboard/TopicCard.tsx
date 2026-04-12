import Link from 'next/link'
import type { TopicDef } from '@/data/topics'

interface TopicCardProps {
  topic: TopicDef
  isNew?: boolean
  hasProgress?: boolean
}

export default function TopicCard({ topic, isNew = true, hasProgress = false }: TopicCardProps) {
  return (
    <Link
      href={`/topic/${topic.slug}`}
      className="card block p-4 hover:shadow-sm hover:border-forest/30 transition-all relative group"
    >
      {/* Progress bar along top edge (if user has started this topic) */}
      {hasProgress && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-forest rounded-t" />
      )}

      {/* NEW badge */}
      {isNew && !hasProgress && (
        <span
          className="absolute top-2.5 right-2.5 text-xs font-mono font-bold px-2 py-0.5 rounded-full border"
          style={{
            color: 'var(--amber)',
            borderColor: 'var(--amber-border, #E6C96A)',
            background: 'var(--amber-bg)',
            fontSize: '0.625rem',
            letterSpacing: '0.08em',
          }}
        >
          NEW
        </span>
      )}

      <div className="mb-2 text-xl">{topic.emoji}</div>
      <h3 className="font-serif text-sm font-bold text-ink leading-snug mb-1 pr-8">
        {topic.title}
      </h3>
      <p className="text-xs text-muted leading-snug">{topic.subtitle}</p>
    </Link>
  )
}
