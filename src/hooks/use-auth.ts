'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isDemoMode } from '@/lib/supabase/config'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  /** True when the app runs on placeholder credentials (no real account). */
  isDemo: boolean
}

/**
 * Identity used while the app runs on placeholder Supabase credentials.
 * It is explicitly a demo principal: it unlocks the UI, it is not an account.
 */
const DEMO_USER: User = {
  id: '00000000-0000-0000-0000-000000000000',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@hackpact.dev',
  email_confirmed_at: undefined,
  phone: '',
  confirmed_at: undefined,
  last_sign_in_at: undefined,
  role_name: undefined,
  created_at: undefined,
  updated_at: undefined,
  app_metadata: {},
  user_metadata: { full_name: 'Demo Builder', name: 'Demo Builder' },
  identities: [],
  is_anonymous: false,
} as unknown as User

/**
 * Client-side auth state hook.
 * Subscribes to Supabase auth state changes for reactive re-renders.
 * Falls back gracefully when Supabase is not configured (dev mode).
 */
export function useAuth(): AuthState & {
  signOut: () => Promise<void>
  signInWithGitHub: (next?: string) => Promise<void>
  signInWithGoogle: (next?: string) => Promise<void>
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>
} {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const demo = isDemoMode()

  useEffect(() => {
    if (demo) {
      setUser(DEMO_USER)
      setSession(null)
      setLoading(false)
      return
    }

    let supabase: ReturnType<typeof createClient>

    try {
      supabase = createClient()
    } catch {
      // Supabase not configured — dev mode
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [demo])

  const signOut = useCallback(async () => {
    if (!demo) {
      try {
        const supabase = createClient()
        await supabase.auth.signOut()
      } catch {
        // Ignore
      }
    }
    setUser(demo ? DEMO_USER : null)
    setSession(null)
    router.push('/')
  }, [router, demo])

  const signInWithGitHub = useCallback(async (next = '/matches') => {
    if (demo) {
      router.push(next)
      return
    }
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        scopes: 'read:user user:email read:org',
      },
    })
  }, [demo, router])

  const signInWithGoogle = useCallback(async (next = '/matches') => {
    if (demo) {
      router.push(next)
      return
    }
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    })
  }, [demo, router])

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (demo) {
      router.push('/matches')
      return {}
    }
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) return { error: error.message }
      return {}
    } catch {
      return { error: 'Supabase not configured. Using demo mode.' }
    }
  }, [demo, router])

  return {
    user,
    session,
    loading,
    isAuthenticated: demo ? true : !!user,
    isDemo: demo,
    signOut,
    signInWithGitHub,
    signInWithGoogle,
    signInWithMagicLink,
  }
}
