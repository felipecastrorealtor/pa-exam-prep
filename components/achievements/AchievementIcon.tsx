'use client'

import { useEffect, useRef } from 'react'

/* ──────────────────────────────────────────────
   Rarity palette
   ────────────────────────────────────────────── */
type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

const RARITY_COLORS: Record<Rarity, { primary: string; secondary: string; glow: string }> = {
  common:    { primary: '#64748b', secondary: '#94a3b8', glow: 'rgba(148,163,184,0.4)' },
  rare:      { primary: '#4f8ef7', secondary: '#7c5cfc', glow: 'rgba(79,142,247,0.5)'  },
  epic:      { primary: '#f59e0b', secondary: '#ef4444', glow: 'rgba(245,158,11,0.55)' },
  legendary: { primary: '#a855f7', secondary: '#ec4899', glow: 'rgba(168,85,247,0.6)'  },
}

/* ──────────────────────────────────────────────
   Achievement metadata
   ────────────────────────────────────────────── */
type AchievementMeta = {
  rarity:  Rarity
  label:   string
}

const ACHIEVEMENT_META: Record<string, AchievementMeta> = {
  first_question: { rarity: 'common',    label: 'First Step'    },
  q10:            { rarity: 'common',    label: '10 Questions'  },
  q50:            { rarity: 'common',    label: '50 Questions'  },
  q100:           { rarity: 'rare',      label: '100 Questions' },
  q250:           { rarity: 'rare',      label: '250 Questions' },
  q500:           { rarity: 'epic',      label: '500 Questions' },
  q1000:          { rarity: 'legendary', label: '1000 Questions'},
  streak_3:       { rarity: 'common',    label: '3-Day Streak'  },
  streak_7:       { rarity: 'rare',      label: '7-Day Streak'  },
  streak_30:      { rarity: 'epic',      label: '30-Day Streak' },
  streak_100:     { rarity: 'legendary', label: '100-Day Streak'},
  session_10:     { rarity: 'common',    label: '10 Sessions'   },
  session_50:     { rarity: 'rare',      label: '50 Sessions'   },
  session_100:    { rarity: 'epic',      label: '100 Sessions'  },
  accuracy_80:    { rarity: 'common',    label: '80% Accuracy'  },
  accuracy_90:    { rarity: 'rare',      label: '90% Accuracy'  },
  accuracy_100:   { rarity: 'epic',      label: 'Perfect Score' },
  unit_complete:  { rarity: 'rare',      label: 'Unit Complete' },
  all_units:      { rarity: 'legendary', label: 'All Units'     },
  speed_bonus:    { rarity: 'rare',      label: 'Speed Bonus'   },
  comeback:       { rarity: 'epic',      label: 'Comeback'      },
}

/* ──────────────────────────────────────────────
   Individual icon paths (centered in 40x40 viewBox)
   ────────────────────────────────────────────── */

// Common: seedling sprout
function IconFirstQuestion({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 34 L20 22" stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 26 Q14 20 16 14 Q22 14 22 20" fill={c.primary} opacity="0.9"/>
      <path d="M20 30 Q26 24 24 18 Q18 18 18 24" fill={c.secondary} opacity="0.7"/>
    </g>
  )
}

