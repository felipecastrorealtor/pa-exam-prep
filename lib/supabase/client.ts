import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

// Browser-side Supabase client (uses anon key — safe)
// Use in Client Components only ('use client')
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
