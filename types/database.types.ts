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
  | 'free_access'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'paused'
export type AccessCodeType = 'free_30d' | 'promo_15'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: UserRole
          preferred_lang: string
          subscription_status: SubscriptionStatus | null
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      access_codes: {
        Row: {
          id: string
          code: string
          type: AccessCodeType
          duration_days: number
          max_uses: number | null
          uses_count: number
          active: boolean
          expires_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['access_codes']['Row']>
        Update: Partial<Database['public']['Tables']['access_codes']['Row']>
      }
      units: {
        Row: {
          id: number
          title_en: string
          title_es: string
          description_en: string | null
          description_es: string | null
          enabled: boolean
          sort_order: number
          display_order: number
          is_pa_specific: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['units']['Row']>
        Update: Partial<Database['public']['Tables']['units']['Row']>
      }
      questions: {
        Row: {
          id: string
          unit_id: number
          legacy_id: number
          question_en: string
          option_a_en: string
          option_b_en: string
          option_c_en: string
          option_d_en: string
          correct: string
          explanation_en: string | null
          page_ref: number | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['questions']['Row']>
        Update: Partial<Database['public']['Tables']['questions']['Row']>
      }
      question_translations: {
        Row: {
          question_id: string
          question_es: string
          option_a_es: string
          option_b_es: string
          option_c_es: string
          option_d_es: string
          explanation_es: string | null
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['question_translations']['Row']> & {
          question_id: string
        }
        Update: Partial<Database['public']['Tables']['question_translations']['Row']>
      }
      glossary_terms: {
        Row: {
          id: string
          slug: string
          term_en: string
          definition_en: string
          term_es: string | null
          definition_es: string | null
          category: string | null
          unit_ids: number[] | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['glossary_terms']['Row']>
        Update: Partial<Database['public']['Tables']['glossary_terms']['Row']>
      }
      user_progress: {
        Row: {
          user_id: string
          xp: number
          level: number
          daily_streak: number
          longest_streak: number
          last_study_date: string | null
          today_questions: number
          total_questions: number
          total_correct: number
          total_sessions: number
          exam_date: string | null
          daily_goal: number
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['user_progress']['Row']> & {
          user_id: string
        }
        Update: Partial<Database['public']['Tables']['user_progress']['Row']>
      }
      question_attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          attempts: number
          correct: number
          mastery: number
          last_answer: string | null
          last_attempt_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['question_attempts']['Row']> & {
          user_id: string
          question_id: string
        }
        Update: Partial<Database['public']['Tables']['question_attempts']['Row']>
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: string
          unit_id: number | null
          questions_answered: number
          correct: number
          duration_sec: number | null
          score_pct: number | null
          lang: string
          started_at: string
          completed_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['study_sessions']['Row']> & {
          user_id: string
        }
        Update: Partial<Database['public']['Tables']['study_sessions']['Row']>
      }
      flashcard_progress: {
        Row: {
          id: string
          user_id: string
          question_id: string
          box: number
          next_review_at: string | null
          last_reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['flashcard_progress']['Row']> & {
          user_id: string
          question_id: string
        }
        Update: Partial<Database['public']['Tables']['flashcard_progress']['Row']>
      }
      achievements: {
        Row: {
          id: string
          title_en: string
          title_es: string
          description_en: string
          description_es: string
          icon: string
          xp_reward: number
          condition: Json
          sort_order: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['achievements']['Row']>
        Update: Partial<Database['public']['Tables']['achievements']['Row']>
      }
      user_achievements: {
        Row: {
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
      auth_events: {
        Row: {
          id: number
          user_id: string | null
          event: string
          properties: Json | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['auth_events']['Row']>
        Update: Partial<Database['public']['Tables']['auth_events']['Row']>
      }
    }
    Views: {}
    Functions: {
      increment_xp: {
        Args: { p_user_id: string; p_xp: number }
        Returns: void
      }
      increment_sessions: {
        Args: { p_user_id: string }
        Returns: void
      }
      get_user_stats: {
        Args: { p_user_id: string }
        Returns: Json
      }
      admin_get_stats: {
        Args: Record<string, never>
        Returns: Json
      }
      redeem_access_code: {
        Args: { p_user_id: string; p_code: string }
        Returns: Json
      }
    }
    Enums: {
      user_role: UserRole
      subscription_status: SubscriptionStatus
      access_code_type: AccessCodeType
    }
  }
}
