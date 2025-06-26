// Diese Typen entsprechen der aktuellen Supabase-Datenbankstruktur
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      news_cache: {
        Row: {
          id: string
          title: string | null
          summary: string | null
          content: string | null
          published_at: string | null // TIMESTAMPTZ
          source: string | null
          location: string | null
          keywords: string[] | null // 🔄 Legacy RSS Keywords
          original_link: string | null
          feed_type: string | null
          created_at: string // TIMESTAMPTZ
          updated_at: string // TIMESTAMPTZ
          ai_damage_category: "private" | "commercial" | "industrial" | "infrastructure" | null
          ai_summary: string | null
          ai_key_points: string[] | null
          ai_severity: "routine" | "attention" | "urgent" | null
          ai_business_interruption: boolean | null
          ai_estimated_complexity: "low" | "medium" | "high" | "critical" | null
          ai_title: string | null
          ai_location: string | null
          ai_location_confidence: "low" | "medium" | "high" | null
          ai_keywords: string[] | null // 🆕 KI-extrahierte Keywords
          ai_keyword_categories: Json | null // 🆕 Kategorisierte Keywords
          ai_keyword_confidence: Json | null // 🆕 Confidence-Scores
        }
        Insert: {
          id: string
          title?: string | null
          summary?: string | null
          content?: string | null
          published_at?: string | null
          source?: string | null
          location?: string | null
          keywords?: string[] | null
          original_link?: string | null
          feed_type?: string | null
          created_at?: string
          updated_at?: string
          ai_damage_category?: "private" | "commercial" | "industrial" | "infrastructure" | null
          ai_summary?: string | null
          ai_key_points?: string[] | null
          ai_severity?: "routine" | "attention" | "urgent" | null
          ai_business_interruption?: boolean | null
          ai_estimated_complexity?: "low" | "medium" | "high" | "critical" | null
          ai_title?: string | null
          ai_location?: string | null
          ai_location_confidence?: "low" | "medium" | "high" | null
          ai_keywords?: string[] | null
          ai_keyword_categories?: Json | null
          ai_keyword_confidence?: Json | null
        }
        Update: {
          id?: string
          title?: string | null
          summary?: string | null
          content?: string | null
          published_at?: string | null
          source?: string | null
          location?: string | null
          keywords?: string[] | null
          original_link?: string | null
          feed_type?: string | null
          created_at?: string
          updated_at?: string
          ai_damage_category?: "private" | "commercial" | "industrial" | "infrastructure" | null
          ai_summary?: string | null
          ai_key_points?: string[] | null
          ai_severity?: "routine" | "attention" | "urgent" | null
          ai_business_interruption?: boolean | null
          ai_estimated_complexity?: "low" | "medium" | "high" | "critical" | null
          ai_title?: string | null
          ai_location?: string | null
          ai_location_confidence?: "low" | "medium" | "high" | null
          ai_keywords?: string[] | null
          ai_keyword_categories?: Json | null
          ai_keyword_confidence?: Json | null
        }
        Relationships: []
      }
      deleted_news: {
        Row: {
          id: string
          deleted_at: string // TIMESTAMPTZ
        }
        Insert: {
          id: string
          deleted_at?: string
        }
        Update: {
          id?: string
          deleted_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: number
          setting_key: string
          setting_value: boolean
          updated_at: string
          created_at: string
        }
        Insert: {
          setting_key: string
          setting_value: boolean
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      app_settings_audit: {
        Row: {
          id: number
          setting_key: string
          old_value: boolean | null
          new_value: boolean
          changed_by: string | null
          changed_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          setting_key: string
          old_value?: boolean | null
          new_value: boolean
          changed_by?: string | null
          changed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: number
          setting_key?: string
          old_value?: boolean | null
          new_value?: boolean
          changed_by?: string | null
          changed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      feed_fetch_log: {
        Row: {
          id: number
          fetch_started_at: string
          fetch_completed_at: string | null
          total_feeds: number | null
          successful_feeds: number | null
          failed_feeds: number | null
          new_items_count: number | null
          updated_items_count: number | null
          ai_processed_count: number | null
          error_details: Json | null
          triggered_by: string | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          fetch_started_at: string
          fetch_completed_at?: string | null
          total_feeds?: number | null
          successful_feeds?: number | null
          failed_feeds?: number | null
          new_items_count?: number | null
          updated_items_count?: number | null
          ai_processed_count?: number | null
          error_details?: Json | null
          triggered_by?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          fetch_started_at?: string
          fetch_completed_at?: string | null
          total_feeds?: number | null
          successful_feeds?: number | null
          failed_feeds?: number | null
          new_items_count?: number | null
          updated_items_count?: number | null
          ai_processed_count?: number | null
          error_details?: Json | null
          triggered_by?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
      acquisition_cases: {
        Row: {
          id: string
          news_item_id: string | null
          case_number: string
          status: "offen" | "kontaktiert" | "kein_bedarf" | null
          priority: "low" | "medium" | "high" | "urgent" | null
          company_name: string | null
          contact_person: string | null
          phone: string | null
          email: string | null
          address: string | null
          damage_description: string | null
          estimated_damage_amount: number | null
          insurance_company: string | null
          policy_number: string | null
          damage_date: string | null // DATE
          source: string | null
          assigned_to: string | null
          probability: number | null
          expected_revenue: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          news_item_id?: string | null
          case_number: string
          status?: "offen" | "kontaktiert" | "kein_bedarf" | null
          priority?: "low" | "medium" | "high" | "urgent" | null
          company_name?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          damage_description?: string | null
          estimated_damage_amount?: number | null
          insurance_company?: string | null
          policy_number?: string | null
          damage_date?: string | null
          source?: string | null
          assigned_to?: string | null
          probability?: number | null
          expected_revenue?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          news_item_id?: string | null
          case_number?: string
          status?: "offen" | "kontaktiert" | "kein_bedarf" | null
          priority?: "low" | "medium" | "high" | "urgent" | null
          company_name?: string | null
          contact_person?: string | null
          phone?: string | null
          email?: string | null
          address?: string | null
          damage_description?: string | null
          estimated_damage_amount?: number | null
          insurance_company?: string | null
          policy_number?: string | null
          damage_date?: string | null
          source?: string | null
          assigned_to?: string | null
          probability?: number | null
          expected_revenue?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acquisition_cases_news_item_id_fkey"
            columns: ["news_item_id"]
            referencedRelation: "news_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      case_activities: {
        Row: {
          id: string
          case_id: string | null
          activity_type: "note" | "call" | "email" | "meeting" | "proposal" | "follow_up" | "document" | null
          title: string
          description: string | null
          scheduled_at: string | null
          completed_at: string | null
          is_completed: boolean | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          activity_type?: "note" | "call" | "email" | "meeting" | "proposal" | "follow_up" | "document" | null
          title: string
          description?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          is_completed?: boolean | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          activity_type?: "note" | "call" | "email" | "meeting" | "proposal" | "follow_up" | "document" | null
          title?: string
          description?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          is_completed?: boolean | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "acquisition_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          id: string
          case_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          description: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          description?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "acquisition_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_reminders: {
        Row: {
          id: string
          case_id: string | null
          reminder_date: string
          title: string
          description: string | null
          reminder_type: "call" | "email" | "meeting" | "follow_up" | "deadline" | null
          is_completed: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          case_id?: string | null
          reminder_date: string
          title: string
          description?: string | null
          reminder_type?: "call" | "email" | "meeting" | "follow_up" | "deadline" | null
          is_completed?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          case_id?: string | null
          reminder_date?: string
          title?: string
          description?: string | null
          reminder_type?: "call" | "email" | "meeting" | "follow_up" | "deadline" | null
          is_completed?: boolean | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_reminders_case_id_fkey"
            columns: ["case_id"]
            referencedRelation: "acquisition_cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
