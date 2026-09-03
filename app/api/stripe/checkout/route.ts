import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, PROMO_COUPON_ID } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  }

  let promoCode: string | undefined
  try {
    const body = await req.json()
    promoCode = body.promoCode
  } catch {
    // No body — fine
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const session = await createCheckoutSession({
    userId:     user.id,
    email:      user.email!,
    promoCode,
    successUrl: `${siteUrl}/study?checkout=success`,
    cancelUrl:  `${siteUrl}/subscribe?checkout=canceled`,
  })

  return NextResponse.json({ url: session.url })
}
