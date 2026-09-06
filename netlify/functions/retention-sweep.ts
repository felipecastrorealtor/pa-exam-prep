/**
 * Netlify Function: retention-sweep  (scheduled daily — see netlify.toml)
 *
 * A student who stops paying keeps everything they have done for a full year.
 * Sixty days before that year is up, and again at thirty, they get an email
 * saying exactly when their progress will be cleared and how to keep it. On
 * day 365 the study data goes; the account and the login never do.
 *
 * The clock lives in profiles.lapsed_at, stamped here rather than in the
 * Stripe webhook, so it also covers access codes that quietly expired and
 * accounts that lapsed before any of this existed. Regaining access clears it.
 *
 * Endpoint (for a manual run): /.netlify/functions/retention-sweep
 */

import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const DAY = 86_400_000

const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? 365)
const WARN_FIRST_DAYS  = RETENTION_DAYS - 60
const WARN_SECOND_DAYS = RETENTION_DAYS - 30

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://repaexam.com'
const FROM = process.env.EMAIL_FROM ?? 'Real Estate PA Exam <noreply@repaexam.com>'

const ACTIVE = new Set(['active', 'trialing', 'past_due'])

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

interface ProfileRow {
  id: string
  email: string
  display_name: string | null
  preferred_lang: string | null
  subscription_status: string | null
  subscription_expires_at: string | null
  updated_at: string
  lapsed_at: string | null
  purge_warned_60_at: string | null
  purge_warned_30_at: string | null
  progress_purged_at: string | null
}

function hasAccess(p: ProfileRow, now: number): boolean {
  if (ACTIVE.has(p.subscription_status ?? '')) return true
  if (p.subscription_status === 'free_access') {
    return !p.subscription_expires_at || new Date(p.subscription_expires_at).getTime() > now
  }
  return false
}

function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / DAY)
}

/* ── Emails ──────────────────────────────────────────────────────────────── */

function warningEmail(name: string, daysLeft: number, isEs: boolean) {
  const when = new Date(Date.now() + daysLeft * DAY).toLocaleDateString(isEs ? 'es-US' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const subject = isEs
    ? `Tu progreso se borrará en ${daysLeft} días`
    : `Your progress will be deleted in ${daysLeft} days`

  const body = isEs
    ? `<p>Hola ${name},</p>
       <p>Tu suscripción a <strong>Real Estate PA Exam</strong> terminó hace un tiempo y
          hemos guardado todo tu progreso desde entonces: respuestas, rachas, logros y
          simulacros.</p>
       <p>Por inactividad, ese progreso se borrará el <strong>${when}</strong>, dentro de
          ${daysLeft} días. Tu cuenta y tu acceso para iniciar sesión no se tocan — solo
          el progreso de estudio.</p>
       <p>Si quieres conservarlo, basta con reactivar tu suscripción antes de esa fecha:</p>
       <p><a href="${SITE}/subscribe" style="display:inline-block;background:#4f8ef7;color:#fff;
          padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Reactivar mi suscripción</a></p>
       <p style="color:#888;font-size:13px">Si ya no quieres continuar, no tienes que hacer nada.</p>`
    : `<p>Hi ${name},</p>
       <p>Your <strong>Real Estate PA Exam</strong> subscription ended a while back, and we
          have kept everything you did since then — your answers, streaks, achievements and
          mock exams.</p>
       <p>After this long without activity, that progress will be cleared on
          <strong>${when}</strong>, ${daysLeft} days from now. Your account and your ability
          to sign in are not affected — only the study progress.</p>
       <p>To keep it, just restart your subscription before that date:</p>
       <p><a href="${SITE}/subscribe" style="display:inline-block;background:#4f8ef7;color:#fff;
          padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">
          Restart my subscription</a></p>
       <p style="color:#888;font-size:13px">If you would rather not continue, there is nothing to do.</p>`

  return { subject, body }
}

function purgedEmail(name: string, isEs: boolean) {
  return {
    subject: isEs ? 'Tu progreso de estudio fue borrado' : 'Your study progress has been cleared',
    body: isEs
      ? `<p>Hola ${name},</p>
         <p>Como avisamos, tu progreso de estudio en <strong>Real Estate PA Exam</strong> fue
            borrado por inactividad. Tu cuenta sigue existiendo y puedes iniciar sesión
            normalmente — simplemente empezarás de nuevo.</p>
         <p><a href="${SITE}/subscribe">Volver a empezar</a></p>`
      : `<p>Hi ${name},</p>
         <p>As we warned, your study progress on <strong>Real Estate PA Exam</strong> has been
            cleared after a long period of inactivity. Your account still exists and you can
            sign in as usual — you will simply be starting fresh.</p>
         <p><a href="${SITE}/subscribe">Start again</a></p>`,
  }
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[retention] RESEND_API_KEY not set — not sending to', to)
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject,
        html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#1a1d27;max-width:520px">${html}</div>`,
      }),
    })
    if (!res.ok) {
      console.error('[retention] Resend rejected the message:', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[retention] send failed:', err)
    return false
  }
}

