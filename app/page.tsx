import type { Metadata } from 'next'
import LandingContent from '@/components/landing/LandingContent'

export const metadata: Metadata = {
  title: 'Real Estate PA Exam — Get Ready to Pass',
  description:
    'Master the Pennsylvania Real Estate exam with 440 practice questions, bilingual (EN/ES) flashcards, and AI-powered explanations. $20/month — cancel anytime.',
}

export default function LandingPage() {
  return <LandingContent />
}