// Common: book check
function IconQ50({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <rect x="11" y="10" width="18" height="22" rx="2" fill="none" stroke={c.primary} strokeWidth="2"/>
      <line x1="11" y1="10" x2="11" y2="32" stroke={c.secondary} strokeWidth="3" strokeLinecap="round"/>
      <path d="M16 21 L19 24 L25 18" stroke={c.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  )
}

// Rare: bullseye target
function IconQ100({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <circle cx="20" cy="20" r="11" fill="none" stroke={c.primary} strokeWidth="2" opacity="0.4"/>
      <circle cx="20" cy="20" r="7"  fill="none" stroke={c.primary} strokeWidth="2" opacity="0.7"/>
      <circle cx="20" cy="20" r="3"  fill={c.secondary}/>
      <line x1="20" y1="9"  x2="20" y2="12" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="28" x2="20" y2="31" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9"  y1="20" x2="12" y2="20" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="20" x2="31" y2="20" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  )
}

// Rare: lightning bolt
function IconQ250({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M23 8 L14 22 L19 22 L17 32 L27 18 L22 18 Z" fill={c.primary} stroke={c.secondary} strokeWidth="1" strokeLinejoin="round"/>
    </g>
  )
}

// Epic: trophy
function IconQ500({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M13 10 L13 20 Q13 27 20 27 Q27 27 27 20 L27 10 Z" fill="none" stroke={c.primary} strokeWidth="2"/>
      <path d="M13 14 Q9 14 9 18 Q9 22 13 22" fill="none" stroke={c.secondary} strokeWidth="1.5"/>
      <path d="M27 14 Q31 14 31 18 Q31 22 27 22" fill="none" stroke={c.secondary} strokeWidth="1.5"/>
      <line x1="20" y1="27" x2="20" y2="31" stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 31 L25 31" stroke={c.primary} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M17 17 L19 19 L23 15" stroke={c.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  )
}

// Legendary: crown
function IconQ1000({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M9 28 L11 16 L16 22 L20 12 L24 22 L29 16 L31 28 Z" fill={c.primary} stroke={c.secondary} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="20" cy="12" r="2" fill={c.secondary}/>
      <circle cx="11" cy="16" r="1.5" fill={c.secondary}/>
      <circle cx="29" cy="16" r="1.5" fill={c.secondary}/>
      <rect x="9" y="28" width="22" height="3" rx="1.5" fill={c.secondary}/>
    </g>
  )
}

// Common: small fire
function IconStreak3({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 32 Q12 28 12 20 Q12 14 17 11 Q16 16 18 18 Q17 13 22 10 Q21 15 24 17 Q27 14 27 11 Q30 15 29 22 Q28 28 20 32 Z" fill={c.primary}/>
      <path d="M20 29 Q15 26 15 21 Q15 18 17 16 Q17 19 19 20 Q19 17 21 15 Q21 18 23 19 Q25 17 25 15 Q27 18 27 21 Q26 26 20 29 Z" fill={c.secondary} opacity="0.7"/>
    </g>
  )
}

// Rare: bigger fire with inner glow
function IconStreak7({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 33 Q10 28 10 19 Q10 12 16 9 Q15 15 18 18 Q16 12 22 8 Q21 14 25 17 Q28 13 28 9 Q32 14 31 22 Q30 29 20 33 Z" fill={c.primary}/>
      <path d="M20 29 Q14 25 14 19 Q14 15 17 13 Q17 17 19 19 Q19 15 22 13 Q22 16 24 18 Q26 15 26 13 Q28 16 28 20 Q27 25 20 29 Z" fill={c.secondary} opacity="0.8"/>
      <ellipse cx="20" cy="25" rx="4" ry="5" fill="rgba(255,255,255,0.15)"/>
    </g>
  )
}

// Epic: blue inferno with star
function IconStreak30({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 33 Q10 28 10 18 Q10 11 16 8 Q14 14 17 17 Q15 11 21 7 Q20 13 24 16 Q27 12 27 8 Q31 13 31 21 Q30 28 20 33 Z" fill={c.primary}/>
      <path d="M20 29 Q13 25 13 18 Q13 14 16 12 Q16 16 18 18 Q18 14 21 12 Q21 15 24 17 Q26 14 26 12 Q28 15 28 19 Q27 24 20 29 Z" fill={c.secondary} opacity="0.85"/>
      <path d="M20 14 L21.2 17.6 L25 17.6 L22 19.8 L23.1 23.4 L20 21.2 L16.9 23.4 L18 19.8 L15 17.6 L18.8 17.6 Z" fill="rgba(255,255,255,0.9)" transform="scale(0.65) translate(10.5,10)"/>
    </g>
  )
}

// Common: graduation cap
function IconSession10({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 12 L9 17 L20 22 L31 17 Z" fill={c.primary}/>
      <path d="M14 19.5 L14 26 Q20 29 26 26 L26 19.5" fill="none" stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <line x1="31" y1="17" x2="31" y2="24" stroke={c.secondary} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="31" cy="25" r="1.5" fill={c.secondary}/>
    </g>
  )
}

// Rare: eagle wings
function IconSession50({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 20 Q12 14 8 18 Q10 22 16 21 Q13 25 10 24 Q12 28 18 26 L20 24 L22 26 Q28 28 30 24 Q27 25 24 21 Q30 22 32 18 Q28 14 20 20 Z" fill={c.primary}/>
      <circle cx="20" cy="17" r="3" fill={c.secondary}/>
      <path d="M18 17 L22 17" stroke={c.primary} strokeWidth="1.5"/>
    </g>
  )
}

// Common: diamond target
function IconAccuracy80({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <circle cx="20" cy="20" r="11" fill="none" stroke={c.primary} strokeWidth="1.5" strokeDasharray="3 2"/>
      <circle cx="20" cy="20" r="6.5" fill="none" stroke={c.primary} strokeWidth="2"/>
      <path d="M20 14 L23 20 L20 26 L17 20 Z" fill={c.secondary}/>
    </g>
  )
}

// Rare: precision diamond with rings
function IconAccuracy90({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <circle cx="20" cy="20" r="11" fill="none" stroke={c.primary} strokeWidth="1.5" opacity="0.5"/>
      <circle cx="20" cy="20" r="7.5" fill="none" stroke={c.primary} strokeWidth="2"/>
      <circle cx="20" cy="20" r="3.5" fill={c.secondary}/>
      <path d="M20 12 L21.5 16.5 L26 16.5 L22.5 19.5 L24 24 L20 21 L16 24 L17.5 19.5 L14 16.5 L18.5 16.5 Z"
        fill="rgba(255,255,255,0.15)" transform="scale(0.4) translate(30, 30)"/>
    </g>
  )
}

// Epic: perfect star burst
function IconAccuracy100({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 9 L22.5 16.5 L30.5 16.5 L24 21.2 L26.5 28.8 L20 24 L13.5 28.8 L16 21.2 L9.5 16.5 L17.5 16.5 Z"
        fill={c.primary} stroke={c.secondary} strokeWidth="0.8"/>
      <circle cx="20" cy="20" r="4" fill={c.secondary}/>
    </g>
  )
}

// Rare: checkmark in circle
function IconUnitComplete({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <circle cx="20" cy="20" r="11" fill="none" stroke={c.primary} strokeWidth="2"/>
      <path d="M13 20 L18 25 L27 15" stroke={c.secondary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  )
}

// Legendary: radiant all-units badge
function IconAllUnits({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      {/* Rays */}
      {[0,45,90,135,180,225,270,315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 20 + Math.cos(rad) * 8
        const y1 = 20 + Math.sin(rad) * 8
        const x2 = 20 + Math.cos(rad) * 13
        const y2 = 20 + Math.sin(rad) * 13
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c.secondary} strokeWidth="1.5" strokeLinecap="round" opacity="0.8"/>
      })}
      <circle cx="20" cy="20" r="7" fill={c.primary}/>
      <path d="M16 20 L19 23 L24 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </g>
  )
}

// Rare: clock with check
function IconSpeedBonus({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <circle cx="20" cy="20" r="11" fill="none" stroke={c.primary} strokeWidth="2"/>
      <path d="M20 13 L20 20 L25 20" stroke={c.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 8 L18 10" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M25 8 L22 10" stroke={c.primary} strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  )
}

// Epic: rising phoenix arrow
function IconComeback({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 30 L20 14" stroke={c.primary} strokeWidth="2" strokeLinecap="round"/>
      <path d="M14 20 L20 14 L26 20" fill="none" stroke={c.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Wings */}
      <path d="M20 20 Q14 16 10 18 Q12 22 17 21" fill={c.secondary} opacity="0.7"/>
      <path d="M20 20 Q26 16 30 18 Q28 22 23 21" fill={c.secondary} opacity="0.7"/>
    </g>
  )
}

/* ──────────────────────────────────────────────
   Default icon for unknown IDs
   ────────────────────────────────────────────── */
function IconDefault({ c }: { c: ReturnType<typeof getColors> }) {
  return (
    <g>
      <path d="M20 10 L22 16 L28 16 L23.5 20 L25.5 26 L20 22.5 L14.5 26 L16.5 20 L12 16 L18 16 Z"
        fill={c.primary} stroke={c.secondary} strokeWidth="0.5"/>
    </g>
  )
}

/* ──────────────────────────────────────────────
   Icon router
   ────────────────────────────────────────────── */
function getColors(rarity: Rarity) {
  return RARITY_COLORS[rarity]
}

function AchievementInner({ type, rarity }: { type: string; rarity: Rarity }) {
  const c = getColors(rarity)
  switch (type) {
    case 'first_question': return <IconFirstQuestion c={c} />
    case 'q50':            return <IconQ50           c={c} />
    case 'q100':           return <IconQ100          c={c} />
    case 'q250':           return <IconQ250          c={c} />
    case 'q500':           return <IconQ500          c={c} />
    case 'q1000':          return <IconQ1000         c={c} />
    case 'streak_3':       return <IconStreak3       c={c} />
    case 'streak_7':       return <IconStreak7       c={c} />
    case 'streak_30':      return <IconStreak30      c={c} />
    case 'streak_100':     return <IconQ1000         c={c} />
    case 'session_10':     return <IconSession10     c={c} />
    case 'session_50':     return <IconSession50     c={c} />
    case 'session_100':    return <IconAccuracy80    c={c} />
    case 'accuracy_80':    return <IconAccuracy80    c={c} />
    case 'accuracy_90':    return <IconAccuracy90    c={c} />
    case 'accuracy_100':   return <IconAccuracy100   c={c} />
    case 'unit_complete':  return <IconUnitComplete  c={c} />
    case 'all_units':      return <IconAllUnits      c={c} />
    case 'speed_bonus':    return <IconSpeedBonus    c={c} />
    case 'comeback':       return <IconComeback      c={c} />
    default:               return <IconDefault       c={c} />
  }
}

/* ──────────────────────────────────────────────
   Hexagon base shape path (for 40x40 viewBox)
   ────────────────────────────────────────────── */
function hexPoints(cx: number, cy: number, r: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}

/* ──────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────── */
export interface AchievementIconProps {
  achievementType: string
  unlocked:        boolean
  size?:           number  // px, default 56
  active?:         boolean // hover/focus highlight
  animated?:       boolean // play unlock animation
}

export default function AchievementIcon({
  achievementType,
  unlocked,
  size = 56,
  active = false,
  animated = false,
}: AchievementIconProps) {
  const meta   = ACHIEVEMENT_META[achievementType] ?? { rarity: 'common' as Rarity, label: 'Achievement' }
  const rarity = meta.rarity
  const colors = RARITY_COLORS[rarity]

  const uid    = `ach-${achievementType}`
  const hexPts = hexPoints(20, 20, 17)

  /* Generate a unique ID suffix to avoid SVG gradient conflicts on the same page */
  const idSuffix = achievementType.replace(/[^a-z0-9]/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={meta.label}
      style={{
        display: 'block',
        filter: unlocked
          ? (active ? `drop-shadow(0 0 8px ${colors.glow})` : `drop-shadow(0 2px 6px ${colors.glow})`)
          : 'grayscale(1) brightness(0.35)',
        transform: active ? 'scale(1.08)' : 'scale(1)',
        transition: 'filter 0.25s ease, transform 0.2s ease',
      }}
    >
      <defs>
        {/* Badge gradient */}
        <linearGradient id={`bg-${idSuffix}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={unlocked ? colors.primary   : '#1e2030'} stopOpacity="1"/>
          <stop offset="100%" stopColor={unlocked ? colors.secondary : '#151724'} stopOpacity="1"/>
        </linearGradient>

        {/* Shine overlay */}
        <linearGradient id={`shine-${idSuffix}`} x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="white" stopOpacity={unlocked ? '0.12' : '0.03'}/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>

        {/* Border gradient */}
        <linearGradient id={`border-${idSuffix}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={unlocked ? colors.primary   : '#2e3350'}/>
          <stop offset="100%" stopColor={unlocked ? colors.secondary : '#1e2240'}/>
        </linearGradient>

        {/* Rarity ring for epic/legendary */}
        {(rarity === 'epic' || rarity === 'legendary') && (
          <linearGradient id={`ring-${idSuffix}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={colors.primary}   stopOpacity={unlocked ? '0.6' : '0.1'}/>
            <stop offset="50%"  stopColor={colors.secondary} stopOpacity={unlocked ? '0.8' : '0.1'}/>
            <stop offset="100%" stopColor={colors.primary}   stopOpacity={unlocked ? '0.6' : '0.1'}/>
          </linearGradient>
        )}
      </defs>

      {/* Outer rarity ring (epic/legendary only) */}
      {(rarity === 'epic' || rarity === 'legendary') && (
        <polygon
          points={hexPoints(20, 20, 19.5)}
          fill="none"
          stroke={`url(#ring-${idSuffix})`}
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      )}

      {/* Badge body */}
      <polygon
        points={hexPts}
        fill={`url(#bg-${idSuffix})`}
        stroke={`url(#border-${idSuffix})`}
        strokeWidth={rarity === 'legendary' ? '1.5' : '1'}
        strokeLinejoin="round"
      />

      {/* Shine */}
      <polygon
        points={hexPts}
        fill={`url(#shine-${idSuffix})`}
        strokeWidth="0"
      />

      {/* Icon illustration */}
      {unlocked
        ? <AchievementInner type={achievementType} rarity={rarity} />
        : (
          /* Lock icon for locked state */
          <g opacity="0.5">
            <rect x="15" y="20" width="10" height="8" rx="1.5" fill="var(--text3, #5c6380)" stroke="none"/>
            <path d="M16.5 20 L16.5 17.5 Q16.5 14 20 14 Q23.5 14 23.5 17.5 L23.5 20"
              fill="none" stroke="var(--text3, #5c6380)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="20" cy="24" r="1.5" fill="var(--bg, #0f1117)"/>
          </g>
        )
      }

      {/* Legendary sparkle dots */}
      {rarity === 'legendary' && unlocked && (
        <>
          <circle cx="7"  cy="7"  r="1" fill={colors.secondary} opacity="0.8"/>
          <circle cx="33" cy="7"  r="1" fill={colors.primary}   opacity="0.8"/>
          <circle cx="7"  cy="33" r="1" fill={colors.primary}   opacity="0.8"/>
          <circle cx="33" cy="33" r="1" fill={colors.secondary} opacity="0.8"/>
        </>
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────
   CSS keyframes (injected once by the page)
   ────────────────────────────────────────────── */
export const ACHIEVEMENT_KEYFRAMES = `
@keyframes achUnlock {
  0%   { filter: grayscale(1) brightness(0.35); transform: scale(0.9); }
  30%  { filter: grayscale(0.5) brightness(0.7); transform: scale(1.05); }
  60%  { filter: grayscale(0) brightness(1.5); transform: scale(1.12); }
  80%  { filter: grayscale(0) brightness(1.1); transform: scale(0.98); }
  100% { filter: grayscale(0) brightness(1); transform: scale(1); }
}

@keyframes achGlow {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

@media (prefers-reduced-motion: reduce) {
  @keyframes achUnlock { 0%, 100% { transform: none; filter: none; } }
  @keyframes achGlow   { 0%, 100% { opacity: 1; } }
}
`
