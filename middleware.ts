import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/study',
  '/flashcards',
  '/glossary',
  '/achievements',
  '/settings',
]

// Routes that require an active subscription (or free trial / access code)
const SUBSCRIPTION_PREFIXES = [
  '/study',
  '/flashcards',
  '/achievements',
]

// Admin-only routes — server-side check, never just CSS/URL hiding
const ADMIN_PREFIX = '/admin'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Create Supabase client that can read/set cookies
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // ── Auth check ────────────────────────────────────────────────────────────
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isSubscriptionGated = SUBSCRIPTION_PREFIXES.some((p) =>
    pathname.startsWith(p)
  )
  const isAdmin = pathname.startsWith(ADMIN_PREFIX)

  if ((isProtected || isAdmin) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Subscription gate ─────────────────────────────────────────────────────
  if (user && isSubscriptionGated) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_expires_at, role')
      .eq('id', user.id)
      .single()

    const isActive =
      profile?.subscription_status === 'active' ||
      profile?.subscription_status === 'trialing' ||
      (profile?.subscription_status === 'free_access' &&
        profile.subscription_expires_at &&
        new Date(profile.subscription_expires_at) > new Date())

    if (!isActive) {
      const subscribeUrl = request.nextUrl.clone()
      subscribeUrl.pathname = '/subscribe'
      return NextResponse.redirect(subscribeUrl)
    }
  }

  // ── Admin gate ─────────────────────────────────────────────────────────────
  if (user && isAdmin) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      // 404 instead of 403 — don't reveal admin route exists
      return NextResponse.rewrite(new URL('/not-found', request.url))
    }
  }

  // ── Auth page redirect (already logged in) ────────────────────────────────
  const isAuthPage = ['/login', '/register'].some((p) => pathname === p)
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/study', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, public assets
     * - API routes handled by Next.js (not the Netlify function proxy)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
