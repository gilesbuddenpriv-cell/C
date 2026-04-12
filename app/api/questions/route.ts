import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const topicSlug = searchParams.get('topicSlug')

    if (!topicSlug) {
      return NextResponse.json({ error: 'topicSlug required.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const isCustom = topicSlug.startsWith('custom-')
    let questions: object[] = []

    if (isCustom) {
      const customId = topicSlug.replace('custom-', '')
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('custom_topic_id', customId)
      questions = data ?? []
    } else {
      // Look up topic by slug
      const { data: topicRow } = await supabase
        .from('topics')
        .select('id')
        .eq('slug', topicSlug)
        .single()

      if (topicRow) {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .eq('topic_id', topicRow.id)
        questions = data ?? []
      }
    }

    // Fetch SM-2 progress for the authenticated user
    let progress: Record<string, object> = {}
    if (user && questions.length > 0) {
      const ids = (questions as Array<{ id: string }>).map((q) => q.id)
      const { data: prog } = await supabase
        .from('user_question_progress')
        .select('*')
        .eq('user_id', user.id)
        .in('question_id', ids)
      if (prog) {
        for (const p of prog) {
          progress[(p as { question_id: string }).question_id] = p
        }
      }
    }

    return NextResponse.json({ questions, progress })
  } catch (err) {
    console.error('questions GET error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