/* ── The sweep ───────────────────────────────────────────────────────────── */

async function purgeProgress(userId: string): Promise<void> {
  // Order matters only for readability — these tables don't reference each
  // other. The account row itself is never touched.
  for (const table of ['question_attempts', 'study_sessions', 'flashcard_progress', 'user_achievements'] as const) {
    const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId)
    if (error) throw new Error(`${table}: ${error.message}`)
  }

  const { error } = await supabaseAdmin
    .from('user_progress')
    .update({
      xp: 0, level: 1, daily_streak: 0, longest_streak: 0,
      today_questions: 0, total_questions: 0, total_correct: 0, total_sessions: 0,
      last_study_date: null,
    })
    .eq('user_id', userId)
  if (error) throw new Error(`user_progress: ${error.message}`)
}

export const handler: Handler = async () => {
  const now = Date.now()
  const summary = { scanned: 0, stamped: 0, cleared: 0, warned60: 0, warned30: 0, purged: 0, errors: [] as string[] }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, preferred_lang, subscription_status, subscription_expires_at, updated_at, lapsed_at, purge_warned_60_at, purge_warned_30_at, progress_purged_at')

  if (error) {
    console.error('[retention] could not read profiles:', error.message)
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) }
  }

  for (const p of (data ?? []) as ProfileRow[]) {
    summary.scanned += 1
    try {
      /* 1. Access is back — stop the clock and forget the warnings. */
      if (hasAccess(p, now)) {
        if (p.lapsed_at || p.purge_warned_60_at || p.purge_warned_30_at) {
          await supabaseAdmin.from('profiles').update({
            lapsed_at: null, purge_warned_60_at: null, purge_warned_30_at: null,
          }).eq('id', p.id)
          summary.cleared += 1
        }
        continue
      }

      /* 2. No access and no clock yet — start it from when access actually
            ended, so an account that lapsed long ago isn't given a fresh year. */
      let lapsedAt = p.lapsed_at
      if (!lapsedAt) {
        lapsedAt = p.subscription_expires_at ?? p.updated_at ?? new Date(now).toISOString()
        await supabaseAdmin.from('profiles').update({ lapsed_at: lapsedAt }).eq('id', p.id)
        summary.stamped += 1
      }

      const elapsed = daysSince(lapsedAt, now)
      const isEs = p.preferred_lang === 'es'
      const name = p.display_name?.trim() || p.email.split('@')[0]

      /* 3. Day 365 — clear the study data, once. */
      if (elapsed >= RETENTION_DAYS) {
        if (p.progress_purged_at) continue
        await purgeProgress(p.id)
        await supabaseAdmin.from('profiles')
          .update({ progress_purged_at: new Date(now).toISOString() })
          .eq('id', p.id)
        const mail = purgedEmail(name, isEs)
        await sendEmail(p.email, mail.subject, mail.body)
        summary.purged += 1
        continue
      }

      /* 4. Thirty days out. */
      if (elapsed >= WARN_SECOND_DAYS && !p.purge_warned_30_at) {
        const mail = warningEmail(name, RETENTION_DAYS - elapsed, isEs)
        if (await sendEmail(p.email, mail.subject, mail.body)) {
          await supabaseAdmin.from('profiles')
            .update({ purge_warned_30_at: new Date(now).toISOString() })
            .eq('id', p.id)
          summary.warned30 += 1
        }
        continue
      }

      /* 5. Sixty days out. */
      if (elapsed >= WARN_FIRST_DAYS && !p.purge_warned_60_at) {
        const mail = warningEmail(name, RETENTION_DAYS - elapsed, isEs)
        if (await sendEmail(p.email, mail.subject, mail.body)) {
          await supabaseAdmin.from('profiles')
            .update({ purge_warned_60_at: new Date(now).toISOString() })
            .eq('id', p.id)
          summary.warned60 += 1
        }
      }
    } catch (err) {
      // One bad row must not stop the sweep.
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[retention] ${p.id}:`, msg)
      summary.errors.push(`${p.id}: ${msg}`)
    }
  }

  console.log('[retention] sweep complete', summary)
  return { statusCode: 200, body: JSON.stringify(summary) }
}
