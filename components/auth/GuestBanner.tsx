'use client'

import Link from 'next/link'

export default function GuestBanner() {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2 text-xs"
      style={{ background: 'var(--amber-bg)', borderBottom: '1px solid var(--amber-border, #E6C96A)' }}
    >
      <span className="text-base shrink-0">👤</span>
      <p className="text-amber flex-1 leading-snug">
        <span className="font-medium">Guest mode</span> — your progress is saved locally only.
        Sign in to sync across devices.
      </p>
      <Link
        href="/login"
        className="shrink-0 border border-amber text-amber text-xs font-mono font-bold px-3 py-1 rounded-sm hover:bg-amber hover:text-white transition-colors tracking-wide"
      >
        SIGN IN →
      </Link>
    </div>
  )
}
