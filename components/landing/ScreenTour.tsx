'use client'

/**
 * The five app screens, rebuilt for the landing page.
 *
 * Not screenshots: these are the real UI's colours, spacing and type, drawn in
 * markup. They stay sharp on any display, weigh a few KB instead of several MB,
 * and follow the page's EN/ES switch — which a PNG could never do.
 *
 * The figures belong to one invented student about three weeks in. Believable,
 * never heroic, and marked as an example on every screen: no pass-rate claims,
 * no testimonials from people who don't exist.
 */

import Image from 'next/image'

type Lang = 'en' | 'es'

/* The app's own tokens, verbatim — this is what makes it read as the product. */
const BG = '#0f1117'
const SURFACE = '#1a1d27'
const SURFACE2 = '#22263a'
const SURFACE3 = '#2c3050'
const BORDER = '#2e3350'
const ACC = '#4f8ef7'
const ACC2 = '#7c5cfc'
const OK = '#22c55e'
const WARN = '#f59e0b'
const BAD = '#ef4444'
const TX = '#e8eaf6'
const TX2 = '#9ba3c0'
const TX3 = '#5c6380'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

const NAV_EN = ['Home', 'Study', 'Cards', 'Progress', 'Profile', 'AI']
const NAV_ES = ['Inicio', 'Estudiar', 'Tarjetas', 'Progreso', 'Perfil', 'Consultor']

function NavIcon({ i }: { i: number }) {
  const p = [
    <path key="a" d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" {...S} />,
    <path key="b" d="M4 5h7v15H4zM13 5h7v15h-7z" {...S} />,
    <g key="c"><path d="m3 8 9-4 9 4-9 4z" {...S} /><path d="m3 13 9 4 9-4" {...S} /></g>,
    <path key="d" d="M5 20V10M12 20V4M19 20v-7" {...S} />,
    <g key="e"><circle cx="12" cy="8" r="3.5" {...S} /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...S} /></g>,
    <path key="f" d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2z" {...S} />,
  ]
  return <svg width="14" height="14" viewBox="0 0 24 24" style={{ display: 'block', margin: '0 auto 3px' }}>{p[i]}</svg>
}

function Phone({ lang, tab, exampleLabel, children }: {
  lang: Lang; tab: number; exampleLabel: string; children: React.ReactNode
}) {
  const nav = lang === 'es' ? NAV_ES : NAV_EN
  return (
    <div style={{
      width: 282, borderRadius: 38, padding: 8, flexShrink: 0,
      background: 'linear-gradient(160deg,#2a2f42,#14171f 60%)',
      boxShadow: '0 22px 50px rgba(0,0,0,.5)',
    }}>
      <div style={{
        background: BG, color: TX, borderRadius: 31, overflow: 'hidden',
        height: 566, display: 'flex', flexDirection: 'column', position: 'relative',
        fontSize: 12.5, lineHeight: 1.45,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: 88, height: 18, background: '#14171f', borderRadius: '0 0 11px 11px', zIndex: 5,
        }} />

        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
          padding: '24px 12px 8px', borderBottom: `1px solid ${BORDER}`,
          background: 'rgba(26,29,39,.72)',
        }}>
          <Image src="/logo.png" alt="" width={26} height={26} style={{ flexShrink: 0 }} />
          <div style={{ lineHeight: 1.05 }}>
            <b style={{ display: 'block', fontSize: 11, fontWeight: 800, color: ACC }}>Real Estate</b>
            <span style={{ display: 'block', fontSize: 9, fontWeight: 700, color: ACC2 }}>PA Exam</span>
          </div>
          <span style={{
            marginLeft: 'auto', fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 99,
            color: ACC, border: '1px solid rgba(79,142,247,.45)',
          }}>
            {lang === 'es' ? <>EN | <b style={{ color: ACC2 }}>ES</b></> : <>EN | ES</>}
          </span>
          <span style={{
            fontSize: 8, fontWeight: 800, padding: '3px 7px', borderRadius: 99,
            color: OK, border: '1px solid rgba(34,197,94,.45)',
          }}>
            {lang === 'es' ? 'Activo' : 'Active'}
          </span>
          <span style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg,${ACC},${ACC2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10.5, fontWeight: 800, color: '#fff',
          }}>M</span>
        </div>

        {/* Screen body */}
        <div style={{
          flex: 1, overflow: 'hidden', padding: '10px 11px 8px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          {children}
        </div>

        {/* Example marker — visible, never shouty. */}
        <span style={{
          position: 'absolute', right: 11, bottom: 70, zIndex: 6,
          fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
          padding: '3px 6px', borderRadius: 5, color: '#7d86a3',
          background: 'rgba(15,17,23,.82)', border: '1px solid rgba(124,92,252,.32)',
        }}>{exampleLabel}</span>

        {/* Bottom nav */}
        <div style={{
          flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)',
          borderTop: `1px solid ${BORDER}`, background: 'rgba(26,29,39,.94)', padding: '6px 2px 8px',
        }}>
          {nav.map((n, i) => (
            <div key={n} style={{
              textAlign: 'center', fontSize: 7, fontWeight: 700,
              color: i === tab ? ACC : TX3,
            }}>
              <NavIcon i={i} />{n}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '10px 11px',
}
const cardTitle: React.CSSProperties = {
  fontSize: 8, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase',
  color: TX3, marginBottom: 7,
}
const rowBetween: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: SURFACE3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color }} />
    </div>
  )
}

