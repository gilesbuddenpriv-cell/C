'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) throw error
        setNotice('Check your email to confirm your account, then sign in.')
        setMode('signin')
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        })
        if (error) throw error
        setNotice('Password reset email sent. Check your inbox.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-forest flex items-center justify-center mb-4">
            <span className="text-2xl">💡</span>
          </div>
          <h1 className="text-2xl font-bold text-ink font-serif text-center">
            Welcome to BASRaT Revision Assistant
          </h1>
          <p className="text-muted text-sm mt-1">
            {mode === 'signup'
              ? 'Create your account'
              : mode === 'forgot'
              ? 'Reset your password'
              : 'Sign in to continue'}
          </p>
        </div>

        <div className="card p-6">
          {/* Google */}
          {mode !== 'forgot' && (
            <>
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-border rounded py-3 text-sm font-medium text-ink hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path
                    d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                    fill="#4285F4"
                  />
                  <path
                    d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
                    fill="#34A853"
                  />
                  <path
                    d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-border" />
                <span className="px-3 text-xs text-muted uppercase tracking-wider">or</span>
                <div className="flex-1 border-t border-border" />
              </div>
            </>
          )}

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="label block mb-1">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                  ✉
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-border rounded py-3 pl-9 pr-3 text-sm focus:outline-none focus:border-forest transition-colors bg-white"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="label block mb-1">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                    🔒
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border border-border rounded py-3 pl-9 pr-3 text-sm focus:outline-none focus:border-forest transition-colors bg-white"
                  />
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-xs text-forest bg-forest-pale border border-forest/20 rounded p-2">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink text-white rounded py-3 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Please wait…'
                : mode === 'signup'
                ? 'Create account'
                : mode === 'forgot'
                ? 'Send reset email'
                : 'Sign in'}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-4 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => { setMode('forgot'); setError(''); setNotice('') }}
                  className="text-xs text-muted hover:text-ink transition-colors block w-full"
                >
                  Forgot password?
                </button>
                <p className="text-xs text-muted">
                  Need an account?{' '}
                  <button
                    onClick={() => { setMode('signup'); setError(''); setNotice('') }}
                    className="text-ink font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-xs text-muted">
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('signin'); setError(''); setNotice('') }}
                  className="text-ink font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
            {mode === 'forgot' && (
              <button
                onClick={() => { setMode('signin'); setError(''); setNotice('') }}
                className="text-xs text-muted hover:text-ink transition-colors"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        {/* Guest mode */}
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-xs text-muted hover:text-ink transition-colors"
          >
            Continue as guest — progress saved locally only
          </a>
        </div>
      </div>
    </div>
  )
}
