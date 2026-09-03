export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'user' | 'admin'
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'free_access'
  | 'none'
export type SessionType = 'quiz' | 'flashcard' | 'review' | 'exam'
export type Lang = 'en' | 'es'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          role: UserRole
          subscription_status: SubscriptionStatus
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          preferred_lang: Lang
          daily_goal: number
          exam_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      study_units: {
        Row: {
          id: number
          title_en: string
          title_es: string | null
          description_en: string | null
          description_es: string | null
          sort_order: number
          enabled: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['study_units']['Row']>
        Update: Partial<Database['public']['Tables']['study_units']['Row']>
      }
      questions: {
        Row: {
          id: string
          legacy_id: number
          unit_id: number
          question_en: string
          option_a_en: string
          option_b_en: string
          option_c_en: string
          option_d_en: string
          correct: string
          explanation_en: string | null
          page_ref: number | null
          question_es: string | null
          option_a_es: string | null
          option_b_es: string | null
          option_c_es: string | null
          option_d_es: string | null
          explanation_es: string | null
          enabled: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['questions']['Row']>
        Update: Partial<Database['public']['Tables']['questions']['Row']>
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          xp: number
          level: number
          streak_days: number
          last_study_date: string | null
          total_sessions: number
          total_questions: number
          total_correct: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_progress']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['user_progress']['Row']>
      }
      question_progress: {
        Row: {
          id: string
          user_id: string
          question_id: string
          unit_id: number
          mastery: number
          attempts: number
          correct_count: number
          last_answer: string | null
          last_correct: boolean | null
          last_answered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['question_progress']['Row']> & {
          user_id: string
          question_id: string
          unit_id: number
        }
        Update: Partial<Database['public']['Tables']['question_progress']['Row']>
      }
      flashcard_progress: {
        Row: {
          id: string
          user_id: string
          question_id: string
          box: number
          next_review_at: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['flashcard_progress']['Row']> & {
          user_id: string
          question_id: string
        }
        Update: Partial<Database['public']['Tables']['flashcard_progress']['Row']>
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: SessionType
          unit_id: number | null
          questions_answered: number
          correct: number
          score_pct: number | null
          duration_sec: number | null
          lang: Lang
          completed_at: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['study_sessions']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['study_sessions']['Row']>
      }
      access_codes: {
        Row: {
          id: string
          code: string
          type: string
          duration_days: number
          max_uses: number | null
          uses: number
          active: boolean
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['access_codes']['Row']>
        Update: Partial<Database['public']['Tables']['access_codes']['Row']>
      }
      achievements: {
        Row: {
          id: string
          key: string
          title_en: string
          title_es: string | null
          description_en: string | null
          description_es: string | null
          icon: string | null
          xp_reward: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['achievements']['Row']>
        Update: Partial<Database['public']['Tables']['achievements']['Row']>
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_achievements']['Row']> & {
          user_id: string
          achievement_id: string
        }
        Update: Partial<Database['public']['Tables']['user_achievements']['Row']>
      }
      glossary_terms: {
        Row: {
          id: string
          term_en: string
          term_es: string | null
          definition_en: string
          definition_es: string | null
          category: string | null
          unit_id: number | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['glossary_terms']['Row']>
        Update: Partial<Database['public']['Tables']['glossary_terms']['Row']>
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_sessions: {
        Args: { p_user_id: string }
        Returns: void
      }
      admin_get_stats: {
        Args: Record<string, never>
        Returns: Json
      }
    }
    Enums: {
      user_role: UserRole
      subscription_status: SubscriptionStatus
      session_type: SessionType
      lang: Lang
    }
  }
}
