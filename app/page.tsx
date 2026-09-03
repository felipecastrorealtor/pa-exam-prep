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
      <nav className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg font-black tracking-tighter">PA</span>
            <span className="text-white font-bold tracking-tight">Exam Prep</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link href="/register"
              className="text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-amber-900/30">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-amber-600/5 rounded-full blur-2xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-24 text-center space-y-8">
          <div className="inline-flex items-center gap-2.5 bg-amber-950/60 border border-amber-700/40 text-amber-300 text-xs font-bold px-5 py-2 rounded-full tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            7-day free trial · No credit card required
          </div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[1.05]">
            Pass the{' '}
            <span className="text-amber-400">
              PA Real Estate
            </span>
            <br />
            <span className="text-slate-300">exam on your first try</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            321 practice questions with bilingual explanations, spaced-repetition flashcards,
            AI tutoring, and progress tracking — everything you need to walk in confident.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/register"
              className="group bg-amber-500 hover:bg-amber-400 text-slate-950 text-base font-black px-10 py-4 rounded-xl transition-all shadow-xl shadow-amber-900/30 hover:shadow-amber-800/40 hover:-translate-y-0.5">
              Start 7-day free trial
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/login"
              className="border border-slate-700 hover:border-amber-700/50 text-slate-300 hover:text-amber-300 text-base font-semibold px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5">
              Sign in
            </Link>
          </div>

          <p className="text-sm text-slate-600">
            $20/month after trial · Cancel anytime · $15/month with promo code
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-slate-800 bg-slate-900/40 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-10 grid grid-cols-3 divide-x divide-slate-800 text-center">
          {[
            { val: '321', label: 'Practice questions' },
            { val: '22',  label: 'Exam units covered' },
            { val: '100%', label: 'Bilingual EN + ES' },
          ].map(({ val, label }) => (
            <div key={label} className="px-4">
              <p className="text-4xl font-black text-amber-400 tabular-nums">{val}</p>
              <p className="text-sm text-slate-500 mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-28 space-y-14">
        <div className="text-center space-y-4">
          <p className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase">Built to get you licensed</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Everything you need to pass
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Built specifically for the Pennsylvania Real Estate exam. No fluff, just what works.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title}
              className="group bg-slate-900/80 border border-slate-800 hover:border-amber-700/40 rounded-2xl p-7 space-y-4 transition-all hover:-translate-y-1 hover:bg-slate-900">
              <div className="text-4xl">{icon}</div>
              <h3 className="font-bold text-white text-xl">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Units covered ── */}
      <section className="bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-20 space-y-10">
          <div className="text-center space-y-3">
            <p className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase">Full coverage</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">All 22 exam units covered</h2>
            <p className="text-slate-400 text-sm">Matching the official PA Real Estate exam blueprint</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {UNITS.map((unit, i) => (
              <div key={unit} className="flex items-center gap-3 text-sm text-slate-300 bg-slate-800/50 rounded-lg px-4 py-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 text-xs flex items-center justify-center font-black">
                  {i + 1}
                </span>
                {unit}
              </div>
            ))}
            <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-800/30 rounded-lg px-4 py-3 border border-dashed border-slate-700">
              <span className="flex-shrink-0 w-6 h-6 rounded-md bg-slate-700 text-slate-500 text-xs flex items-center justify-center font-black">
                +
              </span>
              …and 10 more units
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="max-w-4xl mx-auto px-6 py-28 space-y-12">
        <div className="text-center space-y-4">
          <p className="text-amber-500 text-xs font-bold tracking-[0.2em] uppercase">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">Simple pricing</h2>
          <p className="text-slate-400 text-lg">One plan. Everything included. Cancel anytime.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">

          {/* Free trial */}
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 space-y-6">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Free Trial</p>
              <p className="text-5xl font-black text-white mt-3">7 days</p>
              <p className="text-slate-500 text-sm mt-1.5">No credit card required</p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-400">
              {['All 321 questions', 'Flashcards & glossary', 'Progress tracking', 'Bilingual EN/ES'].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="block text-center border border-slate-600 hover:border-amber-600/50 hover:text-amber-300 text-white font-bold py-3.5 rounded-xl transition-all">
              Start free →
            </Link>
          </div>

          {/* Monthly */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 space-y-6 relative overflow-hidden shadow-2xl shadow-amber-900/40">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute top-4 right-4 bg-slate-950/30 text-amber-100 text-xs font-black px-3 py-1 rounded-full tracking-wide">
              MOST POPULAR
            </div>
            <div>
              <p className="text-xs font-bold text-amber-200 uppercase tracking-widest">Monthly</p>
              <div className="flex items-baseline gap-1 mt-3">
                <p className="text-5xl font-black text-slate-950">$20</p>
                <p className="text-amber-800 text-sm font-semibold">/month</p>
              </div>
              <p className="text-amber-800 text-sm mt-1.5 font-medium">$15/mo with promo code</p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-900 font-medium">
              {['Everything in free trial', 'AI explanations (Gemini)', 'Unlimited sessions', 'Cross-device sync'].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="font-black">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/register"
              className="block text-center bg-slate-950 text-amber-400 font-black py-3.5 rounded-xl hover:bg-slate-900 transition-all shadow-lg">
              Start 7-day trial →
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-slate-600">
          Have an access code?{' '}
          <Link href="/register" className="text-amber-500 hover:text-amber-400 font-semibold">
            Enter it at registration
          </Link>{' '}
          for 30 days free.
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden border-t border-slate-800">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-6 py-24 text-center space-y-7">
          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight">
            Ready to pass your exam?
          </h2>
          <p className="text-slate-400 text-lg">
            Join students preparing for the Pennsylvania Real Estate license exam.
            Start your free trial today — no credit card needed.
          </p>
          <Link href="/register"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-lg px-12 py-5 rounded-xl transition-all shadow-xl shadow-amber-900/30 hover:-translate-y-0.5">
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600">
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
