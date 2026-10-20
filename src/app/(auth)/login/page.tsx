'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Github, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { APP_CONFIG } from '@/config/site'
import { useAuth } from '@/hooks/use-auth'
import React from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/matches'
  const oauthError = searchParams.get('error')
  const oauthErrorDesc = searchParams.get('error_description')

  const { isAuthenticated, loading, isDemo, signInWithGitHub, signInWithGoogle, signInWithMagicLink } =
    useAuth()

  const [email, setEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [magicError, setMagicError] = useState('')
  const [magicLoading, setMagicLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      window.location.href = next
    }
  }, [isAuthenticated, loading, next])
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setMagicLoading(true)
    setMagicError('')

    const result = await signInWithMagicLink(email.trim())
    setMagicLoading(false)

    if (result.error) {
      setMagicError(result.error)
    } else {
      setMagicSent(true)
    }
  }

  async function handleGitHub() {
    setOauthLoading('github')
    await signInWithGitHub(next)
  }

  async function handleGoogle() {
    setOauthLoading('google')
    await signInWithGoogle(next)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8F2C9]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 border-2 border-[#B8F2C9] mb-4">
            <span className="text-[#B8F2C9] font-black text-xl">H</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {APP_CONFIG.name}
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Find serious teammates for real hackathons
          </p>
        </div>

        <Card variant="black" className="border border-white/10">
          <CardHeader className="pb-4">
            <p className="text-white/80 text-sm text-center">
              Sign in or create your account — it takes 30 seconds.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth error */}
            {oauthError && (
              <div className="flex items-start gap-2 p-3 border border-white/20 bg-white/5">
                <AlertCircle className="h-4 w-4 text-white/60 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Sign-in failed</p>
                  <p className="text-white/60 text-xs mt-0.5">
                    {oauthErrorDesc ?? oauthError}
                  </p>
                </div>
              </div>
            )}

            {/* Missing configuration notice */}
            {isDemo && (
              <div className="flex items-start gap-2 p-3 border border-[#B8F2C9]/40 bg-[#B8F2C9]/10">
                <AlertCircle className="h-4 w-4 text-[#B8F2C9] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">
                    Supabase is not configured
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">
                    Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and
                    SUPABASE_SERVICE_ROLE_KEY in .env.local, then apply
                    supabase/apply-all.sql. No account is created and no sample data
                    is shown while the database is unreachable.
                  </p>
                </div>
              </div>
            )}

            {/* GitHub OAuth */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleGitHub}
              disabled={!!oauthLoading || magicLoading}
            >
              {oauthLoading === 'github' ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Github className="h-5 w-5 mr-2" />
              )}
              Continue with GitHub
            </Button>

            {/* Google OAuth */}
            <Button
              variant="outline"
              size="lg"
              className="w-full border-white/20 text-white hover:bg-white/10"
              onClick={handleGoogle}
              disabled={!!oauthLoading || magicLoading}
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/40 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Magic link */}
            {!magicSent ? (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <Input
                  type="email"
                  label="Email address"
                  placeholder="you@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={magicError}
                  disabled={magicLoading}
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="lg"
                  className="w-full border border-white/20 text-white hover:bg-white/10"
                  disabled={!email.trim() || magicLoading}
                >
                  {magicLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send magic link
                  {!magicLoading && <ArrowRight className="h-4 w-4 ml-auto" />}
                </Button>
              </form>
            ) : (
              <div className="p-4 border border-[#B8F2C9]/30 bg-[#B8F2C9]/5 text-center">
                <Mail className="h-6 w-6 text-[#B8F2C9] mx-auto mb-2" />
                <p className="text-white font-medium text-sm">Check your inbox</p>
                <p className="text-white/60 text-xs mt-1">
                  We sent a link to <strong className="text-white">{email}</strong>
                </p>
                <button
                  className="text-[#B8F2C9] text-xs mt-3 underline"
                  onClick={() => { setMagicSent(false); setEmail('') }}
                >
                  Try a different email
                </button>
              </div>
            )}

            {/* Fine print */}
            <p className="text-white/30 text-xs text-center">
              By signing in you agree to our{' '}
              <a href="/terms" className="underline hover:text-white/60">Terms</a>
              {' '}and{' '}
              <a href="/privacy" className="underline hover:text-white/60">Privacy Policy</a>.
              <br />
              We are DPDP Act compliant.{' '}
              <a href="/dpdp" className="underline hover:text-white/60">Learn more</a>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-white/30 text-xs mt-6">
          GitHub is <strong className="text-white/60">strongly recommended</strong> — it lets us verify your skills automatically.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#B8F2C9]" />
      </div>
    }>
      <LoginForm />
    </React.Suspense>
  )
}
