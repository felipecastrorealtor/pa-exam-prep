'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AppNavProps {
  userEmail:          string
  displayName:        string
  lang:               string
  subscriptionStatus: string | null
}

const navLinks = [
  { href: '/study',        label: 'Study',        labelEs: 'Estudiar' },
  { href: '/flashcards',   label: 'Flashcards',   labelEs: 'Tarjetas' },
  { href: '/glossary',     label: 'Glossary',     labelEs: 'Glosario' },
  { href: '/achievements', label: 'Achievements', labelEs: 'Logros' },
]

export default function AppNav({ userEmail, displayName, lang, subscriptionStatus }: AppNavProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen] = useState(false)
  const supabase  = createClient()

  const isEs    = lang === 'es'
  const isAdmin = false // fetched separately if needed

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const statusBadge: Record<string, { label: string; cls: string }> = {
    trialing:    { label: 'Trial',    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    active:      { label: 'Active',   cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    free_access: { label: '30d Free', cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    past_due:    { label: 'Past Due', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    canceled:    { label: 'Canceled', cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  }

  const badge = subscriptionStatus ? statusBadge[subscriptionStatus] : null

  return (
    <nav className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-5xl h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/study" className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          🏠 <span className="hidden sm:inline">PA Exam Prep</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => {
            const active = pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {isEs ? l.labelEs : l.label}
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {badge && (
            <span className={`hidden sm:inline text-xs font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </span>
          )}

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 hover:border-amber-500/50 transition-colors"
            >
              {(displayName || userEmail || '?')[0].toUpperCase()}
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-10 z-20 w-52 card !p-2 shadow-xl border-slate-700">
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{displayName || userEmail}</p>
                    <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                  </div>
                  <Link href="/settings" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                    ⚙️ Settings
                  </Link>
                  <Link href="/subscribe" onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">
                    💳 Subscription
                  </Link>
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded-lg transition-colors">
                    🚪 Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav (bottom bar) */}
      <div className="md:hidden border-t border-slate-800 flex">
        {navLinks.map((l) => {
          const active = pathname.startsWith(l.href)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 py-2.5 text-center text-xs transition-colors ${
                active ? 'text-amber-400' : 'text-slate-500'
              }`}
            >
              {isEs ? l.labelEs : l.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
