/**
 * Vercel cron entry point for the retention sweep.
 *
 * The sweep itself is in lib/retention/sweep.ts, shared with the Netlify
 * scheduled function.
 *
 * Two guards, because this one sends email to real students:
 *
 *  1. CRON_SECRET — Vercel sends `Authorization: Bearer $CRON_SECRET` on every
 *     scheduled invocation when that variable is set on the project. Without
 *     it the route is a public URL that anyone could hit repeatedly.
 *
 *  2. RETENTION_SWEEP_ENABLED — off unless explicitly "true". While Netlify
 *     and Vercel are both live, only one of them may run this: two sweeps on
 *     the same day would be two warning emails to the same student. Netlify
 *     owns it until the domain moves; then this flips to true and the
 *     schedule comes out of netlify.toml.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runRetentionSweep } from '@/lib/retention/sweep'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    if (req.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Refuse rather than run unauthenticated in production.
    console.error('[retention] CRON_SECRET is not set — refusing to run')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }

  if (process.env.RETENTION_SWEEP_ENABLED !== 'true') {
    return NextResponse.json({
      skipped: true,
      reason: 'RETENTION_SWEEP_ENABLED is not "true" on this deployment',
    })
  }

  try {
    const summary = await runRetentionSweep()
    return NextResponse.json(summary)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[retention]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
