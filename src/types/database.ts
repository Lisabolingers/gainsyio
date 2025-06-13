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
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_plan: string
          subscription_status: string
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_plan?: string
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_plan?: string
          subscription_status?: string
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          user_id: string
          platform: string
          store_name: string
          store_url: string | null
          api_credentials: Json
          is_active: boolean
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          platform: string
          store_name: string
          store_url?: string | null
          api_credentials?: Json
          is_active?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          platform?: string
          store_name?: string
          store_url?: string | null
          api_credentials?: Json
          is_active?: boolean
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          store_id: string
          external_id: string | null
          title: string
          description: string
          price: number
          currency: string
          tags: string[]
          images: Json
          status: string
          views: number
          favorites: number
          sales_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          external_id?: string | null
          title: string
          description?: string
          price?: number
          currency?: string
          tags?: string[]
          images?: Json
          status?: string
          views?: number
          favorites?: number
          sales_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          external_id?: string | null
          title?: string
          description?: string
          price?: number
          currency?: string
          tags?: string[]
          images?: Json
          status?: string
          views?: number
          favorites?: number
          sales_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      listing_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          title_template: string
          description_template: string
          tags_template: string[]
          price_template: number | null
          category: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          title_template?: string
          description_template?: string
          tags_template?: string[]
          price_template?: number | null
          category?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          title_template?: string
          description_template?: string
          tags_template?: string[]
          price_template?: number | null
          category?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      mockup_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          image_url: string
          design_areas: Json
          text_areas: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          image_url: string
          design_areas?: Json
          text_areas?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          image_url?: string
          design_areas?: Json
          text_areas?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      auto_text_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          font_family: string
          font_size: number
          font_weight: string
          text_color: string
          background_color: string
          style_settings: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          font_family?: string
          font_size?: number
          font_weight?: string
          text_color?: string
          background_color?: string
          style_settings?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          font_family?: string
          font_size?: number
          font_weight?: string
          text_color?: string
          background_color?: string
          style_settings?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      update_templates: {
        Row: {
          id: string
          user_id: string
          name: string
          template_type: string
          content_template: string
          variables: Json
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          template_type?: string
          content_template?: string
          variables?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          template_type?: string
          content_template?: string
          variables?: Json
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      store_images: {
        Row: {
          id: string
          user_id: string
          store_id: string | null
          name: string
          image_url: string
          image_type: string
          auto_apply: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_id?: string | null
          name: string
          image_url: string
          image_type?: string
          auto_apply?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_id?: string | null
          name?: string
          image_url?: string
          image_type?: string
          auto_apply?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_fonts: {
        Row: {
          id: string
          user_id: string
          font_name: string
          font_family: string
          file_url: string
          file_size: number
          font_format: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          font_name: string
          font_family: string
          file_url: string
          file_size?: number
          font_format?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          font_name?: string
          font_family?: string
          file_url?: string
          file_size?: number
          font_format?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      temporary_files: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_url: string
          file_type: string
          file_size: number
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_url: string
          file_type?: string
          file_size?: number
          expires_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_url?: string
          file_type?: string
          file_size?: number
          expires_at?: string
          created_at?: string
        }
      }
      analytics_data: {
        Row: {
          id: string
          product_id: string
          date: string
          views: number
          favorites: number
          sales: number
          revenue: number
          conversion_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          date?: string
          views?: number
          favorites?: number
          sales?: number
          revenue?: number
          conversion_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          date?: string
          views?: number
          favorites?: number
          sales?: number
          revenue?: number
          conversion_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_files: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}