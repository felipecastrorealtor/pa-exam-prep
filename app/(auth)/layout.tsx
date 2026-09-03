export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/20 via-transparent to-transparent -z-10" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100">PA Real Estate</h1>
          <p className="text-slate-500 text-sm mt-1">Exam Prep · EN / ES</p>
        </div>

        {children}
      </div>
    </div>
  )
}
