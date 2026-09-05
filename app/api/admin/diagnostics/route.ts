/**
 * GET /api/admin/diagnostics — admin only.
 *
 * Reports whether each environment variable is present and whether its value
 * LOOKS like the right kind of credential. It never returns a value, a prefix
 * long enough to be useful, or anything that could be replayed.
 *
 * This exists because a wrong key in the hosting panel is invisible from the
 * code side, and guessing at it costs hours.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Check = { present: boolean; looksRight: boolean | null; note: string }

function check(value: string | undefined, expect?: RegExp, hint?: string): Check {
  if (!value) return { present: false, looksRight: false, note: 'missing' }
  if (!expect) return { present: true, looksRight: null, note: 'set' }
  const ok = expect.test(value)
  return {
    present: true,
    looksRight: ok,
    note: ok ? 'set, format looks right' : `set, but WRONG FORMAT — ${hint}`,
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if ((profile as { role?: string } | null)?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const env = process.env

  return NextResponse.json({
    stripe: {
      STRIPE_SECRET_KEY: check(env.STRIPE_SECRET_KEY, /^sk_(live|test)_/,
        'must start with sk_ — a pk_ key is the publishable one and cannot create sessions'),
      STRIPE_WEBHOOK_SECRET: check(env.STRIPE_WEBHOOK_SECRET, /^whsec_/, 'must start with whsec_'),
      STRIPE_PRICE_MONTHLY: check(env.STRIPE_PRICE_MONTHLY, /^price_/, 'must start with price_'),
      STRIPE_COUPON_PROMO: check(env.STRIPE_COUPON_PROMO),
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: check(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, /^pk_/, 'must start with pk_'),
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: check(env.NEXT_PUBLIC_SUPABASE_URL, /^https:\/\/.+\.supabase\.co/, 'must be the project URL'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: check(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: check(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    ai: {
      GEMINI_API_KEY: check(env.GEMINI_API_KEY),
      GEMINI_MODEL: check(env.GEMINI_MODEL),
    },
    email: {
      RESEND_API_KEY: check(env.RESEND_API_KEY, /^re_/, 'must start with re_'),
      EMAIL_FROM: check(env.EMAIL_FROM),
    },
    app: {
      NEXT_PUBLIC_SITE_URL: check(env.NEXT_PUBLIC_SITE_URL, /^https:\/\/repaexam\.com\/?$/,
        'should be https://repaexam.com — success and cancel URLs are built from it'),
    },
  })
}
