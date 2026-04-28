import { createClient } from '@/lib/supabase/server'
import { getTopicBySlug } from '@/data/topics'
import FlashSession from '@/components/flash/FlashSession'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function FlashPage({ params }: PageProps) {
  const { slug } = await params
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const isCustom = slug.startsWith('custom-')
  let title = ''

  if (isCustom) {
    const customId = slug.replace('custom-', '')
    if (user) {
      const { data } = await supabase
        .from('custom_topics')
        .select('title, status')
        .eq('id', customId)
        .eq('user_id', user.id)
        .single()
      if (!data) notFound()
      title = data.title
    } else {
      title = 'Custom Topic'
    }
  } else {
    const topic = getTopicBySlug(slug)
    if (!topic) notFound()
    title = topic!.title
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-cream/90 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border z-10">
        <Link
          href={`/topic/${slug}`}
          className="text-xs font-mono text-muted hover:text-ink transition-colors border border-border rounded px-3 py-1.5"
        >
          ← MCQ
        </Link>
        <div className="flex flex-col items-center flex-1 mx-4">
          <h1 className="font-serif text-sm font-bold text-ink truncate text-center">{title}</h1>
          <span
            className="font-mono text-xs font-bold px-2 py-0.5 rounded mt-0.5"
            style={{ background: 'var(--forest)', color: 'white', fontSize: '0.6rem', letterSpacing: '0.08em' }}
          >
            FLASH MODE
          </span>
        </div>
        <div className="w-16" />
      </div>

      <FlashSession
        topicSlug={slug}
        topicTitle={title}
        userId={user?.id}
      />
    </div>
  )
}
