'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { GuestCustomTopic } from '@/types'
import { getGuestCustomTopics, addGuestCustomTopic } from '@/lib/localStorage'

interface ServerCustomTopic {
  id: string
  title: string
  status: 'processing' | 'ready' | 'error'
}

interface CustomTopicsSectionProps {
  userId?: string
  serverTopics?: ServerCustomTopic[]
}

export default function CustomTopicsSection({ userId, serverTopics = [] }: CustomTopicsSectionProps) {
  const [guestTopics, setGuestTopics] = useState<GuestCustomTopic[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!userId) setGuestTopics(getGuestCustomTopics())
  }, [userId])

  const displayTopics = userId
    ? serverTopics
    : guestTopics.map((t) => ({ id: t.id, title: t.title, status: 'ready' as const }))

  async function handleFile(file: File) {
    if (!file) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name.replace(/\.[^.]+$/, ''))

    try {
      const res = await fetch('/api/process-document', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 401) {
        setError('Sign in to save custom topics permanently.')
        setUploading(false)
        return
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      if (!userId) {
        const newTopic: GuestCustomTopic = {
          id: data.customTopicId,
          title: data.title,
          created_at: new Date().toISOString(),
        }
        addGuestCustomTopic(newTopic)
        setGuestTopics((prev) => [...prev, newTopic])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="label">MY CUSTOM TOPICS</h2>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-mono font-bold text-white bg-forest px-3 py-1.5 rounded hover:bg-forest-light disabled:opacity-50 transition-colors tracking-wide"
        >
          {uploading ? 'PROCESSING…' : '+ UPLOAD DOCUMENT'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-3">
          {error}
        </p>
      )}

      {displayTopics.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {displayTopics.map((topic) => (
            <Link
              key={topic.id}
              href={topic.status === 'ready' ? `/topic/custom-${topic.id}` : '#'}
              className={`card block p-4 transition-all ${
                topic.status === 'ready'
                  ? 'hover:shadow-sm hover:border-forest/30'
                  : 'opacity-60 cursor-default'
              }`}
            >
              <div className="mb-2 text-xl">📄</div>
              <h3 className="font-serif text-sm font-bold text-ink leading-snug mb-1">
                {topic.title}
              </h3>
              {topic.status === 'processing' && (
                <p className="text-xs text-amber animate-pulse-gentle">Generating questions…</p>
              )}
              {topic.status === 'error' && (
                <p className="text-xs text-red-500">Processing failed</p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border rounded p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-forest/40 transition-colors"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <span className="text-3xl opacity-40">🗂️</span>
          <p className="label text-center">
            {uploading ? 'PROCESSING DOCUMENT…' : 'UPLOAD A DOCUMENT TO CREATE A CUSTOM TOPIC'}
          </p>
          <p className="text-xs text-muted">PDF, DOCX, or TXT — max 10 MB</p>
        </div>
      )}
    </section>
  )
}
