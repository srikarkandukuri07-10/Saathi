'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  /** True when Supabase is not configured, so no real account can exist. */
  isDemo: boolean
}

/**
 * Client-side auth state hook.
 * Subscribes to Supabase auth state changes for reactive re-renders.
 * There is no fake identity: without Supabase the user simply stays signed out.
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
  const demo = !isSupabaseConfigured()

  useEffect(() => {
    if (demo) {
      setUser(null)
      setSession(null)
      setLoading(false)
      return
    }

    let supabase: ReturnType<typeof createClient>

    try {
      supabase = createClient()
    } catch {
      // Supabase not configured — stay signed out
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
    setUser(null)
    setSession(null)
    router.push('/')
  }, [router, demo])

  const signInWithGitHub = useCallback(async (next = '/matches') => {
    if (demo) {
      router.push('/login?error=supabase_not_configured')
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
      router.push('/login?error=supabase_not_configured')
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
      return { error: 'Supabase is not configured, so no email can be sent.' }
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
      return { error: 'Supabase is not reachable. Please try again.' }
    }
  }, [demo])

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isDemo: demo,
    signOut,
    signInWithGitHub,
    signInWithGoogle,
    signInWithMagicLink,
  }
}
