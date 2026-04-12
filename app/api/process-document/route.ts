import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDocumentQuestions } from '@/lib/claude'

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.name.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')).default
    const parsed = await pdfParse(buffer)
    return parsed.text
  }

  if (file.name.endsWith('.docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // Plain text
  return buffer.toString('utf-8')
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const formData = await request.formData()
    const file  = formData.get('file')  as File | null
    const title = (formData.get('title') as string | null) ?? 'Custom Topic'

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit.' }, { status: 400 })
    }

    // Extract text
    let documentText: string
    try {
      documentText = await extractText(file)
    } catch {
      return NextResponse.json({ error: 'Could not read file. Try PDF, DOCX, or TXT.' }, { status: 422 })
    }

    if (documentText.trim().length < 200) {
      return NextResponse.json(
        { error: 'Document appears to be empty or too short to generate questions from.' },
        { status: 422 },
      )
    }

    let customTopicId: string

    if (user) {
      // Authenticated — store document and create DB record
      const filePath = `${user.id}/${Date.now()}-${file.name}`
      await supabase.storage.from('documents').upload(filePath, file)

      const { data: topicRow, error: topicErr } = await supabase
        .from('custom_topics')
        .insert({
          user_id:       user.id,
          title,
          document_name: file.name,
          document_url:  filePath,
          status:        'processing',
        })
        .select('id')
        .single()

      if (topicErr || !topicRow) {
        return NextResponse.json({ error: 'Failed to create topic.' }, { status: 500 })
      }

      customTopicId = topicRow.id

      // Generate questions
      const generated = await generateDocumentQuestions(documentText, customTopicId)

      // Insert questions
      const { error: qErr } = await supabase.from('questions').insert(generated)

      if (qErr) {
        await supabase.from('custom_topics').update({ status: 'error' }).eq('id', customTopicId)
        return NextResponse.json({ error: 'Failed to save questions.' }, { status: 500 })
      }

      // Mark ready
      await supabase.from('custom_topics').update({ status: 'ready' }).eq('id', customTopicId)
    } else {
      // Guest — generate questions without persisting to DB
      customTopicId = crypto.randomUUID()
      const generated = await generateDocumentQuestions(documentText, customTopicId)

      return NextResponse.json({
        customTopicId,
        title,
        questions: generated.map((q, i) => ({ ...q, id: `guest-${i}`, created_at: new Date().toISOString() })),
      })
    }

    return NextResponse.json({ customTopicId, title })
  } catch (err) {
    console.error('process-document error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
