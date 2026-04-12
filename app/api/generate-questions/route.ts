import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTopicQuestions } from '@/lib/claude'
import { getTopicBySlug } from '@/data/topics'

export async function POST(request: Request) {
  try {
    const { topicSlug, userId } = await request.json() as { topicSlug: string; userId?: string }

    const supabase = await createClient()

    // Resolve topic
    const isCustom = topicSlug.startsWith('custom-')
    if (isCustom) {
      return NextResponse.json(
        { error: 'Use /api/process-document for custom topics.' },
        { status: 400 },
      )
    }

    const topicDef = getTopicBySlug(topicSlug)
    if (!topicDef) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 })
    }

    // Fetch the topic DB record to get its UUID
    const { data: topicRow, error: topicErr } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', topicSlug)
      .single()

    if (topicErr || !topicRow) {
      return NextResponse.json({ error: 'Topic not in database.' }, { status: 404 })
    }

    // Check if questions already exist (race condition guard)
    const { data: existing } = await supabase
      .from('questions')
      .select('id')
      .eq('topic_id', topicRow.id)
      .limit(1)

    if (existing && existing.length > 0) {
      // Questions already generated — return them with progress
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('topic_id', topicRow.id)

      let progress: Record<string, object> = {}
      if (userId) {
        const ids = (questions ?? []).map((q) => q.id)
        const { data: prog } = await supabase
          .from('user_question_progress')
          .select('*')
          .eq('user_id', userId)
          .in('question_id', ids)
        if (prog) {
          for (const p of prog) progress[p.question_id] = p
        }
      }

      return NextResponse.json({ questions, progress })
    }

    // Generate via Claude
    const generated = await generateTopicQuestions(
      topicDef.title,
      topicDef.subtitle,
      topicRow.id,
    )

    // Insert into DB
    const { data: inserted, error: insertErr } = await supabase
      .from('questions')
      .insert(generated)
      .select()

    if (insertErr) {
      console.error('Question insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to save questions.' }, { status: 500 })
    }

    return NextResponse.json({ questions: inserted ?? [], progress: {} })
  } catch (err) {
    console.error('generate-questions error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
