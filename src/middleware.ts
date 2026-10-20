import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isSupabaseConfigured } from '@/lib/supabase/config'

type CookieItem = { name: string; value: string; options?: Record<string, unknown> }

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/waitlist',
  '/hall-of-fame',
  '/dpdp',
  '/privacy',
  '/terms',
  '/design',
  '/api/health',
]

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/onboarding',
  '/profile',
  '/hackathons',
  '/matches',
  '/teams',
  '/chat',
  '/spin',
  '/admin',
  '/api/user',
]

// Lightweight rate-limiting via request counting in headers
// (Use Upstash Redis in production for distributed rate limiting)
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const rateLimitStore = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string, limit: number): boolean {
  const now = Date.now()
  const existing = rateLimitStore.get(ip)

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, windowStart: now })
    return false
  }

  existing.count++
  if (existing.count > limit) return true
  return false
}

function isPublicRoute(pathname: string): boolean {
  // Exact match or starts with prefix
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return true
  }
  // Public shareable profile: /p/[id]
  if (pathname.startsWith('/p/')) return true
  // Static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) return true
  return false
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'

  // ── Rate limiting for API routes ──────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const limit = pathname.startsWith('/api/user/delete-account') ? 3 : 60
    if (isRateLimited(ip, limit)) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
          'X-RateLimit-Limit': String(limit),
        },
      })
    }
  }

  // ── Skip auth check for public routes ────────────────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // ── Supabase not configured ───────────────────────────────────────────────
  // Without real credentials no session can exist. Protected routes stay
  // closed and the sign-in screen explains the missing configuration.
  if (!isSupabaseConfigured()) {
    if (isProtectedRoute(pathname)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'supabase_not_configured')
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ── Session check via Supabase SSR ────────────────────────────────────────
  let response = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: CookieItem[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            )
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]),
            )
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If authenticated user tries to access /login, redirect to /profile
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/profile', request.url))
    }

    // If unauthenticated user tries to access protected route, redirect to /login
    if (!user && isProtectedRoute(pathname)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Add user ID header for downstream Server Components
    if (user) {
      response.headers.set('x-user-id', user.id)
    }
  } catch {
    // Supabase not configured (dev mode) — allow all routes
    if (isProtectedRoute(pathname)) {
      // In dev/demo mode without Supabase, still allow access
      return NextResponse.next()
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
