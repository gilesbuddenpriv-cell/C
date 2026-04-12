import { createClient } from '@/lib/supabase/server'
import { getTopicBySlug } from '@/data/topics'
import QuizSession from '@/components/quiz/QuizSession'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Handle both pre-built and custom topics
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
      // Guest custom topics are stored in localStorage — we only have the id here
      title = 'Custom Topic'
    }
  } else {
    const topic = getTopicBySlug(slug)
    if (!topic) notFound()
    title = topic.title
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-cream/90 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-border z-10">
        <Link
          href="/"
          className="text-xs font-mono text-muted hover:text-ink transition-colors border border-border rounded px-3 py-1.5"
        >
          ← BACK
        </Link>
        <h1 className="font-serif text-sm font-bold text-ink truncate mx-4 flex-1 text-center">
          {title}
        </h1>
        <div className="w-16" />  {/* spacer to centre the title */}
      </div>

      {/* Quiz */}
      <QuizSession
        topicSlug={slug}
        topicTitle={title}
        userId={user?.id}
      />
    </div>
  )
}
