'use client'

import type { CSSProperties } from 'react'

/**
 * The app's icon set.
 *
 * Emoji render differently on every platform, can't take the app's colours, and
 * look pasted-on next to the rest of the UI. These are hand-drawn SVGs that use
 * a per-icon gradient, so each one carries a colour that means something —
 * flame orange for the streak, emerald for accuracy, gold for the trophy.
 *
 * `interactive` adds a lift-and-glow on hover, for icons that sit on something
 * clickable. Every gradient id is namespaced per icon so two icons on the same
 * page never collide.
 */

export type IconName =
  | 'flame' | 'target' | 'document' | 'calendar' | 'bolt' | 'book' | 'cards'
  | 'chart' | 'user' | 'sparkle' | 'trophy' | 'medal' | 'star' | 'crown'
  | 'shield' | 'scales' | 'home' | 'key' | 'gear' | 'card' | 'logout'
  | 'globe' | 'seedling' | 'graduation' | 'clock' | 'check' | 'lock'
  | 'alert' | 'newFile' | 'bookOpen' | 'trendUp' | 'gem'

interface Props {
  name: IconName
  size?: number
  /** Adds hover lift + glow. Use on icons inside buttons or links. */
  interactive?: boolean
  /** Renders desaturated and dimmed — for locked / inactive states. */
  muted?: boolean
  title?: string
  style?: CSSProperties
}

/** [from, to] gradient stops per icon — the colour is part of the meaning. */
const RAMP: Record<IconName, [string, string]> = {
  flame:      ['#fbbf24', '#f97316'],
  target:     ['#60a5fa', '#4f8ef7'],
  document:   ['#93c5fd', '#3b82f6'],
  calendar:   ['#c4b5fd', '#7c5cfc'],
  bolt:       ['#fde047', '#f59e0b'],
  book:       ['#7dd3fc', '#0ea5e9'],
  cards:      ['#a5b4fc', '#6366f1'],
  chart:      ['#67e8f9', '#06b6d4'],
  user:       ['#a5b4fc', '#7c5cfc'],
  sparkle:    ['#c4b5fd', '#8b5cf6'],
  trophy:     ['#fcd34d', '#f59e0b'],
  medal:      ['#fca5a5', '#ef4444'],
  star:       ['#fde68a', '#fbbf24'],
  crown:      ['#fcd34d', '#eab308'],
  shield:     ['#6ee7b7', '#10b981'],
  scales:     ['#a5b4fc', '#6366f1'],
  home:       ['#5eead4', '#14b8a6'],
  key:        ['#fcd34d', '#f59e0b'],
  gear:       ['#cbd5e1', '#94a3b8'],
  card:       ['#86efac', '#22c55e'],
  logout:     ['#fca5a5', '#ef4444'],
  globe:      ['#7dd3fc', '#0284c7'],
  seedling:   ['#86efac', '#16a34a'],
  graduation: ['#a5b4fc', '#4f46e5'],
  clock:      ['#fdba74', '#f97316'],
  check:      ['#6ee7b7', '#059669'],
  lock:       ['#cbd5e1', '#64748b'],
  alert:      ['#fca5a5', '#dc2626'],
  newFile:    ['#93c5fd', '#2563eb'],
  bookOpen:   ['#7dd3fc', '#0ea5e9'],
  trendUp:    ['#6ee7b7', '#10b981'],
  gem:        ['#67e8f9', '#0891b2'],
}

