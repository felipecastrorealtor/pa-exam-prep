import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, hasStripeSubscriptionHistory } from '@/lib/stripe'

/**
 * POST /api/stripe/checkout
 * Body: { promoCode?: string, requestTrial?: boolean }
 *
 * The client may ASK for a trial; only this route decides whether it gets one.
 * Every failure path returns JSON so the button can always recover.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    let promoCode: string | undefined
    let requestTrial = true
    try {
      const body = await req.json()
      promoCode   = body?.promoCode || undefined
      requestTrial = body?.requestTrial !== false
    } catch {
      // no body is fine
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, trial_used_at, subscription_status')
      .eq('id', user.id)
      .single()

    const p = profile as {
      stripe_customer_id: string | null
      trial_used_at: string | null
      subscription_status: string | null
    } | null

    // ── Eligibility, decided here and nowhere else ──────────────────────────
    // 1. our own flag, 2. an existing/past subscription, 3. Stripe's history.
    let trialUsed = Boolean(p?.trial_used_at)

    if (!trialUsed && p?.subscription_status &&
        ['trialing', 'active', 'past_due', 'canceled'].includes(p.subscription_status)) {
      trialUsed = true
    }
    if (!trialUsed && p?.stripe_customer_id) {
      trialUsed = await hasStripeSubscriptionHistory(p.stripe_customer_id)
    }

    const withTrial = requestTrial && !trialUsed

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

    const session = await createCheckoutSession({
      userId:     user.id,
      email:      user.email!,
      customerId: p?.stripe_customer_id ?? null,
      promoCode,
      withTrial,
      successUrl: `${siteUrl}/study?checkout=success`,
      cancelUrl:  `${siteUrl}/subscribe?checkout=canceled`,
    })

    if (!session.url) {
      console.error('[stripe/checkout] session created without a url:', session.id)
      return NextResponse.json(
        { error: 'Stripe did not return a checkout link. Please try again.' },
        { status: 502 }
      )
    }

    // Tell the client what it actually got, so the UI can stop promising a
    // trial the account is not entitled to.
    return NextResponse.json({ url: session.url, withTrial, trialUsed })
  } catch (err) {
    const e = err as { message?: string; type?: string }
    console.error('[stripe/checkout] failed:', e?.type, e?.message)

    // Configuration problems are ours, not the user's — say something useful
    // without leaking key material or Stripe internals.
    const raw = e?.message ?? ''
    const msg = /No such price|STRIPE_PRICE_MONTHLY/i.test(raw)
      ? 'Billing is not configured correctly yet. Please contact support.'
      : /STRIPE_COUPON_PROMO|No such coupon/i.test(raw)
      ? 'That promo code is not available right now. Try again without it.'
      : /API key|Invalid API Key|publishable|API version|Managed Payments/i.test(raw)
      ? 'Billing is not configured correctly yet. Please contact support.'
      : 'Could not start checkout. Please try again.'

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * GET /api/stripe/checkout — trial eligibility, so the page can render the
 * right copy before the user clicks anything.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, trial_used_at, subscription_status')
      .eq('id', user.id)
      .single()

    const p = profile as {
      stripe_customer_id: string | null
      trial_used_at: string | null
      subscription_status: string | null
    } | null

    let trialUsed = Boolean(p?.trial_used_at)
    if (!trialUsed && p?.subscription_status &&
        ['trialing', 'active', 'past_due', 'canceled'].includes(p.subscription_status)) {
      trialUsed = true
    }
    if (!trialUsed && p?.stripe_customer_id) {
      trialUsed = await hasStripeSubscriptionHistory(p.stripe_customer_id)
    }

    return NextResponse.json({ trialUsed })
  } catch (err) {
    console.error('[stripe/checkout] eligibility check failed:', err)
    // Unknown eligibility — the page shows both options.
    return NextResponse.json({ trialUsed: null })
  }
}
