'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface UnitRow {
  id: number
  titleEn: string
  titleEs: string | null
  isPa: boolean
  /** False = the admin took this unit out of Focus mode. */
  focusEnabled: boolean
  /** Every enabled question in the unit. */
  questionCount: number
  /** Of those, the ones marked essential — what Focus mode actually serves. */
  essentialCount: number
  answered: number
  correct: number
}

interface Props {
  units: UnitRow[]
  lang: 'en' | 'es'
  studyMode: 'complete' | 'focus'
}

const T = {
  quickTitle:  { en: 'Quick Practice',        es: 'Práctica Rápida' },
  weakToggle:  { en: 'Prioritise weak areas', es: 'Priorizar áreas débiles' },
  start:       { en: 'Start →',               es: 'Comenzar →' },

  unitTitle:   { en: 'Study by Unit',         es: 'Estudiar por Unidad' },
  allUnits:    { en: 'All units',             es: 'Todas las unidades' },
  adaptive:    { en: 'Adaptive (recommended)', es: 'Adaptativo (recomendado)' },
  onlyWeak:    { en: 'Weak questions only',   es: 'Solo preguntas débiles' },
  onlyNew:     { en: 'New questions only',    es: 'Solo preguntas nuevas' },
  randomOrder: { en: 'Random order',          es: 'Orden aleatorio' },
  studyUnit:   { en: 'Study this Unit →',     es: 'Estudiar esta Unidad →' },

  examTitle:   { en: 'Mock Exam',             es: 'Simulacro de Examen' },
  examBlurb:   {
    en: 'No feedback during the exam — just like the real thing. Full results at the end.',
    es: 'Sin feedback durante el examen — igual que el examen real. Resultados completos al finalizar.',
  },
  fullExam:    { en: 'Full exam (all units)', es: 'Examen completo (todas las unidades)' },
  startExam:   { en: 'Start Mock Exam',       es: 'Iniciar Simulacro' },

  unitsTitle:  { en: 'Study Units',           es: 'Unidades de Estudio' },
  unit:        { en: 'Unit',                  es: 'Unidad' },
  questions:   { en: 'questions',             es: 'preguntas' },
  essentials:  { en: 'essentials',            es: 'esenciales' },

  scope:       { en: 'Scope',                 es: 'Alcance' },
  complete:    { en: 'Complete — every question', es: 'Completo — todas las preguntas' },
  focus:       { en: '★ Focus — essentials only', es: '★ Foco — solo esenciales' },
  change:      { en: 'Change',                es: 'Cambiar' },

  hiddenOne:   { en: '1 unit is outside Focus mode and is not shown.',
                 es: '1 unidad está fuera del modo Foco y no se muestra.' },
  hiddenMany:  { en: '{n} units are outside Focus mode and are not shown.',
                 es: '{n} unidades están fuera del modo Foco y no se muestran.' },
  notReady:    {
    en: 'No question has been marked essential yet, so Focus mode has nothing of its own to serve — you are seeing the complete question bank.',
    es: 'Todavía no hay preguntas marcadas como esenciales, así que el modo Foco no tiene nada propio que mostrar — estás viendo el banco completo de preguntas.',
  },
}

