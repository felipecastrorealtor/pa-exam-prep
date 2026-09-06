import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Everything the admin dashboard shows, loaded in one place.
 *
 * Two rules run through this file:
 *  - Every section is loaded independently and wrapped, so a failure in one
 *    (Stripe being unreachable, say) leaves the rest of the page intact.
 *  - A metric with no data reports `null`, never 0. "0% pass rate" and "no
 *    exams taken yet" mean very different things and must not look alike.
 */

type DB = SupabaseClient<any, any, any>

/** Score at or above which a mock exam counts as a pass. PSI's cut is 75%. */
export const PASS_SCORE = Number(process.env.ADMIN_PASS_SCORE ?? 75)

/** Minimum answers before a unit or question is called hard rather than noisy. */
const MIN_UNIT_ANSWERS     = 30
const MIN_QUESTION_ANSWERS = 10

export type Period = 7 | 30 | 90

export interface Delta {
  current:  number
  previous: number
  /** null when the previous window had nothing to compare against. */
  pct: number | null
}

export interface DashboardData {
  period: Period
  generatedAt: string

  users: {
    total:        number
    paid:         number   // active + past_due (a card exists)
    trialing:     number
    freeAccess:   number   // access codes and comps, still valid
    canceled:     number
    newInPeriod:  Delta
  } | null

  activity: {
    activeToday: number
    active7d:    number
    activeInPeriod: Delta
    sessions:    Delta
    answers:     Delta
    examsDone:   Delta
  } | null

  conversion: {
    trialsStarted:  number
    converted:      number
    /** null when nobody has started a trial yet. */
    rate:           number | null
  } | null

  exams: {
    completed: number
    passed:    number
    /** null when no exam has been completed in the period. */
    passRate:  number | null
    avgScore:  number | null
  } | null

  learning: {
    answers:        number
    avgAccuracy:    number | null
    avgReadiness:   number | null
    avgStudyMin:    number | null
    avgStreak:      number | null
    hardestUnits:   { unitId: number; title: string; answers: number; correctPct: number }[]
    mostMissed:     { id: string; unitId: number; legacyId: number; text: string; answers: number; wrongPct: number; reports: number }[]
    overallCorrectPct: number | null
  } | null

  growth: {
    days: string[]
    newUsers:      number[]
    trialsStarted: number[]
    subscriptions: number[]
    cancellations: number[]
  } | null

  engagement: {
    days: string[]
    activeUsers: number[]
    sessions:    number[]
    answers:     number[]
    exams:       number[]
  } | null

  attention: {
    openReports:      number
    trialsEndingSoon: number | null   // null = Stripe not reachable
    pastDue:          number
    canceledRecently: number
    idle7d:           number
    codesExpiringSoon: number
    codesNeverUsed:   number
    abandonedExams:   number
  } | null

  billing: {
    mrrCents:   number | null
    currency:   string
    activeSubs: number | null
    /** Why the number is missing, for an honest empty state. */
    note:       string | null
  } | null

  recentUsers: RecentUser[] | null

  /** Sections that failed to load, so the page can say so instead of showing zeros. */
  failed: string[]
}

export interface RecentUser {
  id:           string
  email:        string
  name:         string | null
  plan:         'Paid' | 'Trial' | 'Free' | 'Expired' | 'Cancelled'
  status:       string
  lastActivity: string | null
  answered:     number
  accuracy:     number | null
  streak:       number
  joined:       string
}

const DAY = 86_400_000

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function dayRange(from: Date, to: Date): string[] {
  const out: string[] = []
  for (let t = from.getTime(); t <= to.getTime(); t += DAY) out.push(isoDay(new Date(t)))
  return out
}

function delta(current: number, previous: number): Delta {
  return {
    current,
    previous,
    pct: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
  }
}

