'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initAnalytics, identifyUser, trackPageview } from '@/lib/analytics'

/**
 * Boots analytics and reports navigations.
 *
 * The App Router changes pages without a document load, so the pageview is
 * sent here on every path change. The `sent` ref is what stops React Strict
 * Mode's double effect from sending each view twice.
 */
export default function AnalyticsProvider({
  userId,
  plan,
  language,
}: {
  userId?: string | null
  plan?: 'paid' | 'trial' | 'free_access' | 'none'
  language?: 'en' | 'es'
}) {
  const pathname = usePathname()
  const search   = useSearchParams()
  const sent     = useRef<string | null>(null)
  const identified = useRef<string | null>(null)

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    if (!userId || identified.current === userId) return
    identified.current = userId
    identifyUser(userId, { plan: plan ?? 'none', language: language ?? 'en' })
  }, [userId, plan, language])

  useEffect(() => {
    if (!pathname) return
    const qs  = search?.toString()
    const url = qs ? `${pathname}?${qs}` : pathname
    if (sent.current === url) return
    sent.current = url
    trackPageview(window.location.origin + url)
  }, [pathname, search])

  return null
}
