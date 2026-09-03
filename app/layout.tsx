import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Real Estate PA Exam',
    template: '%s | Real Estate PA Exam',
  },
  description:
    'Master the Pennsylvania Real Estate exam with 321 practice questions, flashcards, and AI-powered explanations. Available in English and Spanish.',
  keywords: ['PA real estate exam', 'Pennsylvania real estate license', 'real estate practice test'],
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f1117',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased" style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
