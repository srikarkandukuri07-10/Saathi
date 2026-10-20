import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

/**
 * Typed cookie item from Supabase SSR setAll callback.
 * Avoids implicit-any TS errors across route handlers.
 */
export type CookieItem = {
  name: string
  value: string
  options?: Record<string, any>
}

/**
 * Creates a Supabase server-side client suitable for Route Handlers and Server Components.
 * Reads/writes cookies via Next.js `cookies()` header store.
 */
export async function createRouteClient() {
  const cookieStore = await cookies()
  return createServerClientFromCookieStore(cookieStore)
}

export function createServerClientFromCookieStore(
  cookieStore: ReadonlyRequestCookies,
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieItem[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}
