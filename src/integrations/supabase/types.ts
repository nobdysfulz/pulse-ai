export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_config: {
        Row: {
          agent_type: string
          created_at: string | null
          enabled: boolean | null
          id: string
          personality_traits: string[] | null
          response_style: string | null
          updated_at: string | null
          user_id: string
          voice_id: string | null
          voice_name: string | null
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          personality_traits?: string[] | null
          response_style?: string | null
          updated_at?: string | null
          user_id: string
          voice_id?: string | null
          voice_name?: string | null
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          personality_traits?: string[] | null
          response_style?: string | null
          updated_at?: string | null
          user_id?: string
          voice_id?: string | null
          voice_name?: string | null
        }
        Relationships: []
      }
      business_plans: {
        Row: {
          annual_gci_goal: number | null
          average_commission: number | null
          conversion_rates: Json | null
          created_at: string | null
          id: string
          lead_sources: Json | null
          monthly_breakdown: Json | null
          transactions_needed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          annual_gci_goal?: number | null
          average_commission?: number | null
          conversion_rates?: Json | null
          created_at?: string | null
          id?: string
          lead_sources?: Json | null
          monthly_breakdown?: Json | null
          transactions_needed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          annual_gci_goal?: number | null
          average_commission?: number | null
          conversion_rates?: Json | null
          created_at?: string | null
          id?: string
          lead_sources?: Json | null
          monthly_breakdown?: Json | null
          transactions_needed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_actions: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          duration_minutes: number | null
          id: string
          priority: string | null
          scheduled_time: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          duration_minutes?: number | null
          id?: string
          priority?: string | null
          scheduled_time?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          duration_minutes?: number | null
          id?: string
          priority?: string | null
          scheduled_time?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          current_value: number | null
          deadline: string | null
          goal_type: string
          id: string
          status: string | null
          target_value: number | null
          timeframe: string | null
          title: string
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          goal_type: string
          id?: string
          status?: string | null
          target_value?: number | null
          timeframe?: string | null
          title: string
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          current_value?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          status?: string | null
          target_value?: number | null
          timeframe?: string | null
          title?: string
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      market_config: {
        Row: {
          average_price: number | null
          city: string | null
          created_at: string | null
          id: string
          inventory_level: string | null
          market_name: string
          market_trend: string | null
          median_dom: number | null
          state: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_price?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          inventory_level?: string | null
          market_name: string
          market_trend?: string | null
          median_dom?: number | null
          state?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_price?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          inventory_level?: string | null
          market_name?: string
          market_trend?: string | null
          median_dom?: number | null
          state?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brokerage_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          license_number: string | null
          phone: string | null
          specialization: string | null
          updated_at: string | null
          years_experience: number | null
        }
        Insert: {
          brokerage_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          license_number?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Update: {
          brokerage_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          phone?: string | null
          specialization?: string | null
          updated_at?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      pulse_scores: {
        Row: {
          activities_score: number | null
          created_at: string | null
          date: string
          id: string
          metrics: Json | null
          mindset_score: number | null
          overall_score: number
          pipeline_score: number | null
          production_score: number | null
          systems_score: number | null
          user_id: string
        }
        Insert: {
          activities_score?: number | null
          created_at?: string | null
          date: string
          id?: string
          metrics?: Json | null
          mindset_score?: number | null
          overall_score: number
          pipeline_score?: number | null
          production_score?: number | null
          systems_score?: number | null
          user_id: string
        }
        Update: {
          activities_score?: number | null
          created_at?: string | null
          date?: string
          id?: string
          metrics?: Json | null
          mindset_score?: number | null
          overall_score?: number
          pipeline_score?: number | null
          production_score?: number | null
          systems_score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_guidelines: {
        Row: {
          agent_type: string
          created_at: string | null
          guideline_category: string
          guideline_text: string
          guideline_type: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          guideline_category: string
          guideline_text: string
          guideline_type: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          guideline_category?: string
          guideline_text?: string
          guideline_type?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_guidelines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          agent_onboarding_completed: boolean | null
          completed_steps: string[] | null
          created_at: string | null
          id: string
          onboarding_completion_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_onboarding_completed?: boolean | null
          completed_steps?: string[] | null
          created_at?: string | null
          id?: string
          onboarding_completion_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_onboarding_completed?: boolean | null
          completed_steps?: string[] | null
          created_at?: string | null
          id?: string
          onboarding_completion_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_response_enabled: boolean | null
          brand_accent_color: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          communication_style: string | null
          content_themes: string[] | null
          created_at: string | null
          email_categories: string[] | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_response_enabled?: boolean | null
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          communication_style?: string | null
          content_themes?: string[] | null
          created_at?: string | null
          email_categories?: string[] | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_response_enabled?: boolean | null
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          communication_style?: string | null
          content_themes?: string[] | null
          created_at?: string | null
          email_categories?: string[] | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
