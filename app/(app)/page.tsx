import { createClient } from '@/lib/supabase/server'
import ExamCountdown from '@/components/dashboard/ExamCountdown'
import TopicGrid from '@/components/dashboard/TopicGrid'
import CustomTopicsSection from '@/components/dashboard/CustomTopicsSection'
import RevisionHeatmap from '@/components/heatmap/RevisionHeatmap'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let examDate: string | undefined
  let startedSlugs: Set<string> = new Set()
  let serverCustomTopics: { id: string; title: string; status: 'processing' | 'ready' | 'error' }[] = []
  let heatmapData: Record<string, number> = {}

  if (user) {
    // Fetch user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('exam_date')
      .eq('user_id', user.id)
      .single()
    examDate = settings?.exam_date

    // Fetch slugs the user has started (has at least one progress record)
    const { data: progress } = await supabase
      .from('user_question_progress')
      .select('question_id, questions!inner(topic_id, topics!inner(slug))')
      .eq('user_id', user.id)
      .limit(200)

    if (progress) {
      for (const row of progress as unknown as Array<{ questions: { topics: { slug: string } } }>) {
        const slug = row.questions?.topics?.slug
        if (slug) startedSlugs.add(slug)
      }
    }

    // Fetch custom topics
    const { data: customTopics } = await supabase
      .from('custom_topics')
      .select('id, title, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    serverCustomTopics = (customTopics ?? []) as typeof serverCustomTopics

    // Fetch heatmap data (last 12 months)
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('session_date, questions_answered')
      .eq('user_id', user.id)
      .gte('session_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    if (sessions) {
      for (const s of sessions) {
        heatmapData[s.session_date] = (heatmapData[s.session_date] ?? 0) + s.questions_answered
      }
    }
  }

  return (
    <>
      {/* Hero */}
      <div className="mb-8">
        <p className="label mb-2">BASRAT REGISTRATION EXAM · MCQ BANK</p>
        <h1 className="font-serif text-4xl font-bold text-ink leading-tight mb-3">
          Train like the{' '}
          <span style={{ color: 'var(--forest)' }}>exam matters.</span>
        </h1>
        <p className="font-serif italic text-base text-muted leading-relaxed">
          AI-generated questions at registration-exam standard. SM-2 spaced repetition surfaces what
          needs work. Pick a topic, answer 10 questions, build your schedule.
        </p>
      </div>

      {/* Exam countdown */}
      <ExamCountdown userId={user?.id} serverExamDate={examDate} />

      {/* Heatmap (signed-in users or guest with data) */}
      <RevisionHeatmap userId={user?.id} serverData={heatmapData} />

      {/* Pre-built topics */}
      <TopicGrid startedSlugs={startedSlugs} />

      {/* Custom topics */}
      <CustomTopicsSection userId={user?.id} serverTopics={serverCustomTopics} />

      {/* Bottom spacing */}
      <div className="h-12" />
    </>
  )
}
