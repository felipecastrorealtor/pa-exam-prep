'use client'

import { useState } from 'react'
import Link from 'next/link'

type Lang = 'en' | 'es'

const A  = '#4f8ef7'
const A2 = '#7c5cfc'
const SP = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: 52, height: 52,
      background: 'rgba(79,142,247,0.07)',
      border: '1px solid rgba(79,142,247,0.18)',
      borderRadius: 14, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  )
}

function IconQuestions() {
  return (
    <IconBox>
      <svg width="26" height="26" viewBox="0 0 24 24" {...SP}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={A} strokeWidth="1.7"/>
        <rect x="9" y="3" width="6" height="4" rx="1" stroke={A} strokeWidth="1.7"/>
        <path d="M9 12l2 2 4-4" stroke={A2} strokeWidth="1.7"/>
        <line x1="9" y1="17" x2="14" y2="17" stroke={A} strokeWidth="1.5" opacity={0.55}/>
      </svg>
    </IconBox>
  )
}

function IconFlashcards() {
  return (
    <IconBox>
      <svg width="26" height="26" viewBox="0 0 24 24" {...SP}>
        <rect x="3" y="8" width="15" height="11" rx="2" stroke={A} strokeWidth="1.7"/>
        <path d="M6 8V6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-1" stroke={A} strokeWidth="1.7" opacity={0.4}/>
        <line x1="7" y1="13" x2="14" y2="13" stroke={A} strokeWidth="1.5"/>
        <line x1="7" y1="16" x2="11" y2="16" stroke={A} strokeWidth="1.5" opacity={0.55}/>
      </svg>
    </IconBox>
  )
}

function IconAI() {
  return (
    <IconBox>
      <svg width="26" height="26" viewBox="0 0 24 24" {...SP}>
        <path d="M12 3l2.2 5.8H20l-5.1 3.7 2 6.3-5.1-3.7-5.1 3.7 2-6.3L4 8.8h5.8L12 3z"
          stroke={A} strokeWidth="1.6" fill="rgba(79,142,247,0.06)"/>
        <path d="M20 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"
          stroke={A2} strokeWidth="1.3" fill="rgba(124,92,252,0.08)"/>
      </svg>
    </IconBox>
  )
}

function IconBilingual() {
  return (
    <IconBox>
      <svg width="26" height="26" viewBox="0 0 24 24" {...SP}>
        <circle cx="12" cy="12" r="9" stroke={A} strokeWidth="1.7"/>
        <line x1="3.5" y1="12" x2="20.5" y2="12" stroke={A} strokeWidth="1.4" opacity={0.45}/>
        <path d="M12 3c-2.8 3.2-4.5 5.8-4.5 9s1.7 5.8 4.5 9" stroke={A} strokeWidth="1.7"/>
        <path d="M12 3c2.8 3.2 4.5 5.8 4.5 9s-1.7 5.8-4.5 9" stroke={A} strokeWidth="1.4" opacity={0.4}/>
      </svg>
    </IconBox>
  )
}

function IconProgress() {
  return (
    <IconBox>
      <svg width="26" height="26" viewBox="0 0 24 24" {...SP}>
        <line x1="3" y1="21" x2="21" y2="21" stroke={A} strokeWidth="1.7"/>
        <rect x="4"  y="15" width="4" height="6" rx="1" stroke={A} strokeWidth="1.6" fill="rgba(79,142,247,0.12)"/>
        <rect x="10" y="10" width="4" height="11" rx="1" stroke={A} strokeWidth="1.6" fill="rgba(79,142,247,0.22)"/>
        <rect x="16" y="5"  width="4" height="16" rx="1" stroke={A} strokeWidth="1.6" fill="rgba(79,142,247,0.33)"/>
      </svg>
    </IconBox>
  )
}