/** Never let one broken section take the page down. */
async function guard<T>(name: string, failed: string[], fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[admin/dashboard] ${name} failed:`, err)
    failed.push(name)
    return null
  }
}

export async function loadDashboard(supabase: DB, period: Period): Promise<DashboardData> {
  const failed: string[] = []
  const now       = new Date()
  const start     = new Date(now.getTime() - period * DAY)
  const prevStart = new Date(now.getTime() - period * 2 * DAY)
  const today     = isoDay(now)

  const [users, activity, conversion, exams, learning, series, attention, billing, recentUsers] =
    await Promise.all([
      guard('users',       failed, () => loadUsers(supabase, start, prevStart)),
      guard('activity',    failed, () => loadActivity(supabase, now, start, prevStart)),
      guard('conversion',  failed, () => loadConversion(supabase)),
      guard('exams',       failed, () => loadExams(supabase, start)),
      guard('learning',    failed, () => loadLearning(supabase, start)),
      guard('series',      failed, () => loadSeries(supabase, start, now)),
      guard('attention',   failed, () => loadAttention(supabase, now)),
      guard('billing',     failed, () => loadBilling()),
      guard('recentUsers', failed, () => loadRecentUsers(supabase)),
    ])

  return {
    period,
    generatedAt: now.toISOString(),
    users,
    activity,
    conversion,
    exams,
    learning,
    growth:     series?.growth ?? null,
    engagement: series?.engagement ?? null,
    attention,
    billing,
    recentUsers,
    failed,
  }
}

/* ── Users ──────────────────────────────────────────────────────────────── */

async function loadUsers(supabase: DB, start: Date, prevStart: Date) {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_expires_at, created_at')
  if (error) throw error

  const rows = (data ?? []) as { subscription_status: string | null; subscription_expires_at: string | null; created_at: string }[]
  const now = Date.now()

  const stillValid = (r: { subscription_expires_at: string | null }) =>
    !r.subscription_expires_at || new Date(r.subscription_expires_at).getTime() > now

  return {
    total:      rows.length,
    paid:       rows.filter((r) => r.subscription_status === 'active' || r.subscription_status === 'past_due').length,
    trialing:   rows.filter((r) => r.subscription_status === 'trialing').length,
    freeAccess: rows.filter((r) => r.subscription_status === 'free_access' && stillValid(r)).length,
    canceled:   rows.filter((r) => r.subscription_status === 'canceled').length,
    newInPeriod: delta(
      rows.filter((r) => new Date(r.created_at) >= start).length,
      rows.filter((r) => new Date(r.created_at) >= prevStart && new Date(r.created_at) < start).length,
    ),
  }
}

/* ── Activity ───────────────────────────────────────────────────────────── */

/**
 * "Active" means a study session was started — a real act, not a page view.
 */
async function loadActivity(supabase: DB, now: Date, start: Date, prevStart: Date) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('user_id, session_type, questions_answered, started_at, completed_at')
    .gte('started_at', prevStart.toISOString())
  if (error) throw error

  const rows = (data ?? []) as {
    user_id: string; session_type: string; questions_answered: number | null
    started_at: string; completed_at: string | null
  }[]

  const today   = isoDay(now)
  const sevenAgo = new Date(now.getTime() - 7 * DAY)

  const inCurrent  = rows.filter((r) => new Date(r.started_at) >= start)
  const inPrevious = rows.filter((r) => {
    const t = new Date(r.started_at)
    return t >= prevStart && t < start
  })

  const uniq = (rs: typeof rows) => new Set(rs.map((r) => r.user_id)).size
  const sum  = (rs: typeof rows) => rs.reduce((n, r) => n + (r.questions_answered ?? 0), 0)
  const done = (rs: typeof rows) => rs.filter((r) => r.session_type === 'exam' && r.completed_at).length

  return {
    activeToday: uniq(rows.filter((r) => isoDay(new Date(r.started_at)) === today)),
    active7d:    uniq(rows.filter((r) => new Date(r.started_at) >= sevenAgo)),
    activeInPeriod: delta(uniq(inCurrent), uniq(inPrevious)),
    sessions:       delta(inCurrent.length, inPrevious.length),
    answers:        delta(sum(inCurrent), sum(inPrevious)),
    examsDone:      delta(done(inCurrent), done(inPrevious)),
  }
}

/* ── Trial → paid ───────────────────────────────────────────────────────── */

async function loadConversion(supabase: DB) {
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_status, trial_used_at')
    .not('trial_used_at', 'is', null)
  if (error) throw error

  const rows = (data ?? []) as { subscription_status: string | null }[]
  const converted = rows.filter((r) => r.subscription_status === 'active' || r.subscription_status === 'past_due').length

  return {
    trialsStarted: rows.length,
    converted,
    rate: rows.length > 0 ? Math.round((converted / rows.length) * 100) : null,
  }
}

/* ── Mock exams ─────────────────────────────────────────────────────────── */

async function loadExams(supabase: DB, start: Date) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('score_pct, completed_at')
    .eq('session_type', 'exam')
    .not('completed_at', 'is', null)
    .gte('completed_at', start.toISOString())
  if (error) throw error

  const scores = ((data ?? []) as { score_pct: number | null }[])
    .map((r) => (r.score_pct == null ? null : Number(r.score_pct)))
    .filter((n): n is number => n != null)

  if (scores.length === 0) {
    return { completed: (data ?? []).length, passed: 0, passRate: null, avgScore: null }
  }

  const passed = scores.filter((s) => s >= PASS_SCORE).length
  return {
    completed: scores.length,
    passed,
    passRate:  Math.round((passed / scores.length) * 100),
    avgScore:  Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }
}

/* ── Learning analytics ─────────────────────────────────────────────────── */

async function loadLearning(supabase: DB, start: Date) {
  const [progressRes, sessionRes, attemptRes, unitRes, reportRes, questionCountRes] = await Promise.all([
    supabase.from('user_progress').select('total_questions, total_correct, daily_streak'),
    supabase.from('study_sessions').select('duration_sec, questions_answered, started_at').gte('started_at', start.toISOString()),
    supabase.from('question_attempts').select('question_id, attempts, correct, questions!inner(unit_id, legacy_id, question_en)'),
    supabase.from('units').select('id, title_en'),
    supabase.from('error_reports').select('question_id').not('question_id', 'is', null),
    supabase.from('questions').select('id', { count: 'exact', head: true }).eq('enabled', true),
  ])

  if (attemptRes.error) throw attemptRes.error

  const progress = (progressRes.data ?? []) as { total_questions: number | null; total_correct: number | null; daily_streak: number | null }[]
  const studied  = progress.filter((p) => (p.total_questions ?? 0) > 0)

  const totalQuestions = questionCountRes.count ?? 0

  const avgAccuracy = studied.length
    ? Math.round(
        studied.reduce((a, p) => a + ((p.total_correct ?? 0) / (p.total_questions || 1)) * 100, 0) / studied.length,
      )
    : null

  // Readiness reuses the same formula the student sees on Inicio, averaged.
  const avgReadiness = studied.length && totalQuestions
    ? Math.round(
        studied.reduce((a, p) => {
          const total = p.total_questions ?? 0
          const acc = Math.min(((p.total_correct ?? 0) / (total || 1)) * 1.25, 1)
          const cov = Math.min(total / totalQuestions, 1)
          const stk = Math.min((p.daily_streak ?? 0) / 7, 1)
          return a + (acc * 0.45 + cov * 0.4 + stk * 0.15) * 100
        }, 0) / studied.length,
      )
    : null

  const sessions = (sessionRes.data ?? []) as { duration_sec: number | null; questions_answered: number | null }[]
  const timed    = sessions.filter((s) => (s.duration_sec ?? 0) > 0)
  const avgStudyMin = timed.length
    ? Math.round(timed.reduce((a, s) => a + (s.duration_sec ?? 0), 0) / timed.length / 60)
    : null

  const streaks = progress.map((p) => p.daily_streak ?? 0)
  const avgStreak = streaks.length
    ? Math.round((streaks.reduce((a, b) => a + b, 0) / streaks.length) * 10) / 10
    : null

  // Per-unit and per-question difficulty from every attempt on record.
  type Attempt = {
    question_id: string
    attempts: number | null
    correct: number | null
    questions: { unit_id: number; legacy_id: number; question_en: string } | null
  }
  const attempts = (attemptRes.data ?? []) as unknown as Attempt[]

  const unitTitles = new Map<number, string>(
    ((unitRes.data ?? []) as { id: number; title_en: string }[]).map((u) => [u.id, u.title_en]),
  )

  const reportsByQuestion = new Map<string, number>()
  for (const r of (reportRes.data ?? []) as { question_id: string }[]) {
    reportsByQuestion.set(r.question_id, (reportsByQuestion.get(r.question_id) ?? 0) + 1)
  }

  const byUnit = new Map<number, { a: number; c: number }>()
  const byQuestion = new Map<string, { a: number; c: number; unitId: number; legacyId: number; text: string }>()

  let totalA = 0, totalC = 0
  for (const at of attempts) {
    const q = at.questions
    if (!q) continue
    const a = at.attempts ?? 0
    const c = at.correct ?? 0
    totalA += a; totalC += c

    const u = byUnit.get(q.unit_id) ?? { a: 0, c: 0 }
    u.a += a; u.c += c
    byUnit.set(q.unit_id, u)

    const k = byQuestion.get(at.question_id) ?? { a: 0, c: 0, unitId: q.unit_id, legacyId: q.legacy_id, text: q.question_en }
    k.a += a; k.c += c
    byQuestion.set(at.question_id, k)
  }

  const hardestUnits = [...byUnit.entries()]
    .filter(([, v]) => v.a >= MIN_UNIT_ANSWERS)
    .map(([unitId, v]) => ({
      unitId,
      title: unitTitles.get(unitId) ?? `Unit ${unitId}`,
      answers: v.a,
      correctPct: Math.round((v.c / v.a) * 100),
    }))
    .sort((x, y) => x.correctPct - y.correctPct)
    .slice(0, 6)

  const mostMissed = [...byQuestion.entries()]
    .filter(([, v]) => v.a >= MIN_QUESTION_ANSWERS)
    .map(([id, v]) => ({
      id,
      unitId: v.unitId,
      legacyId: v.legacyId,
      text: v.text.length > 110 ? `${v.text.slice(0, 110)}…` : v.text,
      answers: v.a,
      wrongPct: Math.round(((v.a - v.c) / v.a) * 100),
      reports: reportsByQuestion.get(id) ?? 0,
    }))
    .sort((x, y) => y.wrongPct - x.wrongPct)
    .slice(0, 10)

  return {
    answers: totalA,
    avgAccuracy,
    avgReadiness,
    avgStudyMin,
    avgStreak,
    hardestUnits,
    mostMissed,
    overallCorrectPct: totalA > 0 ? Math.round((totalC / totalA) * 100) : null,
  }
}

/* ── Daily series for the two charts ────────────────────────────────────── */

async function loadSeries(supabase: DB, start: Date, now: Date) {
  const days = dayRange(start, now)
  const index = new Map(days.map((d, i) => [d, i]))
  const zeros = () => days.map(() => 0)

  const [profileRes, sessionRes] = await Promise.all([
    supabase.from('profiles').select('created_at, trial_used_at, subscription_status, updated_at'),
    supabase.from('study_sessions')
      .select('user_id, session_type, questions_answered, started_at, completed_at')
      .gte('started_at', start.toISOString()),
  ])
  if (profileRes.error) throw profileRes.error
  if (sessionRes.error) throw sessionRes.error

  const newUsers = zeros(), trialsStarted = zeros(), subscriptions = zeros(), cancellations = zeros()

  for (const p of (profileRes.data ?? []) as Record<string, string | null>[]) {
    const bump = (arr: number[], iso: string | null) => {
      if (!iso) return
      const i = index.get(iso.slice(0, 10))
      if (i != null) arr[i] += 1
    }
    bump(newUsers, p.created_at)
    bump(trialsStarted, p.trial_used_at)
    // Stripe events are not kept as history, so the status change is dated by
    // the row's own updated_at — right for recent activity, approximate for old.
    if (p.subscription_status === 'active')   bump(subscriptions, p.updated_at)
    if (p.subscription_status === 'canceled') bump(cancellations, p.updated_at)
  }

  const activeSets = days.map(() => new Set<string>())
  const sessions = zeros(), answers = zeros(), exams = zeros()

  for (const s of (sessionRes.data ?? []) as Record<string, any>[]) {
    const i = index.get(String(s.started_at).slice(0, 10))
    if (i == null) continue
    activeSets[i].add(s.user_id)
    sessions[i] += 1
    answers[i]  += s.questions_answered ?? 0
    if (s.session_type === 'exam' && s.completed_at) exams[i] += 1
  }

  return {
    growth:     { days, newUsers, trialsStarted, subscriptions, cancellations },
    engagement: { days, activeUsers: activeSets.map((s) => s.size), sessions, answers, exams },
  }
}

/* ── Needs attention ────────────────────────────────────────────────────── */

async function loadAttention(supabase: DB, now: Date) {
  const sevenAgo  = new Date(now.getTime() - 7 * DAY).toISOString()
  const weekAhead = new Date(now.getTime() + 7 * DAY).toISOString()
  const monthAgo  = new Date(now.getTime() - 30 * DAY).toISOString()

  const [openReports, pastDue, canceled, progressRows, codes, abandoned, freeExpiring] = await Promise.all([
    supabase.from('error_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'past_due'),
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'canceled').gte('updated_at', monthAgo),
    supabase.from('user_progress').select('last_study_date').not('last_study_date', 'is', null),
    supabase.from('access_codes').select('active, uses_count, expires_at'),
    supabase.from('study_sessions').select('id', { count: 'exact', head: true })
      .is('completed_at', null).eq('session_type', 'exam').lt('started_at', sevenAgo),
    // free_access grants that lapse within a week — these are the trials we do
    // control; card trials live in Stripe and are counted in the billing block.
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('subscription_status', 'free_access')
      .gte('subscription_expires_at', now.toISOString())
      .lte('subscription_expires_at', weekAhead),
  ])

  const idle7d = ((progressRows.data ?? []) as { last_study_date: string }[])
    .filter((r) => new Date(r.last_study_date).getTime() < now.getTime() - 7 * DAY).length

  const codeRows = (codes.data ?? []) as { active: boolean; uses_count: number; expires_at: string | null }[]
  const codesExpiringSoon = codeRows.filter((c) =>
    c.active && c.expires_at && new Date(c.expires_at) > now && new Date(c.expires_at) < new Date(weekAhead),
  ).length
  const codesNeverUsed = codeRows.filter((c) => c.active && c.uses_count === 0).length

  return {
    openReports:       openReports.count ?? 0,
    trialsEndingSoon:  freeExpiring.count ?? 0,
    pastDue:           pastDue.count ?? 0,
    canceledRecently:  canceled.count ?? 0,
    idle7d,
    codesExpiringSoon,
    codesNeverUsed,
    abandonedExams:    abandoned.count ?? 0,
  }
}

/* ── Billing (Stripe is the only source of truth for money) ─────────────── */

async function loadBilling() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return { mrrCents: null, currency: 'usd', activeSubs: null, note: 'STRIPE_SECRET_KEY is not set on this deploy.' }
  }

  const { stripe } = await import('@/lib/stripe')

  let mrr = 0
  let count = 0
  let currency = 'usd'
  let startingAfter: string | undefined

  // Cap the walk: a page of 100 twice over is plenty at this size, and an
  // unbounded loop on a dashboard render is how a page hangs.
  for (let page = 0; page < 2; page++) {
    const res = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const sub of res.data) {
      for (const item of sub.items.data) {
        const price = item.price
        if (!price?.unit_amount || !price.recurring) continue
        currency = price.currency
        const qty = item.quantity ?? 1
        const perMonth =
          price.recurring.interval === 'year'  ? price.unit_amount / 12 :
          price.recurring.interval === 'week'  ? (price.unit_amount * 52) / 12 :
          price.recurring.interval === 'day'   ? (price.unit_amount * 365) / 12 :
          price.unit_amount
        mrr += (perMonth * qty) / (price.recurring.interval_count || 1)
      }
      count += 1
    }

    if (!res.has_more) break
    startingAfter = res.data[res.data.length - 1]?.id
    if (!startingAfter) break
  }

  return { mrrCents: Math.round(mrr), currency, activeSubs: count, note: null }
}

/* ── Recent users ───────────────────────────────────────────────────────── */

async function loadRecentUsers(supabase: DB): Promise<RecentUser[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, subscription_status, subscription_expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error

  const rows = (profiles ?? []) as Record<string, any>[]
  const ids  = rows.map((r) => r.id as string)
  if (!ids.length) return []

  const { data: progress } = await supabase
    .from('user_progress')
    .select('user_id, total_questions, total_correct, daily_streak, last_study_date')
    .in('user_id', ids)

  const byUser = new Map<string, Record<string, any>>()
  for (const p of (progress ?? []) as Record<string, any>[]) byUser.set(p.user_id, p)

  const now = Date.now()

  return rows.map((r) => {
    const p = byUser.get(r.id)
    const answered = p?.total_questions ?? 0
    const status: string = r.subscription_status ?? 'none'
    const expired = r.subscription_expires_at && new Date(r.subscription_expires_at).getTime() < now

    const plan: RecentUser['plan'] =
      status === 'active' || status === 'past_due' ? 'Paid'
      : status === 'trialing' ? 'Trial'
      : status === 'free_access' ? (expired ? 'Expired' : 'Free')
      : status === 'canceled' ? 'Cancelled'
      : 'Expired'

    return {
      id: r.id,
      email: r.email,
      name: r.display_name ?? null,
      plan,
      status,
      lastActivity: p?.last_study_date ?? null,
      answered,
      accuracy: answered > 0 ? Math.round(((p?.total_correct ?? 0) / answered) * 100) : null,
      streak: p?.daily_streak ?? 0,
      joined: r.created_at,
    }
  })
}
