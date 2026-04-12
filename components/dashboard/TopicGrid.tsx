import TopicCard from './TopicCard'
import { TOPICS, CATEGORY_LABELS, CATEGORY_ORDER, type TopicDef } from '@/data/topics'
import type { Category } from '@/types'

interface TopicGridProps {
  startedSlugs?: Set<string>
}

export default function TopicGrid({ startedSlugs = new Set() }: TopicGridProps) {
  const grouped = CATEGORY_ORDER.reduce<Record<Category, TopicDef[]>>(
    (acc, cat) => {
      acc[cat] = TOPICS.filter((t) => t.category === cat)
      return acc
    },
    {} as Record<Category, TopicDef[]>,
  )

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((cat) => (
        <section key={cat}>
          <h2 className="label mb-3">{CATEGORY_LABELS[cat]}</h2>
          <div className="grid grid-cols-2 gap-3">
            {grouped[cat].map((topic) => (
              <TopicCard
                key={topic.slug}
                topic={topic}
                isNew={!startedSlugs.has(topic.slug)}
                hasProgress={startedSlugs.has(topic.slug)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