export default function StudyLauncher({ units, lang, studyMode }: Props) {
  const router = useRouter()
  const isEs = lang === 'es'
  const t = (k: keyof typeof T) => T[k][lang]
  const unitName = (u: UnitRow) => (isEs ? u.titleEs : u.titleEn) ?? u.titleEn

  const inFocus = studyMode === 'focus'

  // Focus mode only means anything once questions are marked essential. Until
  // then the study screens fall back to the whole bank, and pretending
  // otherwise — an empty grid, zero counts — would be a lie about the content.
  const totalEssential = units.reduce((n, u) => n + u.essentialCount, 0)
  const focusActive    = inFocus && totalEssential > 0

  // What Focus actually serves. A unit the admin took out of Focus is gone from
  // this list whatever else is true — that decision does not depend on whether
  // anyone has marked a question essential yet. The essentials filter is the
  // second, separate condition, and it only applies once essentials exist.
  const visibleUnits = inFocus
    ? units.filter((u) => u.focusEnabled && (!focusActive || u.essentialCount > 0))
    : units

  const countOf = (u: UnitRow) => (focusActive ? u.essentialCount : u.questionCount)
  const hidden  = units.length - visibleUnits.length

  const [quickCount, setQuickCount] = useState(10)
  const [weakMode, setWeakMode]     = useState(false)
  const [unitSel, setUnitSel]       = useState('all')
  const [modeSel, setModeSel]       = useState('adaptive')
  const [examUnit, setExamUnit]     = useState('all')
  const [examCount, setExamCount]   = useState(30)

  const go = (path: string) => router.push(path)

  return (
    <div>
      {/* ── Quick practice ── */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {t('quickTitle')}
        </div>

        <div className="quick-options">
          {[10, 20, 30, 40, 50].map((n) => (
            <button
              key={n}
              onClick={() => setQuickCount(n)}
              className={`qcount-btn${quickCount === n ? ' active' : ''}`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="toggle-row">
          <span className="toggle-label">{t('weakToggle')}</span>
          <div
            role="switch"
            aria-checked={weakMode}
            tabIndex={0}
            onClick={() => setWeakMode((w) => !w)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setWeakMode((w) => !w) } }}
            className={`toggle-switch${weakMode ? ' on' : ''}`}
          >
            <div className="toggle-knob" />
          </div>
        </div>

        <button
          onClick={() => go(`/study/all?limit=${quickCount}&pick=${weakMode ? 'weak' : 'adaptive'}`)}
          className="btn btn-primary btn-full"
          style={{ marginTop: 10 }}
        >
          {t('start')}
        </button>
      </div>

      {/* ── Study by unit ── */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          {t('unitTitle')}
        </div>

        <select className="select" value={unitSel} onChange={(e) => setUnitSel(e.target.value)}>
          <option value="all">{t('allUnits')}</option>
          {visibleUnits.map((u) => (
            <option key={u.id} value={u.id}>U{u.id} — {unitName(u)}</option>
          ))}
        </select>

        <select className="select" value={modeSel} onChange={(e) => setModeSel(e.target.value)}>
          <option value="adaptive">{t('adaptive')}</option>
          <option value="weak">{t('onlyWeak')}</option>
          <option value="new">{t('onlyNew')}</option>
          <option value="random">{t('randomOrder')}</option>
        </select>

        <button
          onClick={() => go(`/study/${unitSel}?pick=${modeSel}`)}
          className="btn btn-primary btn-full"
        >
          {t('studyUnit')}
        </button>
      </div>

      {/* ── Mock exam ── */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          {t('examTitle')}
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>
          {t('examBlurb')}
        </p>

        <select className="select" value={examUnit} onChange={(e) => setExamUnit(e.target.value)}>
          <option value="all">{t('fullExam')}</option>
          {visibleUnits.map((u) => (
            <option key={u.id} value={u.id}>U{u.id} — {unitName(u)}</option>
          ))}
        </select>

        <div className="quick-options">
          {[30, 50, 100].map((n) => (
            <button
              key={n}
              onClick={() => setExamCount(n)}
              className={`qcount-btn${examCount === n ? ' active' : ''}`}
            >
              {n} Q
            </button>
          ))}
        </div>

        <button
          onClick={() => go(`/study/${examUnit}?mode=exam&limit=${examCount}`)}
          className="btn btn-danger btn-full"
          style={{ gap: 7 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          {t('startExam')}
        </button>
      </div>

      {/* ── Scope reminder ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700 }}>
            {t('scope')}
          </span>
          <span style={{
            padding: '5px 11px', borderRadius: 99, fontSize: '0.74rem', fontWeight: 700,
            border: inFocus ? '1px solid rgba(245,158,11,0.45)' : '1px solid rgba(79,142,247,0.45)',
            background: inFocus ? 'rgba(245,158,11,0.1)' : 'rgba(79,142,247,0.1)',
            color: inFocus ? 'var(--warning)' : 'var(--accent)',
          }}>
            {inFocus ? t('focus') : t('complete')}
          </span>
          <a href="/settings" style={{ fontSize: '0.74rem', color: 'var(--text3)', textDecoration: 'underline' }}>
            {t('change')}
          </a>
        </div>

        {/* Focus is on but nothing is marked — say so rather than showing an
            empty screen or, worse, the whole bank under a Focus badge. */}
        {inFocus && totalEssential === 0 && (
          <p style={{
            fontSize: '0.76rem', color: 'var(--warning)', lineHeight: 1.5,
            marginTop: 10, marginBottom: 0,
          }}>
            {t('notReady')}
          </p>
        )}

        {inFocus && hidden > 0 && (
          <p style={{
            fontSize: '0.76rem', color: 'var(--text3)', lineHeight: 1.5,
            marginTop: 10, marginBottom: 0,
          }}>
            {hidden === 1 ? t('hiddenOne') : t('hiddenMany').replace('{n}', String(hidden))}
          </p>
        )}
      </div>

      {/* ── Unit grid ── */}
      <div className="section-header" style={{ marginBottom: 8, marginTop: 4 }}>
        <div className="section-title">{t('unitsTitle')}</div>
      </div>

      <div className="unit-grid">
        {visibleUnits.map((u) => {
          const pct = u.answered > 0 ? Math.round((u.correct / u.answered) * 100) : 0
          const n   = countOf(u)
          return (
            <a key={u.id} href={`/study/${u.id}`} className="unit-card" style={{ position: 'relative' }}>
              {u.isPa && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.06em',
                  padding: '2px 5px', borderRadius: 4,
                  background: 'rgba(124,92,252,0.16)', border: '1px solid rgba(124,92,252,0.4)',
                  color: 'var(--accent2)',
                }}>PA</span>
              )}
              <div style={{
                fontSize: '0.62rem', color: 'var(--text3)', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {t('unit')} {u.id}
              </div>
              <div style={{
                fontSize: '0.82rem', fontWeight: 700, margin: '4px 0',
                lineHeight: 1.3, color: 'var(--text)',
              }}>
                {unitName(u)}
              </div>
              <div className="prog-bar" style={{ marginTop: 6 }}>
                <div className="prog-fill" style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)',
                }}/>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 3 }}>
                {u.answered > 0
                  ? `${pct}% — ${u.correct}/${u.answered}`
                  : `${n} ${focusActive ? t('essentials') : t('questions')}`}
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
