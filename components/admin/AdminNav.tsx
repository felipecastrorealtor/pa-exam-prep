'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

const LINKS = [
  { href: '/admin',           label: 'Dashboard' },
  { href: '/admin/units',     label: 'Units' },
  { href: '/admin/questions', label: 'Questions' },
  { href: '/admin/users',     label: 'Users' },
  { href: '/admin/codes',     label: 'Access Codes' },
  { href: '/admin/reports',   label: 'Reports' },
]

export default function AdminNav({ email }: { email: string }) {
  const path = usePathname()
  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-14 flex items-center gap-3">
          <span className="font-bold text-sm tracking-wide text-amber-400 shrink-0">ADMIN</span>

          {/* Six links don't fit a phone. The nav scrolls sideways inside
              itself — the page must not, or the layout drifts into empty
              space. -mx-1/px-1 keeps the focus ring from being clipped. */}
          <nav className="flex gap-1 flex-1 min-w-0 overflow-x-auto no-scrollbar -mx-1 px-1">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shrink-0 whitespace-nowrap',
                  path === href
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
            {/* The address is confirmation, not navigation — it goes first
                when space is short. */}
            <span className="hidden lg:inline max-w-[180px] truncate">{email}</span>
            <Link href="/study" className="text-gray-500 hover:text-white whitespace-nowrap">
              ← App
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