function Stat({ n, label, color }: { n: string; label: string; color: string }) {
  return (
    <div style={{
      background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: '7px 3px', textAlign: 'center',
    }}>
      <b style={{ display: 'block', fontSize: 16, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{n}</b>
      <span style={{
        display: 'block', fontSize: 7.5, fontWeight: 700, letterSpacing: '.05em',
        color: TX3, textTransform: 'uppercase', marginTop: 2,
      }}>{label}</span>
    </div>
  )
}

/* ── Copy ─────────────────────────────────────────────────────────────────── */

const C = {
  en: {
    heading: 'See it before you sign up',
    sub: 'The five screens you get, with example data from a student three weeks into studying.',
    example: 'Example',
    caps: [
      'Opens on the one number that matters: how ready you are, and what is dragging you down.',
      'Twenty-two units, twenty questions each — and a badge marking what is Pennsylvania law, not national theory.',
      'The same app in Spanish. The technical term stays in English on both sides, because that is how the exam asks it.',
      'Every question carries a mastery level, so "I studied today" turns into a number that moves.',
      'The thing a textbook cannot do: answer the question behind the wrong answer, at eleven at night.',
    ],
    tabs: ['Home', 'Study', 'Flashcards · in Spanish', 'Progress', 'AI Consultant'],
    ready: 'READY', readySub: 'Almost there — shore up your weak areas', level: 'Level 4 · 1,240 XP',
    streak: 'Streak', accuracy: 'Accuracy', answered: 'Answered', total: 'Total',
    goal: "Today's Goal", daysLeft: '18 days to exam', goalCount: '14 / 20 questions',
    focus: 'Focus areas',
    quick: 'Quick practice', weak: 'Prioritise weak areas',
    scope: 'Scope', scopeVal: '★ Focus — essentials only',
    units: 'Study Units', questions: 'questions',
    mastery: 'Question mastery', mNew: 'New', mLearn: 'Learning', mImp: 'Improving', mMast: 'Mastered',
    exams: 'Mock exam history', weakAreas: 'Weak areas',
    wrong: 'wrong',
    cardsTitle: 'Flashcards', due: 'due today', glossary: 'Glossary · Unit 21',
    tapBack: 'Tap to see the term', hard: 'Hard', good: 'Good', easy: 'Easy',
    aiTitle: 'AI Consultant', aiPrompt: 'Ask about any unit…',
    q: "What's the difference between an exclusive right to sell and an exclusive agency listing?",
  },
  es: {
    heading: 'Míralo antes de registrarte',
    sub: 'Las cinco pantallas que recibes, con datos de ejemplo de una estudiante con tres semanas de estudio.',
    example: 'Ejemplo',
    caps: [
      'Abre con el número que importa: qué tan listo estás y qué te está frenando.',
      'Veintidós unidades, veinte preguntas cada una — y una insignia que marca lo que es ley de Pensilvania, no teoría nacional.',
      'La misma app en español. El término técnico se queda en inglés de los dos lados, porque así lo pregunta el examen.',
      'Cada pregunta lleva un nivel de dominio, así "hoy estudié" se vuelve un número que se mueve.',
      'Lo que un libro no puede hacer: responder la duda detrás de la respuesta equivocada, a las once de la noche.',
    ],
    tabs: ['Inicio', 'Estudiar', 'Tarjetas · en español', 'Progreso', 'Consultor IA'],
    ready: 'LISTO', readySub: '¡Casi listo! Refuerza tus áreas débiles', level: 'Nivel 4 · 1,240 XP',
    streak: 'Racha', accuracy: 'Precisión', answered: 'Respondidas', total: 'Total',
    goal: 'Meta de Hoy', daysLeft: '18 días para el examen', goalCount: '14 / 20 preguntas',
    focus: 'Áreas de enfoque',
    quick: 'Práctica rápida', weak: 'Priorizar áreas débiles',
    scope: 'Alcance', scopeVal: '★ Foco — solo esenciales',
    units: 'Unidades de Estudio', questions: 'preguntas',
    mastery: 'Maestría de preguntas', mNew: 'Nueva', mLearn: 'Aprendiendo', mImp: 'Mejorando', mMast: 'Dominada',
    exams: 'Historial de simulacros', weakAreas: 'Áreas débiles',
    wrong: 'incorrectas',
    cardsTitle: 'Tarjetas', due: 'vencen hoy', glossary: 'Glosario · Unidad 21',
    tapBack: 'Toca para ver el término', hard: 'Difícil', good: 'Bien', easy: 'Fácil',
    aiTitle: 'Consultor IA', aiPrompt: 'Pregunta sobre cualquier unidad…',
    q: '¿Cuál es la diferencia entre un exclusive right to sell y un exclusive agency listing?',
  },
}

const UNIT_NAMES = {
  en: ['Real Property and the Law', 'Land-Use Controls', 'Environmental Issues', 'Legal Descriptions', 'PA Licensing Law', 'Agency in Real Estate'],
  es: ['Propiedad Real y la Ley', 'Controles de Uso de Tierra', 'Problemas Ambientales', 'Descripciones Legales', 'Ley de Licencias de PA', 'Agencia Inmobiliaria'],
}

export default function ScreenTour({ lang }: { lang: Lang }) {
  const c = C[lang]
  const names = UNIT_NAMES[lang]

  const units = [
    { id: 1,  name: names[0], pct: 100, hit: '20/20', color: OK },
    { id: 2,  name: names[1], pct: 85,  hit: '17/20', color: OK },
    { id: 3,  name: names[2], pct: 70,  hit: '14/20', color: WARN },
    { id: 4,  name: names[3], pct: 0,   hit: null,    color: TX3 },
    { id: 12, name: names[4], pct: 45,  hit: '9/20',  color: WARN, pa: true },
    { id: 15, name: names[5], pct: 52,  hit: '11/21', color: BAD },
  ]

  return (
    <section
      id="screens"
      style={{
        borderTop: '1px solid rgba(255,255,255,.07)',
        borderBottom: '1px solid rgba(255,255,255,.07)',
        background: 'rgba(255,255,255,.02)',
      }}
    >
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '80px 0 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 20px' }}>
          <h2 style={{
            fontSize: 'clamp(1.7rem,4vw,2.5rem)', fontWeight: 800, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: 12,
          }}>{c.heading}</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 620, margin: '0 auto', lineHeight: 1.6 }}>
            {c.sub}
          </p>
        </div>

        {/* One rail, swiped on a phone, scanned on a laptop. */}
        <div
          className="ltour-rail"
          style={{
            display: 'flex', gap: 24, overflowX: 'auto', padding: '4px 20px 22px',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: '0 0 auto', width: 282, scrollSnapAlign: 'center' }}>
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10, paddingLeft: 2,
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: ACC, fontVariantNumeric: 'tabular-nums' }}>
                  0{i + 1}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
                  {c.tabs[i]}
                </span>
              </div>

              <Phone lang={i === 2 ? 'es' : lang} tab={[0, 1, 2, 3, 5][i]} exampleLabel={i === 2 ? 'Ejemplo' : c.example}>
                {i === 0 && <HomeScreen c={lang === 'es' ? C.es : C.en} />}
                {i === 1 && <StudyScreen c={c} units={units} />}
                {i === 2 && <CardsScreen />}
                {i === 3 && <ProgressScreen c={c} />}
                {i === 4 && <AiScreen c={lang === 'es' ? C.es : C.en} lang={lang} />}
              </Phone>

              <p style={{
                margin: '13px 2px 0', fontSize: 13, lineHeight: 1.55, color: '#94a3b8',
              }}>{c.caps[i]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── 01 Home ──────────────────────────────────────────────────────────────── */
function HomeScreen({ c }: { c: typeof C.en }) {
  return (
    <>
      <div style={{ ...card, textAlign: 'center', paddingTop: 12 }}>
        <svg width="104" height="104" viewBox="0 0 120 120" style={{ margin: '0 auto', display: 'block' }}
             aria-label="Exam readiness 68 percent">
          <circle cx="60" cy="60" r="50" fill="none" stroke={SURFACE2} strokeWidth="11" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="url(#tourRing)" strokeWidth="11"
                  strokeLinecap="round" strokeDasharray="214 314" transform="rotate(-90 60 60)" />
          <defs>
            <linearGradient id="tourRing" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={ACC} /><stop offset="1" stopColor={ACC2} />
            </linearGradient>
          </defs>
          <text x="60" y="58" textAnchor="middle" fill={TX} fontSize="29" fontWeight="800" fontFamily="system-ui">68%</text>
          <text x="60" y="76" textAnchor="middle" fill={TX3} fontSize="10" fontWeight="700" fontFamily="system-ui" letterSpacing="1">{c.ready}</text>
        </svg>
        <div style={{ fontSize: 10, color: TX2, marginTop: 4 }}>{c.readySub}</div>
        <div style={{ fontSize: 8.5, color: TX3, marginTop: 4 }}>{c.level}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        <Stat n="12" label={c.streak} color={WARN} />
        <Stat n="74%" label={c.accuracy} color={OK} />
        <Stat n="186" label={c.answered} color={ACC} />
      </div>

      <div style={card}>
        <div style={{ ...rowBetween, marginBottom: 6 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700 }}>{c.goal}</span>
          <span style={{ fontSize: 8.5, color: TX3 }}>{c.daysLeft}</span>
        </div>
        <Bar pct={70} color={`linear-gradient(90deg,${ACC},${ACC2})`} />
        <div style={{ fontSize: 8.5, color: TX3, marginTop: 5 }}>{c.goalCount}</div>
      </div>

      <div style={card}>
        <div style={cardTitle}>{c.focus}</div>
        {[
          ['U15 · Agency', '52%', BAD],
          ['U11 · Financing', '58%', WARN],
          ['U20 · Appraising', '61%', WARN],
        ].map(([n, p, col], k) => (
          <div key={n} style={{ ...rowBetween, marginBottom: k === 2 ? 0 : 5 }}>
            <span style={{ fontSize: 9.5 }}>{n}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: col }}>{p}</span>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── 02 Study ─────────────────────────────────────────────────────────────── */
function StudyScreen({ c, units }: {
  c: typeof C.en
  units: { id: number; name: string; pct: number; hit: string | null; color: string; pa?: boolean }[]
}) {
  return (
    <>
      <div style={card}>
        <div style={cardTitle}>{c.quick}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
          {[10, 20, 30, 40, 50].map((n, k) => (
            <span key={n} style={{
              textAlign: 'center', fontSize: 10, fontWeight: k === 0 ? 800 : 700, padding: '6px 0',
              borderRadius: 8,
              background: k === 0 ? `linear-gradient(135deg,${ACC},${ACC2})` : SURFACE2,
              border: k === 0 ? 'none' : `1px solid ${BORDER}`,
              color: k === 0 ? '#fff' : TX2,
            }}>{n}</span>
          ))}
        </div>
        <div style={{ ...rowBetween, marginTop: 8 }}>
          <span style={{ fontSize: 9.5, color: TX2 }}>{c.weak}</span>
          <span style={{ width: 28, height: 16, borderRadius: 99, background: ACC, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
            <i style={{ position: 'absolute', right: 2, top: 2, width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />
          </span>
        </div>
      </div>

      <div style={{ ...card, padding: '8px 11px' }}>
        <div style={rowBetween}>
          <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: '.08em', color: TX3, textTransform: 'uppercase' }}>
            {c.scope}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 99,
            color: WARN, background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.45)',
          }}>{c.scopeVal}</span>
        </div>
      </div>

      <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '-.01em', margin: '1px 2px -2px' }}>
        {c.units}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {units.map((u) => (
          <div key={u.id} style={{
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11,
            padding: '7px 8px', position: 'relative',
          }}>
            {u.pa && (
              <span style={{
                position: 'absolute', top: 6, right: 6, fontSize: 6, fontWeight: 800,
                letterSpacing: '.06em', padding: '2px 4px', borderRadius: 4,
                background: 'rgba(124,92,252,.16)', border: '1px solid rgba(124,92,252,.4)', color: ACC2,
              }}>PA</span>
            )}
            <div style={{ fontSize: 7, fontWeight: 800, letterSpacing: '.06em', color: TX3, textTransform: 'uppercase' }}>
              Unit {u.id}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.25, margin: '3px 0 5px' }}>{u.name}</div>
            <Bar pct={u.pct} color={u.color} />
            <div style={{ fontSize: 8, color: TX3, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
              {u.hit ? `${u.pct}% — ${u.hit}` : `20 ${c.questions}`}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/* ── 03 Flashcards — always Spanish, to show the app rather than claim it ─── */
function CardsScreen() {
  const c = C.es
  return (
    <>
      <div style={{ ...rowBetween, padding: '0 2px' }}>
        <span style={{ fontSize: 10.5, fontWeight: 800 }}>{c.cardsTitle}</span>
        <span style={{ fontSize: 9, color: TX3, fontVariantNumeric: 'tabular-nums' }}>12 / 40 · {c.due}</span>
      </div>
      <Bar pct={30} color={`linear-gradient(90deg,${ACC},${ACC2})`} />

      <div style={{
        background: 'linear-gradient(150deg,#212639,#171a26)',
        border: '1px solid #3d4470', borderRadius: 16, padding: '15px 13px',
        flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.09em', color: ACC2, textTransform: 'uppercase' }}>
          {c.glossary}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.02em', lineHeight: 1.15 }}>Escrow</div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: ACC, marginTop: -4 }}>Depósito en garantía</div>
        <hr style={{ border: 0, borderTop: `1px solid ${BORDER}`, width: '100%', margin: '2px 0' }} />
        <div style={{ fontSize: 10.5, lineHeight: 1.55, color: TX2 }}>
          Dinero o documentos que un tercero neutral retiene en nombre del comprador y del vendedor
          hasta que se cumplan las condiciones del contrato. En Pensilvania, el corredor debe
          depositarlo en una cuenta <i>escrow</i> separada de sus fondos propios.
        </div>
        <div style={{ marginTop: 'auto', fontSize: 8.5, color: TX3 }}>{c.tapBack}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {[[c.hard, BAD, 'rgba(239,68,68,.45)'], [c.good, WARN, 'rgba(245,158,11,.45)'], [c.easy, OK, 'rgba(34,197,94,.45)']].map(([label, col, bd]) => (
          <span key={label} style={{
            textAlign: 'center', fontSize: 9.5, fontWeight: 700, padding: '8px 0',
            borderRadius: 9, color: col, border: `1px solid ${bd}`,
          }}>{label}</span>
        ))}
      </div>
    </>
  )
}

/* ── 04 Progress ──────────────────────────────────────────────────────────── */
function ProgressScreen({ c }: { c: typeof C.en }) {
  const rows: [string, number, number, string, string][] = [
    [c.mNew,   96,  22, TX3,  BORDER],
    [c.mLearn, 74,  17, BAD,  'rgba(239,68,68,.4)'],
    [c.mImp,   142, 32, WARN, 'rgba(245,158,11,.4)'],
    [c.mMast,  128, 29, OK,   'rgba(34,197,94,.4)'],
  ]
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        <Stat n="186" label={c.total} color={ACC} />
        <Stat n="74%" label={c.accuracy} color={OK} />
        <Stat n="12" label={c.streak} color={WARN} />
      </div>

      <div style={card}>
        <div style={cardTitle}>{c.mastery}</div>
        {rows.map(([label, n, pct, col, bd], k) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: k === 3 ? 0 : 6 }}>
            <span style={{
              fontSize: 7.5, fontWeight: 800, padding: '3px 6px', borderRadius: 99,
              minWidth: 66, textAlign: 'center', color: col, border: `1px solid ${bd}`,
              background: col === TX3 ? SURFACE2 : `${col}1a`,
            }}>{label}</span>
            <span style={{ flex: 1 }}><Bar pct={pct} color={col} /></span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: TX2, minWidth: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {n}
            </span>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={cardTitle}>{c.exams}</div>
        {[['Aug 24', '62%', BAD], ['Aug 31', '71%', WARN], ['Sep 05', '78%', OK]].map(([d, s, col], k) => (
          <div key={d} style={{
            ...rowBetween, padding: '5px 0', fontSize: 9.5,
            borderBottom: k === 2 ? 'none' : `1px solid ${BORDER}`,
          }}>
            <span style={{ color: TX2 }}>{d} · 100 Q</span>
            <b style={{ color: col, fontVariantNumeric: 'tabular-nums' }}>{s}</b>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={cardTitle}>{c.weakAreas}</div>
        <div style={{ ...rowBetween, marginBottom: 5 }}>
          <span style={{ fontSize: 9.5 }}>Agency disclosure</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: BAD }}>9 {c.wrong}</span>
        </div>
        <div style={rowBetween}>
          <span style={{ fontSize: 9.5 }}>Amortization &amp; points</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: WARN }}>6 {c.wrong}</span>
        </div>
      </div>
    </>
  )
}

/* ── 05 AI ────────────────────────────────────────────────────────────────── */
function AiScreen({ c, lang }: { c: typeof C.en; lang: Lang }) {
  const es = lang === 'es'
  return (
    <>
      <div style={{ ...rowBetween, padding: '0 2px 2px' }}>
        <span style={{ fontSize: 10.5, fontWeight: 800 }}>{c.aiTitle}</span>
      </div>

      <div style={{
        borderRadius: 12, padding: '8px 10px', fontSize: 10.5, lineHeight: 1.5,
        background: `linear-gradient(135deg,${ACC},${ACC2})`, color: '#fff', marginLeft: 28,
      }}>{c.q}</div>

      <div style={{
        borderRadius: 12, padding: '9px 10px', fontSize: 10.5, lineHeight: 1.5,
        background: SURFACE, border: `1px solid ${BORDER}`, color: TX2, marginRight: 10,
      }}>
        {es ? (
          <>Los dos son listados exclusivos con un solo corredor. La diferencia está en{' '}
            <b style={{ color: TX }}>quién paga cuando el vendedor consigue al comprador.</b></>
        ) : (
          <>Both are exclusive listings with one broker. The difference is{' '}
            <b style={{ color: TX }}>who has to pay when the seller finds the buyer.</b></>
        )}
        <ul style={{ margin: '6px 0 0', paddingLeft: 14 }}>
          <li style={{ marginBottom: 4 }}>
            <b style={{ color: TX }}>Exclusive right to sell</b>{' '}
            {es
              ? '— el corredor gana la comisión sin importar quién traiga al comprador, incluido el vendedor.'
              : '— the broker earns the commission no matter who produces the buyer, the seller included.'}
          </li>
          <li>
            <b style={{ color: TX }}>Exclusive agency</b>{' '}
            {es
              ? '— el vendedor conserva el derecho de venderla él mismo sin deber nada; cualquier otra venta sí le debe al corredor.'
              : '— the seller keeps the right to sell it themselves and owe nothing; any other sale still owes the broker.'}
          </li>
        </ul>
      </div>

      <div style={{
        marginTop: 'auto', display: 'flex', gap: 6, alignItems: 'center',
        background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 11, padding: '7px 9px',
      }}>
        <span style={{ fontSize: 9.5, color: TX3, flex: 1 }}>{c.aiPrompt}</span>
        <span style={{
          width: 21, height: 21, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${ACC},${ACC2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 12h13M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </>
  )
}
