/**
 * POST /api/stripe/portal
 * Create a Stripe Customer Portal session so users can manage billing.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'no_customer' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer:   profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/settings`,
  })

  return NextResponse.json({ url: session.url })
}
