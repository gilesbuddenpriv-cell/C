import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 })
    }

    const { examDate } = await request.json() as { examDate: string }

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, exam_date: examDate },
        { onConflict: 'user_id' },
      )

    if (error) {
      return NextResponse.json({ error: 'Failed to save date.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('exam-date POST error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
