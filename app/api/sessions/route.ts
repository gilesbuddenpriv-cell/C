import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
    }

    const { topicSlug, questionsAnswered, correctAnswers } = await request.json() as {
      topicSlug: string
      questionsAnswered: number
      correctAnswers: number
    }

    const isCustom = topicSlug.startsWith('custom-')
    const customTopicId = isCustom ? topicSlug.replace('custom-', '') : null

    let topicId: string | null = null
    if (!isCustom) {
      const { data } = await supabase
        .from('topics')
        .select('id')
        .eq('slug', topicSlug)
        .single()
      topicId = data?.id ?? null
    }

    const { error } = await supabase.from('study_sessions').insert({
      user_id:            user.id,
      topic_id:           topicId,
      custom_topic_id:    customTopicId,
      questions_answered: questionsAnswered,
      correct_answers:    correctAnswers,
      session_date:       format(new Date(), 'yyyy-MM-dd'),
    })

    if (error) {
      console.error('session insert error:', error)
      return NextResponse.json({ error: 'Failed to record session.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('sessions POST error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
