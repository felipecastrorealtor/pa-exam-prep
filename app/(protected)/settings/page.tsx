import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import SettingsForm from '@/components/settings/SettingsForm'

export const metadata: Metadata = { title: 'Settings — PA Exam Prep' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_lang, subscription_status, subscription_expires_at')
    .eq('id', user.id)
    .single()

  const { data: progress } = await supabase
    .from('user_progress')
    .select('daily_goal, exam_date')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      <SettingsForm
        initialLang={(profile?.preferred_lang as 'en' | 'es') ?? 'en'}
        initialDailyGoal={progress?.daily_goal ?? 20}
        initialExamDate={progress?.exam_date ?? null}
        subscriptionStatus={profile?.subscription_status ?? 'canceled'}
        subscriptionExpires={profile?.subscription_expires_at ?? null}
      />
    </div>
  )
}
