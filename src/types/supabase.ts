export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          password_hash: string | null
          avatar_url: string | null
          role: 'student' | 'admin'
          target_exams: string[]
          created_at: string
          last_login: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          password_hash?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          target_exams?: string[]
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          password_hash?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          target_exams?: string[]
          created_at?: string
          last_login?: string | null
        }
      }
      questions: {
        Row: {
          id: string
          subject: 'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'
          topic: string
          difficulty: number
          question_text: string
          options: Json // string[]
          correct_index: number
          explanation: string
          source: 'gemini' | 'groq' | 'human' | 'pyp' | 'model'
          exam_tag: string | null
          is_verified: boolean
          times_attempted: number
          times_correct: number
          created_at: string
        }
        Insert: {
          id?: string
          subject: 'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'
          topic: string
          difficulty: number
          question_text: string
          options: Json
          correct_index: number
          explanation: string
          source?: 'gemini' | 'groq' | 'human' | 'pyp' | 'model'
          exam_tag?: string | null
          is_verified?: boolean
          times_attempted?: number
          times_correct?: number
          created_at?: string
        }
        Update: {
          id?: string
          subject?: 'Quantitative Aptitude' | 'Reasoning' | 'English' | 'General Awareness' | 'Computer Awareness'
          topic?: string
          difficulty?: number
          question_text?: string
          options?: Json
          correct_index?: number
          explanation?: string
          source?: 'gemini' | 'groq' | 'human' | 'pyp' | 'model'
          exam_tag?: string | null
          is_verified?: boolean
          times_attempted?: number
          times_correct?: number
          created_at?: string
        }
      }
      test_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          type: 'Full-Length' | 'Subject' | 'Topic' | 'Custom'
          subject: string | null
          topic: string | null
          level: number
          total_questions: number
          negative_marking: boolean
          negative_value: number
          sectional_timer: boolean
          score_pct: number | null
          correct_answers: number | null
          wrong_answers: number | null
          unattempted: number | null
          time_spent_seconds: number | null
          is_cleared: boolean | null
          is_completed: boolean
          started_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          type: 'Full-Length' | 'Subject' | 'Topic' | 'Custom'
          subject?: string | null
          topic?: string | null
          level?: number
          total_questions: number
          negative_marking?: boolean
          negative_value?: number
          sectional_timer?: boolean
          score_pct?: number | null
          correct_answers?: number | null
          wrong_answers?: number | null
          unattempted?: number | null
          time_spent_seconds?: number | null
          is_cleared?: boolean | null
          is_completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          type?: 'Full-Length' | 'Subject' | 'Topic' | 'Custom'
          subject?: string | null
          topic?: string | null
          level?: number
          total_questions?: number
          negative_marking?: boolean
          negative_value?: number
          sectional_timer?: boolean
          score_pct?: number | null
          correct_answers?: number | null
          wrong_answers?: number | null
          unattempted?: number | null
          time_spent_seconds?: number | null
          is_cleared?: boolean | null
          is_completed?: boolean
          started_at?: string
          completed_at?: string | null
        }
      }
      question_attempts: {
        Row: {
          id: string
          session_id: string
          user_id: string
          question_id: string | null
          selected_index: number | null
          is_correct: boolean | null
          time_spent_seconds: number | null
          is_marked_for_review: boolean
          attempted_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          question_id?: string | null
          selected_index?: number | null
          is_correct?: boolean | null
          time_spent_seconds?: number | null
          is_marked_for_review?: boolean
          attempted_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          question_id?: string | null
          selected_index?: number | null
          is_correct?: boolean | null
          time_spent_seconds?: number | null
          is_marked_for_review?: boolean
          attempted_at?: string
        }
      }
      user_levels: {
        Row: {
          user_id: string
          category: string
          unlocked_level: number
        }
        Insert: {
          user_id: string
          category: string
          unlocked_level?: number
        }
        Update: {
          user_id?: string
          category?: string
          unlocked_level?: number
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          type: 'notification' | 'job' | 'current_affair' | 'roadmap_topic' | 'question'
          reference_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'notification' | 'job' | 'current_affair' | 'roadmap_topic' | 'question'
          reference_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'notification' | 'job' | 'current_affair' | 'roadmap_topic' | 'question'
          reference_id?: string
          created_at?: string
        }
      }
      roadmap_progress: {
        Row: {
          user_id: string
          topic_id: string
          status: 'Locked' | 'Learning' | 'Practicing' | 'Completed'
          time_spent_minutes: number
          last_studied_at: string | null
        }
        Insert: {
          user_id: string
          topic_id: string
          status?: 'Locked' | 'Learning' | 'Practicing' | 'Completed'
          time_spent_minutes?: number
          last_studied_at?: string | null
        }
        Update: {
          user_id?: string
          topic_id?: string
          status?: 'Locked' | 'Learning' | 'Practicing' | 'Completed'
          time_spent_minutes?: number
          last_studied_at?: string | null
        }
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          target_date: string
          alert_type: '30_days' | '10_days' | '2_days' | '1_day' | null
          is_auto_generated: boolean
          is_triggered: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_date: string
          alert_type?: '30_days' | '10_days' | '2_days' | '1_day' | null
          is_auto_generated?: boolean
          is_triggered?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_date?: string
          alert_type?: '30_days' | '10_days' | '2_days' | '1_day' | null
          is_auto_generated?: boolean
          is_triggered?: boolean
          created_at?: string
        }
      }
      exam_notifications: {
        Row: {
          id: string
          organization: string
          title: string
          pdf_url: string | null
          vacancy_count: number | null
          eligibility: string | null
          notification_release: string | null
          registration_start: string | null
          registration_end: string | null
          fee_deadline: string | null
          admit_card_release: string | null
          exam_date: string | null
          result_date: string | null
          interview_date: string | null
          final_selection_date: string | null
          official_website: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization: string
          title: string
          pdf_url?: string | null
          vacancy_count?: number | null
          eligibility?: string | null
          notification_release?: string | null
          registration_start?: string | null
          registration_end?: string | null
          fee_deadline?: string | null
          admit_card_release?: string | null
          exam_date?: string | null
          result_date?: string | null
          interview_date?: string | null
          final_selection_date?: string | null
          official_website?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization?: string
          title?: string
          pdf_url?: string | null
          vacancy_count?: number | null
          eligibility?: string | null
          notification_release?: string | null
          registration_start?: string | null
          registration_end?: string | null
          fee_deadline?: string | null
          admit_card_release?: string | null
          exam_date?: string | null
          result_date?: string | null
          interview_date?: string | null
          final_selection_date?: string | null
          official_website?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      current_affairs: {
        Row: {
          id: string
          category: string
          title: string
          content: string
          summary: string
          published_at: string | null
          source_url: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          category: string
          title: string
          content: string
          summary: string
          published_at?: string | null
          source_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          title?: string
          content?: string
          summary?: string
          published_at?: string | null
          source_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
      }
      liked_formulas: {
        Row: {
          id: string
          user_id: string
          formula_id: string
          title: string
          content: string
          shortcut: string | null
          topic: string
          subject: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          formula_id: string
          title: string
          content: string
          shortcut?: string | null
          topic: string
          subject: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          formula_id?: string
          title?: string
          content?: string
          shortcut?: string | null
          topic?: string
          subject?: string
          created_at?: string
        }
      }
      user_preferences: {
        Row: {
          user_id: string
          theme: 'light' | 'dark'
          enable_notifications: boolean
          enable_calendar_sync: boolean
          target_exams: string[]
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: 'light' | 'dark'
          enable_notifications?: boolean
          enable_calendar_sync?: boolean
          target_exams?: string[]
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: 'light' | 'dark'
          enable_notifications?: boolean
          enable_calendar_sync?: boolean
          target_exams?: string[]
          updated_at?: string
        }
      }
      question_reports: {
        Row: {
          id: string
          question_id: string | null
          user_id: string
          reason: 'wrong_answer' | 'unclear_question' | 'wrong_options' | 'calculation_error' | 'other'
          description: string | null
          status: 'pending' | 'reviewed' | 'fixed'
          created_at: string
        }
        Insert: {
          id?: string
          question_id?: string | null
          user_id: string
          reason: 'wrong_answer' | 'unclear_question' | 'wrong_options' | 'calculation_error' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'fixed'
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string | null
          user_id?: string
          reason?: 'wrong_answer' | 'unclear_question' | 'wrong_options' | 'calculation_error' | 'other'
          description?: string | null
          status?: 'pending' | 'reviewed' | 'fixed'
          created_at?: string
        }
      }
      spaced_repetition: {
        Row: {
          id: string
          user_id: string
          item_id: string
          item_type: 'question' | 'formula'
          easiness_factor: number
          interval_days: number
          repetition_count: number
          next_review_date: string
          last_reviewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          item_type: 'question' | 'formula'
          easiness_factor?: number
          interval_days?: number
          repetition_count?: number
          next_review_date?: string
          last_reviewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          item_type?: 'question' | 'formula'
          easiness_factor?: number
          interval_days?: number
          repetition_count?: number
          next_review_date?: string
          last_reviewed_at?: string | null
        }
      }
      daily_goals: {
        Row: {
          user_id: string
          goal_date: string
          goal_type: 'questions' | 'minutes' | 'tests'
          goal_target: number
          goal_achieved: number
          is_completed: boolean
        }
        Insert: {
          user_id: string
          goal_date: string
          goal_type: 'questions' | 'minutes' | 'tests'
          goal_target: number
          goal_achieved?: number
          is_completed?: boolean
        }
        Update: {
          user_id?: string
          goal_date?: string
          goal_type?: 'questions' | 'minutes' | 'tests'
          goal_target?: number
          goal_achieved?: number
          is_completed?: boolean
        }
      }
      rate_limits: {
        Row: {
          key: string
          count: number
          window_start: string
        }
        Insert: {
          key: string
          count?: number
          window_start?: string
        }
        Update: {
          key?: string
          count?: number
          window_start?: string
        }
      }
      doubts: {
        Row: {
          id: string
          user_id: string
          question: string
          answer: string
          is_helpful: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          answer: string
          is_helpful?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          answer?: string
          is_helpful?: boolean | null
          created_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          name: string
          avatar_url: string | null
          total_tests: number
          avg_score: number
          best_score: number
          total_correct: number
          percentile: number
        }
      }
    }
    Functions: {}
  }
}
