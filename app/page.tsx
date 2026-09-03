import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PA Real Estate Exam Prep — Pass on your first try',
  description:
    'Master the Pennsylvania Real Estate exam with 321 practice questions, bilingual (EN/ES) flashcards, and AI-powered explanations. $20/month — cancel anytime.',
}

const FEATURES = [
  {
    icon: '📝',
    title: '321 Practice Questions',
    desc: 'Every question from the PA exam blueprint, with detailed explanations and page references.',
  },
  {
    icon: '🎴',
    title: 'Smart Flashcards',
    desc: "Leitner spaced-repetition system — focuses on what you don't know until you master it.",
  },
  {
    icon: '🤖',
    title: 'AI Explanations',
    desc: 'Stuck on a concept? Ask the AI tutor for a plain-English breakdown, powered by Gemini.',
  },
  {
    icon: '🇪🇸',
    title: 'Bilingual — EN & ES',
    desc: 'Full Spanish translation of every question, option, and explanation. Switch languages instantly.',
  },
  {
    icon: '📊',
    title: 'Progress Tracking',
    desc: 'Mastery levels per question, XP, daily streaks, and achievement badges to keep you motivated.',
  },
  {
    icon: '📱',
    title: 'Cross-Device Sync',
    desc: 'Study on your phone during lunch, continue on your laptop at night. All in sync.',
  },
]

const UNITS = [
  'Real Property vs. Personal Property',
  'Property Rights & Interests',
  'Encumbrances, Liens & Easements',
  'Transfer of Title & Deeds',
  'Contracts & Agency',
  'Financing & Mortgages',
  'Leases & Property Management',
  'Valuation & Appraisal',
  'Land Use & Zoning',
  'Fair Housing Laws',
  'PA License Law',
  'Math & Calculations',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-white tracking-tight">
            PA Exam Prep
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/register"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-semibold transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-20 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs font-semibold px-4 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          7-day free trial · No credit card required
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Pass the{' '}
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            PA Real Estate
          </span>
          <br />exam on your first try
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          321 practice questions with bilingual explanations, spaced-repetition flashcards,
          AI tutoring, and progress tracking — everything you need to walk in confident.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white text-base font-bold px-8 py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/40">
            Start 7-day free trial →
          </Link>
          <Link href="/login"
            className="border border-slate-700 hover:border-slate-500 text-slate-300 text-base font-semibold px-8 py-4 rounded-xl transition-colors">
            Sign in
          </Link>
        </div>

        <p className="text-sm text-slate-500">
          $20/month after trial · Cancel anytime · $15/month with promo code
        </p>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-3 divide-x divide-slate-800 text-center">
          {[
            { val: '321', label: 'Practice questions' },
            { val: '22', label: 'Exam units covered' },
            { val: '100%', label: 'Bilingual EN + ES' },
          ].map(({ val, label }) => (
            <div key={label} className="px-4">
              <p className="text-3xl font-extrabold text-white tabular-nums">{val}</p>
              <p className="text-sm text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 py-24 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need to pass
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built specifically for the Pennsylvania Real Estate exam. No fluff, just what works.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3 hover:border-slate-600 transition-colors">
              <div className="text-3xl">{icon}</div>
              <h3 className="font-bold text-white text-lg">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Units covered ── */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">All 22 exam units covered</h2>
            <p className="text-slate-400 text-sm">Matching the official PA Real Estate exam blueprint</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {UNITS.map((unit, i) => (
              <div key={unit} className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-800 text-slate-500 text-xs flex items-center justify-center font-mono">
                  {i + 1}
                </span>
                {unit}
              </div>
            ))}
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-800 text-slate-500 text-xs flex items-center justify-center font-mono">
                +
              </span>
              …and 10 more units
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-4xl mx-auto px-4 py-24 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Simple pricing</h2>
          <p className="text-slate-400">One plan. Everything included. Cancel anytime.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">

          {/* Free trial */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Free Trial</p>
              <p className="text-4xl font-extrabold text-white mt-2">7 days</p>
              <p className="text-slate-400 text-sm mt-1">No credit card required</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-400">
              {['All 321 questions', 'Flashcards & glossary', 'Progress tracking', 'Bilingual EN/ES'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="block text-center border border-slate-600 hover:border-slate-400 text-white font-semibold py-3 rounded-xl transition-colors">
              Start free →
            </Link>
          </div>

          {/* Monthly */}
          <div className="bg-blue-600 border border-blue-500 rounded-2xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
              Most popular
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Monthly</p>
              <div className="flex items-baseline gap-1 mt-2">
                <p className="text-4xl font-extrabold text-white">$20</p>
                <p className="text-blue-200 text-sm">/month</p>
              </div>
              <p className="text-blue-200 text-sm mt-1">$15/mo with promo code</p>
            </div>
            <ul className="space-y-2 text-sm text-blue-100">
              {['Everything in free trial', 'AI explanations (Gemini)', 'Unlimited sessions', 'Cross-device sync'].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-white font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="block text-center bg-white text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Start 7-day trial →
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500">
          Have an access code?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Enter it at registration
          </Link>{' '}
          for 30 days free.
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Ready to pass your exam?
          </h2>
          <p className="text-slate-400">
            Join students preparing for the Pennsylvania Real Estate license exam.
            Start your free trial today — no credit card needed.
          </p>
          <Link href="/register"
            className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors shadow-lg shadow-blue-900/40">
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} PA Real Estate Exam Prep</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">Sign in</Link>
            <Link href="/subscribe" className="hover:text-slate-300 transition-colors">Subscribe</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
