import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SM2State } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
    }

    const { questionId, sm2State } = await request.json() as {
      questionId: string
      sm2State: SM2State
    }

    const { error } = await supabase
      .from('user_question_progress')
      .upsert(
        {
          user_id:        user.id,
          question_id:    questionId,
          ease_factor:    sm2State.ease_factor,
          interval_days:  sm2State.interval_days,
          repetitions:    sm2State.repetitions,
          next_review_at: sm2State.next_review_at,
          last_rating:    sm2State.last_rating,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'user_id,question_id' },
      )

    if (error) {
      console.error('progress upsert error:', error)
      return NextResponse.json({ error: 'Failed to save progress.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('progress POST error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
