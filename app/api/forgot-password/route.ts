import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { email, redirectTo } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Generate recovery link server-side — no SMTP involved at this step
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectTo ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://repaexam.com'}/reset-password`,
      },
    })

    // Never reveal whether an account exists for this address (user enumeration).
    // Log the real reason server-side; tell the client the same thing either way.
    if (error) {
      console.error('[forgot-password] generateLink error:', error)
      return NextResponse.json({ ok: true })
    }

    const link = data.properties?.action_link
    if (!link) {
      console.error('[forgot-password] no action_link returned')
      return NextResponse.json({ ok: true })
    }

    const html = `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
            <h2 style="font-size:1.2rem;font-weight:700;color:#0f172a;margin:0 0 8px">Reset your password</h2>
            <p style="color:#64748b;margin:0 0 28px;line-height:1.6">
              We received a request to reset the password for your PA Exam Prep account.
              Click the button below — the link expires in <strong>1 hour</strong>.
            </p>
            <a href="${link}"
               style="display:inline-block;background:#4f8ef7;color:#fff;padding:13px 28px;
                      border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem">
              Reset password →
            </a>
            <p style="color:#94a3b8;font-size:0.78rem;margin-top:28px;line-height:1.5">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `

    // Send via Resend. If the custom domain isn't verified yet, fall back to
    // Resend's shared sender so the flow still works while DNS propagates.
    const PRIMARY  = process.env.EMAIL_FROM ?? 'PA Exam Prep <noreply@repaexam.com>'
    const FALLBACK = 'PA Exam Prep <onboarding@resend.dev>'

    const send = async (from: string) => {
      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: 'Reset your password — PA Exam Prep',
          html,
        }),
      })
    }

    let res = await send(PRIMARY)

    if (!res.ok) {
      const err = await res.json().catch(() => ({} as any))
      const notVerified = typeof err?.message === 'string' &&
        /not verified|domain is not/i.test(err.message)

      if (notVerified && PRIMARY !== FALLBACK) {
        console.warn('[forgot-password] domain not verified, using fallback sender')
        res = await send(FALLBACK)
        if (!res.ok) {
          const err2 = await res.json().catch(() => ({} as any))
          console.error('[forgot-password] fallback also failed:', err2)
          return NextResponse.json({ error: err2?.message ?? 'Failed to send email' }, { status: 500 })
        }
      } else {
        console.error('[forgot-password] Resend error:', err)
        return NextResponse.json({ error: err?.message ?? 'Failed to send email' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[forgot-password] unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
