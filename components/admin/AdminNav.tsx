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
]

export default function AdminNav({ email }: { email: string }) {
  const path = usePathname()
  return (
    <header className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <span className="font-bold text-sm tracking-wide text-amber-400">ADMIN</span>
        <nav className="flex gap-1 flex-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                path === href
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{email}</span>
          <Link href="/study" className="text-gray-500 hover:text-white">
            ← App
          </Link>
        </div>
      </div>
    </header>
  )
}
