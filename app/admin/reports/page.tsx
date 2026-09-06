import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import ReportTriage, { type AdminReport } from '@/components/admin/ReportTriage'

export const metadata: Metadata = { title: 'Reports — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const status = ['open', 'resolved', 'dismissed', 'all'].includes(searchParams.status ?? '')
    ? (searchParams.status as 'open' | 'resolved' | 'dismissed' | 'all')
    : 'open'

  const supabase = await createAdminClient()

  let query = supabase
    .from('error_reports')
    .select(`
      id, kind, message, status, created_at, context, question_id, user_id,
      questions ( unit_id, legacy_id, question_en ),
      profiles  ( email )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query

  const rows: AdminReport[] = ((data ?? []) as Record<string, any>[]).map((r) => {
    const q = Array.isArray(r.questions) ? r.questions[0] : r.questions
    const p = Array.isArray(r.profiles)  ? r.profiles[0]  : r.profiles
    return {
      id:        r.id,
      kind:      r.kind,
      message:   r.message,
      status:    r.status,
      createdAt: r.created_at,
      questionId: r.question_id ?? null,
      unitId:    q?.unit_id ?? null,
      legacyId:  q?.legacy_id ?? null,
      questionText: q?.question_en ?? null,
      reporterEmail: p?.email ?? null,
      page: typeof r.context?.page === 'string' ? r.context.page : null,
      lang: typeof r.context?.lang === 'string' ? r.context.lang : null,
    }
  })

  const counts = { open: 0 }
  if (status !== 'open') {
    const { count } = await supabase
      .from('error_reports').select('id', { count: 'exact', head: true }).eq('status', 'open')
    counts.open = count ?? 0
  } else {
    counts.open = rows.length
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reported problems</h1>
        <p className="text-sm text-gray-500 mt-1">
          What students flagged from inside the app — a wrong answer key, a bad
          translation, or anything else. {counts.open} still open.
        </p>
      </div>

      {error && (
        <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-4 py-3">
          Could not load reports: {error.message}
        </p>
      )}

      <ReportTriage reports={rows} status={status} />
    </div>
  )
}
