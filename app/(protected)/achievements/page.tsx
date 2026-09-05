import { redirect } from 'next/navigation'

/** Achievements now live on the Home tab, as the original app's wall. */
export default function AchievementsRedirect() {
  redirect('/home')
}
