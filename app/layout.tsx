import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PA Real Estate Exam Prep',
    template: '%s | PA Real Estate Exam Prep',
  },
  description:
    'Master the Pennsylvania Real Estate exam with 321 practice questions, flashcards, and AI-powered explanations. Available in English and Spanish.',
  keywords: ['PA real estate exam', 'Pennsylvania real estate license', 'real estate practice test'],
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