/** Stroke geometry per icon, drawn on a 24×24 grid. */
function paths(name: IconName, s: string) {
  const c = { fill: 'none', stroke: s, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'flame':      return <><path {...c} d="M12 2.5c2.4 3 3.6 5.2 3.6 6.7a3.6 3.6 0 0 1-7.2 0c0-.6.2-1.2.5-1.8C7 9 6 10.9 6 13a6 6 0 0 0 12 0c0-3.7-2-7.2-6-10.5Z"/></>
    case 'target':     return <><circle {...c} cx="12" cy="12" r="8.5"/><circle {...c} cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.9" fill={s}/></>
    case 'document':   return <><path {...c} d="M14 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z"/><path {...c} d="M14 2.5v5h5"/><path {...c} d="M8.5 13h7M8.5 16.5h5"/></>
    case 'calendar':   return <><rect {...c} x="3.5" y="5" width="17" height="16" rx="2.5"/><path {...c} d="M3.5 10h17M8.5 3v4M15.5 3v4"/><circle cx="9" cy="14.5" r="1.3" fill={s}/></>
    case 'bolt':       return <><path {...c} d="M13.5 2 4.5 13.5h6L10 22l9.5-11.5h-6.3Z"/></>
    case 'book':       return <><path {...c} d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5Z"/><path {...c} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/></>
    case 'cards':      return <><path {...c} d="m12 2.5 9.5 4.7L12 12 2.5 7.2Z"/><path {...c} d="m2.5 12 9.5 4.8 9.5-4.8"/><path {...c} d="m2.5 16.8 9.5 4.7 9.5-4.7"/></>
    case 'chart':      return <><path {...c} d="M4 20.5h17"/><rect {...c} x="5" y="12" width="3.6" height="7" rx="1.2"/><rect {...c} x="10.2" y="7" width="3.6" height="12" rx="1.2"/><rect {...c} x="15.4" y="3.5" width="3.6" height="15.5" rx="1.2"/></>
    case 'user':       return <><circle {...c} cx="12" cy="8" r="4"/><path {...c} d="M4.5 21v-1.2A5.3 5.3 0 0 1 9.8 14.5h4.4a5.3 5.3 0 0 1 5.3 5.3V21"/></>
    case 'sparkle':    return <><path {...c} d="m12 2.5 2.1 5.6 5.6 2.1-5.6 2.1L12 17.9l-2.1-5.6-5.6-2.1 5.6-2.1Z"/><path {...c} d="m18.5 16 .8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8Z"/></>
    case 'trophy':     return <><path {...c} d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path {...c} d="M7 5.5H4.6A2.6 2.6 0 0 0 7 10.5M17 5.5h2.4A2.6 2.6 0 0 1 17 10.5"/><path {...c} d="M12 14v3.5M8.5 21h7M9.5 21c0-1.9 1.1-3 2.5-3.5"/></>
    case 'medal':      return <><circle {...c} cx="12" cy="15" r="6"/><path {...c} d="M8.5 9.6 6 2.5h5l1.6 4M15.5 9.6 18 2.5h-5"/><path {...c} d="m12 12.4 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 14.7l2.2-.3Z"/></>
    case 'star':       return <><path {...c} d="m12 2.8 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5L2.6 9.6l6.5-.9Z"/></>
    case 'crown':      return <><path {...c} d="M3 7.5 6.5 14 12 5l5.5 9L21 7.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z"/><circle cx="3" cy="6" r="1.4" fill={s}/><circle cx="21" cy="6" r="1.4" fill={s}/><circle cx="12" cy="3.6" r="1.4" fill={s}/></>
    case 'shield':     return <><path {...c} d="M12 2.5 4.5 5.6v5.6c0 4.6 3.1 8.8 7.5 10.3 4.4-1.5 7.5-5.7 7.5-10.3V5.6Z"/><path {...c} d="m8.8 11.8 2.3 2.3 4.1-4.4"/></>
    case 'scales':     return <><path {...c} d="M12 3.5v17M7 20.5h10M4 8.5h16M8.5 6.5 12 5l3.5 1.5"/><path {...c} d="M4 8.5 1.8 14a2.6 2.6 0 0 0 4.4 0ZM20 8.5 17.8 14a2.6 2.6 0 0 0 4.4 0Z"/></>
    case 'home':       return <><path {...c} d="M3.5 10.8 12 3.5l8.5 7.3V20a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 20Z"/><path {...c} d="M9.5 21.5v-6.2h5v6.2"/></>
    case 'key':        return <><circle {...c} cx="8" cy="8" r="4.5"/><path {...c} d="m11.4 11.4 8.6 8.6M17 17l2.2-2.2M14.5 14.5l2.2-2.2"/></>
    case 'gear':       return <><circle {...c} cx="12" cy="12" r="3.2"/><path {...c} d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3.4a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3.4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z"/></>
    case 'card':       return <><rect {...c} x="2.5" y="5" width="19" height="14" rx="2.5"/><path {...c} d="M2.5 10h19M6 15h3.5"/></>
    case 'logout':     return <><path {...c} d="M9.5 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3h4"/><path {...c} d="m16 16.5 4.5-4.5L16 7.5M20.5 12h-11"/></>
    case 'globe':      return <><circle {...c} cx="12" cy="12" r="9"/><path {...c} d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/></>
    case 'seedling':   return <><path {...c} d="M12 21v-8"/><path {...c} d="M12 13C12 9.5 9.5 7 6 7c0 3.5 2.5 6 6 6ZM12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z"/></>
    case 'graduation': return <><path {...c} d="m12 3 10 5-10 5L2 8Z"/><path {...c} d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5M22 8v6"/></>
    case 'clock':      return <><circle {...c} cx="12" cy="12" r="9"/><path {...c} d="M12 7v5.3l3.4 2"/></>
    case 'check':      return <><circle {...c} cx="12" cy="12" r="9"/><path {...c} d="m8 12.3 2.8 2.8L16.3 9.5"/></>
    case 'lock':       return <><rect {...c} x="4.5" y="10.5" width="15" height="10.5" rx="2.4"/><path {...c} d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></>
    case 'alert':      return <><path {...c} d="M10.3 3.9 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path {...c} d="M12 9.5v4"/><circle cx="12" cy="17" r="1.1" fill={s}/></>
    case 'newFile':    return <><path {...c} d="M14 2.5H7A2 2 0 0 0 5 4.5v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z"/><path {...c} d="M14 2.5v5h5M12 11.5v6M9 14.5h6"/></>
    case 'bookOpen':   return <><path {...c} d="M2.5 5.5h6a3.5 3.5 0 0 1 3.5 3.5v11a2.6 2.6 0 0 0-2.6-2.6H2.5Z"/><path {...c} d="M21.5 5.5h-6A3.5 3.5 0 0 0 12 9v11a2.6 2.6 0 0 1 2.6-2.6h6.9Z"/></>
    case 'trendUp':    return <><path {...c} d="m3 16.5 5.5-5.5 3.5 3.5L21 5.5"/><path {...c} d="M15.5 5.5H21v5.5"/><path {...c} d="M3 20.5h18"/></>
    case 'gem':        return <><path {...c} d="M6.5 3h11l4 6-9.5 12L2.5 9Z"/><path {...c} d="M2.5 9h19M8.5 9 12 21M15.5 9 12 21M6.5 3 8.5 9M17.5 3 15.5 9"/></>
  }
}

export default function Icon({ name, size = 20, interactive, muted, title, style }: Props) {
  const [from, to] = RAMP[name]
  const gid = `ic-${name}`

  return (
    <span
      className={interactive ? 'app-icon app-icon-interactive' : 'app-icon'}
      style={{ display: 'inline-flex', lineHeight: 0, flexShrink: 0, ...style }}
    >
      <svg
        width={size} height={size} viewBox="0 0 24 24"
        role={title ? 'img' : 'presentation'}
        aria-label={title} aria-hidden={title ? undefined : true}
        style={{
          filter: muted ? 'grayscale(1)' : undefined,
          opacity: muted ? 0.42 : 1,
          transition: 'transform .18s cubic-bezier(.34,1.56,.64,1), filter .25s, opacity .25s',
        }}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {paths(name, `url(#${gid})`)}
      </svg>
    </span>
  )
}
