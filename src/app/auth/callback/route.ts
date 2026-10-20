import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createRouteClient } from '@/lib/supabase/route'

/**
 * Supabase Auth OAuth callback handler.
 * GitHub/Google redirect here after successful OAuth.
 * Also handles magic-link email confirmation.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth error response
  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription ?? '')}`,
    )
  }

  if (code) {
    const supabase = await createRouteClient()

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[auth/callback] Code exchange error:', exchangeError)
      return NextResponse.redirect(
        `${origin}/login?error=session_exchange_failed`,
      )
    }

    if (data.user) {
      // Check if this is a new user (no profile row yet)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, is_onboarded')
        .eq('id', data.user.id)
        .maybeSingle()

      if (!existingProfile) {
        // New user — upsert a minimal profile row from OAuth metadata
        const metadata = data.user.user_metadata
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email ?? '',
          name: metadata?.full_name ?? metadata?.name ?? '',
          avatar_url: metadata?.avatar_url ?? metadata?.picture ?? '',
          github_url:
            data.user.app_metadata?.provider === 'github'
              ? `https://github.com/${metadata?.user_name ?? ''}`
              : null,
          is_onboarded: false,
          completeness_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        // Send new user to onboarding
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      if (!existingProfile.is_onboarded) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      // Returning user — honor the ?next param or default to /matches
      const redirectTo = next.startsWith('/') ? next : '/matches'
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // No code or user — redirect to login
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