function IconSync() {
  return (
    <IconBox>
      <svg width="26" height="26" viewBox="0 0 24 24" {...SP}>
        <rect x="2" y="6" width="13" height="9" rx="1.5" stroke={A} strokeWidth="1.7"/>
        <line x1="1" y1="18" x2="16" y2="18" stroke={A} strokeWidth="1.7" opacity={0.55}/>
        <rect x="16.5" y="10" width="5.5" height="9.5" rx="1.5" stroke={A} strokeWidth="1.7" opacity={0.7}/>
        <path d="M18 8l2-2 2 2" stroke={A2} strokeWidth="1.5"/>
        <line x1="20" y1="6" x2="20" y2="10.5" stroke={A2} strokeWidth="1.5"/>
      </svg>
    </IconBox>
  )
}

function IconCheck({ light = false }: { light?: boolean }) {
  const c  = light ? 'rgba(255,255,255,0.9)' : '#22c55e'
  const bg = light ? 'rgba(255,255,255,0.12)' : 'rgba(34,197,94,0.1)'
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8.5" cy="8.5" r="7.5" stroke={c} strokeWidth="1.3" fill={bg}/>
      <path d="M5.5 8.5l2.5 2.5 4-4" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const ICON_MAP: Record<string, React.ComponentType> = {
  questions: IconQuestions,
  flashcards: IconFlashcards,
  ai: IconAI,
  bilingual: IconBilingual,
  progress: IconProgress,
  sync: IconSync,
}

const UNITS_EN = [
  'Real Property vs. Personal Property','Property Rights & Interests',
  'Encumbrances, Liens & Easements','Transfer of Title & Deeds',
  'Contracts & Agency','Financing & Mortgages',
  'Leases & Property Management','Valuation & Appraisal',
  'Land Use & Zoning','Fair Housing Laws','PA License Law','Math & Calculations',
]
const UNITS_ES = [
  'Propiedad Real vs. Propiedad Personal','Derechos e Intereses de Propiedad',
  'Gravámenes, Embargos y Servidumbres','Transferencia de Título y Escrituras',
  'Contratos y Agencia','Financiamiento e Hipotecas',
  'Arrendamientos y Gestión de Propiedades','Valuación y Tasación',
  'Uso del Suelo y Zonificación','Leyes de Vivienda Justa',
  'Ley de Licencias de PA','Matemáticas y Cálculos',
]

type Feature = { icon: string; title: string; desc: string }

const FEATURES_EN: Feature[] = [
  { icon: 'questions', title: '440 Practice Questions',    desc: 'Every question from the PA exam blueprint, with detailed explanations and page references.' },
  { icon: 'flashcards', title: 'Smart Flashcards',         desc: "Leitner spaced-repetition system — focuses on what you don't know until you master it." },
  { icon: 'ai',         title: 'AI Explanations',          desc: 'Stuck on a concept? Ask the AI tutor for a plain-English breakdown, powered by Gemini.' },
  { icon: 'bilingual',  title: 'Bilingual — EN & ES',      desc: 'Full Spanish translation of every question, option, and explanation. Switch languages instantly.' },
  { icon: 'progress',   title: 'Progress Tracking',        desc: 'Mastery levels per question, XP, daily streaks, and achievement badges to keep you motivated.' },
  { icon: 'sync',       title: 'Cross-Device Sync',        desc: 'Study on your phone during lunch, continue on your laptop at night. All in sync.' },
]
const FEATURES_ES: Feature[] = [
  { icon: 'questions', title: '440 Preguntas de Práctica',       desc: 'Cada pregunta del esquema del examen de PA, con explicaciones detalladas y referencias de página.' },
  { icon: 'flashcards', title: 'Flashcards Inteligentes',         desc: 'Sistema Leitner de repetición espaciada — se enfoca en lo que no sabes hasta que lo dominas.' },
  { icon: 'ai',         title: 'Explicaciones con IA',            desc: '¿Atascado en un concepto? Pídele al tutor de IA una explicación clara, impulsado por Gemini.' },
  { icon: 'bilingual',  title: 'Bilingüe — EN y ES',             desc: 'Traducción completa al español de cada pregunta, opción y explicación. Cambia de idioma al instante.' },
  { icon: 'progress',   title: 'Seguimiento de Progreso',        desc: 'Niveles de dominio por pregunta, XP, rachas diarias e insignias de logros para mantenerte motivado.' },
  { icon: 'sync',       title: 'Sincronización Multidispositivo', desc: 'Estudia en tu celular durante el almuerzo, continúa en tu laptop de noche. Todo sincronizado.' },
]

const T = {
  en: {
    navSignIn: 'Sign in', navSignUp: 'Sign up',
    heroBadge: '7-day free trial · No credit card required',
    heroH1a: 'Get Ready to Pass the', heroH1b: 'PA Real Estate Exam',
    heroSub: '440 practice questions with bilingual explanations, spaced-repetition flashcards, AI tutoring, and progress tracking — everything you need to walk in confident.',
    heroCta: 'Start 7-day free trial →', heroSignIn: 'Sign in',
    heroPriceNote: '$20/month after trial · Cancel anytime',
    statsQ: 'Practice questions', statsU: 'Exam units covered', statsB: 'Bilingual EN + ES',
    featHeading: 'Everything you need to pass',
    featSub: 'Built specifically for the Pennsylvania Real Estate exam. No fluff, just what works.',
    features: FEATURES_EN,
    unitsHeading: 'All 22 exam units covered',
    unitsSub: 'Matching the official PA Real Estate exam blueprint',
    unitsMore: '…and 10 more units', units: UNITS_EN,
    pricingHeading: 'Simple pricing', pricingSub: 'One plan. Everything included. Cancel anytime.',
    freePlan: 'Free Trial', freeDuration: '7 days', freeNote: 'No credit card required',
    freeFeatures: ['All 440 questions','Flashcards & glossary','Progress tracking','Bilingual EN/ES'],
    freeCta: 'Start free →',
    paidPlan: 'Monthly', paidPrice: '$20', paidPer: '/month', paidBadge: 'Most popular',
    paidFeatures: ['Everything in free trial','AI explanations (Gemini)','Unlimited sessions','Cross-device sync'],
    paidCta: 'Start 7-day trial →',
    accessCode: 'Have an access code?', accessCodeLink: 'Enter it at registration',
    ctaHeading: 'Ready to pass your exam?',
    ctaSub: 'Join students preparing for the Pennsylvania Real Estate license exam. Start your free trial today — no credit card needed.',
    ctaBtn: 'Get started free →',
    footerSignIn: 'Sign in', footerSubscribe: 'Subscribe',
  },
  es: {
    navSignIn: 'Iniciar sesión', navSignUp: 'Registrarse',
    heroBadge: 'Prueba de 7 días · Sin tarjeta de crédito',
    heroH1a: 'Prepárate para Pasar el', heroH1b: 'Examen Inmobiliario de PA',
    heroSub: '440 preguntas de práctica con explicaciones bilingües, flashcards de repetición espaciada, tutoría con IA y seguimiento de progreso — todo lo que necesitas para entrar con confianza.',
    heroCta: 'Comenzar prueba de 7 días →', heroSignIn: 'Iniciar sesión',
    heroPriceNote: '$20/mes después de la prueba · Cancela en cualquier momento',
    statsQ: 'Preguntas de práctica', statsU: 'Unidades del examen', statsB: 'Bilingüe EN + ES',
    featHeading: 'Todo lo que necesitas para aprobar',
    featSub: 'Creado específicamente para el examen inmobiliario de Pensilvania. Sin relleno, solo lo que funciona.',
    features: FEATURES_ES,
    unitsHeading: 'Las 22 unidades del examen cubiertas',
    unitsSub: 'Según el esquema oficial del examen inmobiliario de PA',
    unitsMore: '…y 10 unidades más', units: UNITS_ES,
    pricingHeading: 'Precios simples', pricingSub: 'Un plan. Todo incluido. Cancela en cualquier momento.',
    freePlan: 'Prueba Gratuita', freeDuration: '7 días', freeNote: 'Sin tarjeta de crédito requerida',
    freeFeatures: ['Las 440 preguntas','Flashcards y glosario','Seguimiento de progreso','Bilingüe EN/ES'],
    freeCta: 'Comenzar gratis →',
    paidPlan: 'Mensual', paidPrice: '$20', paidPer: '/mes', paidBadge: 'Más popular',
    paidFeatures: ['Todo en la prueba gratuita','Explicaciones con IA (Gemini)','Sesiones ilimitadas','Sincronización multidispositivo'],
    paidCta: 'Comenzar prueba de 7 días →',
    accessCode: '¿Tienes un código de acceso?', accessCodeLink: 'Ingrésalo al registrarte',
    ctaHeading: '¿Listo para pasar tu examen?',
    ctaSub: 'Únete a los estudiantes que se preparan para el examen de licencia inmobiliaria de Pensilvania. Comienza tu prueba gratuita hoy — sin tarjeta de crédito.',
    ctaBtn: 'Comenzar gratis →',
    footerSignIn: 'Iniciar sesión', footerSubscribe: 'Suscribirse',
  },
}

export default function LandingContent() {
  const [lang, setLang] = useState<Lang>('en')
  const t = T[lang]
  const year = new Date().getFullYear()

  return (
    <div style={{ minHeight: '100vh', background: '#0a0d14', color: '#f1f5f9' }}>
      <style>{`
        @keyframes lpulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .lnav-link:hover { color:#f1f5f9!important }
        .lcard:hover { border-color:rgba(255,255,255,.16)!important; transform:translateY(-2px) }
        .lbtn-ghost:hover { border-color:rgba(255,255,255,.3)!important }
        .lbtn-primary:hover { background:#6ba3f8!important }
        .lbtn-white:hover { background:#e0eaff!important }
        .lfooter-link:hover { color:#94a3b8!important }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(10,13,20,.88)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
      }}>
        <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Real Estate PA Exam</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* EN|ES toggle — always visible */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'rgba(79,142,247,.08)', border: '1px solid rgba(79,142,247,.25)',
                borderRadius: 8, padding: '5px 11px',
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                color: A, letterSpacing: '0.06em',
              }}
              title="Switch language / Cambiar idioma"
            >
              <span style={{ opacity: lang === 'en' ? 1 : 0.38 }}>EN</span>
              <span style={{ color: 'rgba(79,142,247,.35)', margin: '0 3px' }}>|</span>
              <span style={{ opacity: lang === 'es' ? 1 : 0.38 }}>ES</span>
            </button>

          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 896, margin: '0 auto', padding: '96px 20px 80px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(79,142,247,.1)', border: '1px solid rgba(79,142,247,.3)', color: '#93c5fd', fontSize: '0.75rem', fontWeight: 700, padding: '6px 18px', borderRadius: 999, marginBottom: 36 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#60a5fa', animation: 'lpulse 2s ease-in-out infinite' }} />
          {t.heroBadge}
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.75rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.08, color: '#fff', marginBottom: 24 }}>
          {t.heroH1a}{' '}
          <span style={{ background: `linear-gradient(90deg, ${A}, ${A2})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {t.heroH1b}
          </span>
        </h1>
        <p style={{ fontSize: 'clamp(.98rem, 2vw, 1.18rem)', color: '#94a3b8', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.72 }}>{t.heroSub}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 20 }}>
          <Link href="/register" className="lbtn-primary" style={{ background: A, color: '#fff', fontSize: '1rem', fontWeight: 700, padding: '14px 34px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 28px rgba(79,142,247,.32)', transition: 'background .15s' }}>{t.heroCta}</Link>
          <Link href="/login" className="lbtn-ghost" style={{ border: '1px solid rgba(255,255,255,.14)', color: '#cbd5e1', fontSize: '1rem', fontWeight: 600, padding: '14px 34px', borderRadius: 14, textDecoration: 'none', transition: 'border-color .15s' }}>{t.heroSignIn}</Link>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#475569' }}>{t.heroPriceNote}</p>
      </section>

      {/* Stats */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '32px 20px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
          {([{ val: '440', label: t.statsQ }, { val: '22', label: t.statsU }, { val: '100%', label: t.statsB }] as const).map(({ val, label }, i) => (
            <div key={label} style={{ textAlign: 'center', padding: '0 16px', borderRight: i < 2 ? '1px solid rgba(255,255,255,.07)' : 'none' }}>
              <p style={{ fontSize: 'clamp(1.8rem,4vw,2.4rem)', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', margin: 0 }}>{val}</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 1152, margin: '0 auto', padding: '96px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(1.7rem,4vw,2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>{t.featHeading}</h2>
          <p style={{ color: '#64748b', maxWidth: 440, margin: '0 auto', lineHeight: 1.65 }}>{t.featSub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          {t.features.map(({ icon, title, desc }) => {
            const Icon = ICON_MAP[icon]
            return (
              <div key={icon} className="lcard" style={{ background: '#111520', border: '1px solid rgba(255,255,255,.07)', borderRadius: 20, padding: '24px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'border-color .2s, transform .2s', cursor: 'default' }}>
                <Icon />
                <h3 style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1.02rem', margin: 0 }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Units */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ maxWidth: 896, margin: '0 auto', padding: '64px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>{t.unitsHeading}</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t.unitsSub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
            {t.units.map((unit, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: '#94a3b8' }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, background: 'rgba(79,142,247,.08)', border: '1px solid rgba(79,142,247,.2)', borderRadius: 6, color: A, fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                {unit}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: '#475569' }}>
              <span style={{ flexShrink: 0, width: 24, height: 24, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, color: '#475569', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
              {t.unitsMore}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 896, margin: '0 auto', padding: '96px 20px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <h2 style={{ fontSize: 'clamp(1.7rem,4vw,2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 12 }}>{t.pricingHeading}</h2>
          <p style={{ color: '#64748b' }}>{t.pricingSub}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, maxWidth: 640, margin: '0 auto 32px' }}>
          <div style={{ background: '#111520', border: '1px solid rgba(255,255,255,.1)', borderRadius: 24, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t.freePlan}</p>
              <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{t.freeDuration}</p>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{t.freeNote}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {t.freeFeatures.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: '#94a3b8' }}><IconCheck /> {f}</div>
              ))}
            </div>
            <Link href="/register" className="lbtn-ghost" style={{ display: 'block', textAlign: 'center', border: '1px solid rgba(255,255,255,.15)', color: '#f1f5f9', fontWeight: 700, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', transition: 'border-color .15s' }}>{t.freeCta}</Link>
          </div>
          <div style={{ background: `linear-gradient(135deg, ${A}, ${A2})`, borderRadius: 24, padding: 32, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.2)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>{t.paidBadge}</div>
            <div>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{t.paidPlan}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{t.paidPrice}</p>
                <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '0.875rem' }}>{t.paidPer}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {t.paidFeatures.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'rgba(255,255,255,.9)' }}><IconCheck light /> {f}</div>
              ))}
            </div>
            <Link href="/register" className="lbtn-white" style={{ display: 'block', textAlign: 'center', background: '#fff', color: A2, fontWeight: 700, padding: '12px 24px', borderRadius: 12, textDecoration: 'none', transition: 'background .15s' }}>{t.paidCta}</Link>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#475569' }}>
          {t.accessCode}{' '}
          <Link href="/register" style={{ color: A, textDecoration: 'none', fontWeight: 500 }}>{t.accessCodeLink}</Link>.
        </p>
      </section>

      {/* Final CTA */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.02)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.7rem,4vw,2.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>{t.ctaHeading}</h2>
          <p style={{ color: '#64748b', marginBottom: 36, lineHeight: 1.72 }}>{t.ctaSub}</p>
          <Link href="/register" className="lbtn-primary" style={{ display: 'inline-block', background: A, color: '#fff', fontWeight: 700, fontSize: '1.05rem', padding: '16px 40px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 28px rgba(79,142,247,.32)', transition: 'background .15s' }}>{t.ctaBtn}</Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '28px 20px' }}>
        <div style={{ maxWidth: 896, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: '0.875rem', color: '#475569' }}>
          <p style={{ margin: 0 }}>© {year} Real Estate PA Exam</p>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link href="/login"     className="lfooter-link" style={{ color: '#475569', textDecoration: 'none', transition: 'color .15s' }}>{t.footerSignIn}</Link>
            <Link href="/subscribe" className="lfooter-link" style={{ color: '#475569', textDecoration: 'none', transition: 'color .15s' }}>{t.footerSubscribe}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
