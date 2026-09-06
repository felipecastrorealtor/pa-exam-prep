import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

// Server-side Supabase client (Server Components, Route Handlers, Server Actions)
// Uses anon key + user's session cookie
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie mutations are ignored
            // (they work in middleware and Route Handlers)
          }
        },
      },
    }
  )
}

// Service-role client — bypasses RLS for admin/webhook operations.
// NEVER use in client-side code or expose to the browser.
//
// This must NOT be built with createServerClient from @supabase/ssr. That
// helper reads the session cookie and sends the signed-in user's access token
// as the Authorization header, which overrides the service-role key: the
// request then reaches PostgREST as `authenticated`, RLS applies, and writes to
// tables with no UPDATE/DELETE policy silently affect zero rows and report
// success. A plain supabase-js client carries the service-role key in both
// headers and no session at all, which is what "bypasses RLS" actually requires.
export async function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  )
}
