export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Exported aliases for use in app code
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
export type Lang = 'en' | 'es'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: string
          preferred_lang: string
          subscription_status: string | null
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string
          display_name?: string | null
          role?: string
          preferred_lang?: string
          subscription_status?: string | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: string
          preferred_lang?: string
          subscription_status?: string | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      access_codes: {
        Row: {
          id: string
          code: string
          type: string
          duration_days: number
          max_uses: number | null
          uses_count: number
          active: boolean
          expires_at: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code?: string
          type?: string
          duration_days?: number
          max_uses?: number | null
          uses_count?: number
          active?: boolean
          expires_at?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: string
          duration_days?: number
          max_uses?: number | null
          uses_count?: number
          active?: boolean
          expires_at?: string | null
          notes?: string | null
          created_at?: string
        }
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
        Insert: {
          id?: number
          title_en?: string
          title_es?: string
          description_en?: string | null
          description_es?: string | null
          enabled?: boolean
          sort_order?: number
          display_order?: number
          is_pa_specific?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title_en?: string
          title_es?: string
          description_en?: string | null
          description_es?: string | null
          enabled?: boolean
          sort_order?: number
          display_order?: number
          is_pa_specific?: boolean
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          unit_id?: number
          legacy_id?: number
          question_en?: string
          option_a_en?: string
          option_b_en?: string
          option_c_en?: string
          option_d_en?: string
          correct?: string
          explanation_en?: string | null
          page_ref?: number | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: number
          legacy_id?: number
          question_en?: string
          option_a_en?: string
          option_b_en?: string
          option_c_en?: string
          option_d_en?: string
          correct?: string
          explanation_en?: string | null
          page_ref?: number | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          question_id: string
          question_es?: string
          option_a_es?: string
          option_b_es?: string
          option_c_es?: string
          option_d_es?: string
          explanation_es?: string | null
          updated_at?: string
        }
        Update: {
          question_id?: string
          question_es?: string
          option_a_es?: string
          option_b_es?: string
          option_c_es?: string
          option_d_es?: string
          explanation_es?: string | null
          updated_at?: string
        }
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
        Insert: {
          id?: string
          slug?: string
          term_en?: string
          definition_en?: string
          term_es?: string | null
          definition_es?: string | null
          category?: string | null
          unit_ids?: number[] | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          term_en?: string
          definition_en?: string
          term_es?: string | null
          definition_es?: string | null
          category?: string | null
          unit_ids?: number[] | null
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          user_id: string
          xp?: number
          level?: number
          daily_streak?: number
          longest_streak?: number
          last_study_date?: string | null
          today_questions?: number
          total_questions?: number
          total_correct?: number
          total_sessions?: number
          exam_date?: string | null
          daily_goal?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          xp?: number
          level?: number
          daily_streak?: number
          longest_streak?: number
          last_study_date?: string | null
          today_questions?: number
          total_questions?: number
          total_correct?: number
          total_sessions?: number
          exam_date?: string | null
          daily_goal?: number
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id: string
          question_id: string
          attempts?: number
          correct?: number
          mastery?: number
          last_answer?: string | null
          last_attempt_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          attempts?: number
          correct?: number
          mastery?: number
          last_answer?: string | null
          last_attempt_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          user_id: string
          session_type?: string
          unit_id?: number | null
          questions_answered?: number
          correct?: number
          duration_sec?: number | null
          score_pct?: number | null
          lang?: string
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: string
          unit_id?: number | null
          questions_answered?: number
          correct?: number
          duration_sec?: number | null
          score_pct?: number | null
          lang?: string
          started_at?: string
          completed_at?: string | null
        }
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
        Insert: {
          id?: string
          user_id: string
          question_id: string
          box?: number
          next_review_at?: string | null
          last_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          box?: number
          next_review_at?: string | null
          last_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
        Insert: {
          id?: string
          title_en?: string
          title_es?: string
          description_en?: string
          description_es?: string
          icon?: string
          xp_reward?: number
          condition?: Json
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title_en?: string
          title_es?: string
          description_en?: string
          description_es?: string
          icon?: string
          xp_reward?: number
          condition?: Json
          sort_order?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          user_id: string
          achievement_id: string
          unlocked_at: string
        }
        Insert: {
          user_id: string
          achievement_id: string
          unlocked_at?: string
        }
        Update: {
          user_id?: string
          achievement_id?: string
          unlocked_at?: string
        }
      }
      auth_events: {
        Row: {
          id: number
          user_id: string | null
          event: string
          properties: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          event: string
          properties?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          event?: string
          properties?: Json | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_xp: {
        Args: { p_user_id: string; p_xp: number }
        Returns: undefined
      }
      increment_sessions: {
        Args: { p_user_id: string }
        Returns: undefined
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
      user_role: string
      subscription_status: string
      access_code_type: string
    }
  }
}
