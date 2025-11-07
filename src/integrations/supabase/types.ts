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
      agent_intelligence_profiles: {
        Row: {
          average_price_point: string | null
          biggest_challenges: string[] | null
          business_consistency: string | null
          business_structure: string | null
          created_at: string | null
          database_size: string | null
          experience_level: string | null
          growth_timeline: string | null
          id: string
          learning_preference: string | null
          previous_year_transactions: number | null
          previous_year_volume: number | null
          sphere_warmth: string | null
          survey_completed_at: string | null
          updated_at: string | null
          user_id: string
          work_commitment: string | null
        }
        Insert: {
          average_price_point?: string | null
          biggest_challenges?: string[] | null
          business_consistency?: string | null
          business_structure?: string | null
          created_at?: string | null
          database_size?: string | null
          experience_level?: string | null
          growth_timeline?: string | null
          id?: string
          learning_preference?: string | null
          previous_year_transactions?: number | null
          previous_year_volume?: number | null
          sphere_warmth?: string | null
          survey_completed_at?: string | null
          updated_at?: string | null
          user_id: string
          work_commitment?: string | null
        }
        Update: {
          average_price_point?: string | null
          biggest_challenges?: string[] | null
          business_consistency?: string | null
          business_structure?: string | null
          created_at?: string | null
          database_size?: string | null
          experience_level?: string | null
          growth_timeline?: string | null
          id?: string
          learning_preference?: string | null
          previous_year_transactions?: number | null
          previous_year_volume?: number | null
          sphere_warmth?: string | null
          survey_completed_at?: string | null
          updated_at?: string | null
          user_id?: string
          work_commitment?: string | null
        }
        Relationships: []
      }
      agent_voices: {
        Row: {
          agent_type: string
          created_at: string | null
          id: string
          is_default: boolean | null
          updated_at: string | null
          user_id: string
          voice_id: string | null
          voice_name: string | null
          voice_settings: Json | null
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          updated_at?: string | null
          user_id: string
          voice_id?: string | null
          voice_name?: string | null
          voice_settings?: Json | null
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          updated_at?: string | null
          user_id?: string
          voice_id?: string | null
          voice_name?: string | null
          voice_settings?: Json | null
        }
        Relationships: []
      }
      ai_actions_log: {
        Row: {
          action_data: Json
          action_type: string
          created_at: string
          error_message: string | null
          executed_at: string
          id: string
          resource_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          action_data?: Json
          action_type: string
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          resource_url?: string | null
          status: string
          user_id: string
        }
        Update: {
          action_data?: Json
          action_type?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string
          id?: string
          resource_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_agent_conversations: {
        Row: {
          agent_type: string
          context: Json | null
          created_at: string | null
          id: string
          messages: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          context?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          context?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_prompt_configs: {
        Row: {
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_key: string
          prompt_name: string
          prompt_template: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_key: string
          prompt_name: string
          prompt_template: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_key?: string
          prompt_name?: string
          prompt_template?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      ai_tool_usage: {
        Row: {
          agent_type: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          id: string
          success: boolean
          tool_args: Json | null
          tool_name: string
          tool_result: Json | null
          user_id: string
        }
        Insert: {
          agent_type?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          success?: boolean
          tool_args?: Json | null
          tool_name: string
          tool_result?: Json | null
          user_id: string
        }
        Update: {
          agent_type?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          success?: boolean
          tool_args?: Json | null
          tool_name?: string
          tool_result?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      brand_color_palettes: {
        Row: {
          accent_color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          palette_id: string | null
          palette_name: string
          primary_color: string
          secondary_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          palette_id?: string | null
          palette_name: string
          primary_color: string
          secondary_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          palette_id?: string | null
          palette_name?: string
          primary_color?: string
          secondary_color?: string | null
          updated_at?: string | null
          user_id?: string
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
      call_logs: {
        Row: {
          call_type: string
          contact_name: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          metadata: Json | null
          notes: string | null
          phone_number: string | null
          recording_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          call_type: string
          contact_name?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          phone_number?: string | null
          recording_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          call_type?: string
          contact_name?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          phone_number?: string | null
          recording_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_templates: {
        Row: {
          created_at: string | null
          file_name: string
          file_uri: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_uri: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_uri?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_personas: {
        Row: {
          communication_style: string | null
          created_at: string | null
          decision_making_style: string | null
          description: string | null
          id: string
          is_active: boolean | null
          objection_patterns: string[] | null
          persona_key: string
          persona_name: string
          personality_traits: string[] | null
          updated_at: string | null
        }
        Insert: {
          communication_style?: string | null
          created_at?: string | null
          decision_making_style?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          objection_patterns?: string[] | null
          persona_key: string
          persona_name: string
          personality_traits?: string[] | null
          updated_at?: string | null
        }
        Update: {
          communication_style?: string | null
          created_at?: string | null
          decision_making_style?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          objection_patterns?: string[] | null
          persona_key?: string
          persona_name?: string
          personality_traits?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_packs: {
        Row: {
          category: string
          content_items: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          pack_key: string
          pack_name: string
          topic_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          content_items?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          pack_key: string
          pack_name: string
          topic_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          content_items?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          pack_key?: string
          pack_name?: string
          topic_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_packs_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "content_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      content_topics: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          outreach_call_script: string | null
          outreach_dm_template: string | null
          outreach_email: string | null
          outreach_email_subject: string | null
          prompts: Json | null
          social_feed_caption: string | null
          social_feed_graphic_url: string | null
          social_hashtags: string | null
          topic_key: string
          topic_name: string
          updated_at: string | null
          week_number: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          outreach_call_script?: string | null
          outreach_dm_template?: string | null
          outreach_email?: string | null
          outreach_email_subject?: string | null
          prompts?: Json | null
          social_feed_caption?: string | null
          social_feed_graphic_url?: string | null
          social_hashtags?: string | null
          topic_key: string
          topic_name: string
          updated_at?: string | null
          week_number?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          outreach_call_script?: string | null
          outreach_dm_template?: string | null
          outreach_email?: string | null
          outreach_email_subject?: string | null
          prompts?: Json | null
          social_feed_caption?: string | null
          social_feed_graphic_url?: string | null
          social_hashtags?: string | null
          topic_key?: string
          topic_name?: string
          updated_at?: string | null
          week_number?: number | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_connections: {
        Row: {
          connection_status: string | null
          created_at: string | null
          credentials: Json | null
          id: string
          last_sync_at: string | null
          provider: string
          sync_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_sync_at?: string | null
          provider: string
          sync_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          sync_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_actions: {
        Row: {
          action_type: string | null
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
          action_type?: string | null
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
          action_type?: string | null
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
      email_campaigns: {
        Row: {
          campaign_name: string
          created_at: string | null
          id: string
          metrics: Json | null
          recipients: Json | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          campaign_name: string
          created_at?: string | null
          id?: string
          metrics?: Json | null
          recipients?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          campaign_name?: string
          created_at?: string | null
          id?: string
          metrics?: Json | null
          recipients?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_key: string
          template_name: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_key: string
          template_name: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_key?: string
          template_name?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      external_service_connections: {
        Row: {
          connection_status: string | null
          created_at: string | null
          credentials: Json | null
          id: string
          last_sync_at: string | null
          service_name: string
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          connection_status?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_sync_at?: string | null
          service_name: string
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          connection_status?: string | null
          created_at?: string | null
          credentials?: Json | null
          id?: string
          last_sync_at?: string | null
          service_name?: string
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          created_at: string | null
          description: string | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean | null
          target_users: Json | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          target_users?: Json | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          description?: string | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          target_users?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      featured_content_packs: {
        Row: {
          category: string
          content_items: Json | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content_items?: Json | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content_items?: Json | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gane_engine_snapshots: {
        Row: {
          computed_at: string
          created_at: string
          id: string
          metrics: Json
          score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          id?: string
          metrics?: Json
          score: number
          user_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          id?: string
          metrics?: Json
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          prompt_used: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          prompt_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          prompt_used?: string | null
          title?: string | null
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
      graph_context_cache: {
        Row: {
          context: Json
          created_at: string
          expires_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context: Json
          created_at?: string
          expires_at: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          expires_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content: string
          created_at: string | null
          document_key: string
          document_type: string
          effective_date: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_key: string
          document_type: string
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_key?: string
          document_type?: string
          effective_date?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          version?: string | null
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
      market_intelligence: {
        Row: {
          created_at: string | null
          data_snapshot: Json | null
          id: string
          insights: Json | null
          market_name: string
          refreshed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_snapshot?: Json | null
          id?: string
          insights?: Json | null
          market_name: string
          refreshed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_snapshot?: Json | null
          id?: string
          insights?: Json | null
          market_name?: string
          refreshed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moro_engine_snapshots: {
        Row: {
          computed_at: string
          created_at: string
          id: string
          metrics: Json
          score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          id?: string
          metrics?: Json
          score: number
          user_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          id?: string
          metrics?: Json
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      objection_scripts: {
        Row: {
          category: string
          created_at: string | null
          difficulty: string
          id: string
          is_active: boolean | null
          is_free: boolean | null
          is_popular: boolean | null
          response: string
          situation: string
          sort_order: number | null
          tips: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          difficulty: string
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          is_popular?: boolean | null
          response: string
          situation: string
          sort_order?: number | null
          tips?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          difficulty?: string
          id?: string
          is_active?: boolean | null
          is_free?: boolean | null
          is_popular?: boolean | null
          response?: string
          situation?: string
          sort_order?: number | null
          tips?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brokerage: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          license_number: string | null
          license_state: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          brokerage?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          license_number?: string | null
          license_state?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          brokerage?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          license_number?: string | null
          license_state?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pulse_engine_snapshots: {
        Row: {
          computed_at: string
          created_at: string
          id: string
          metrics: Json
          score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          id?: string
          metrics?: Json
          score: number
          user_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          id?: string
          metrics?: Json
          score?: number
          user_id?: string
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
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_email: string
          referred_user_id: string | null
          referrer_user_id: string
          reward_granted: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_email: string
          referred_user_id?: string | null
          referrer_user_id: string
          reward_granted?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_user_id?: string
          reward_granted?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_play_analysis_reports: {
        Row: {
          areas_for_improvement: Json | null
          created_at: string | null
          detailed_feedback: string | null
          id: string
          metrics: Json | null
          overall_score: number | null
          session_id: string | null
          strengths: Json | null
          user_id: string
        }
        Insert: {
          areas_for_improvement?: Json | null
          created_at?: string | null
          detailed_feedback?: string | null
          id?: string
          metrics?: Json | null
          overall_score?: number | null
          session_id?: string | null
          strengths?: Json | null
          user_id: string
        }
        Update: {
          areas_for_improvement?: Json | null
          created_at?: string | null
          detailed_feedback?: string | null
          id?: string
          metrics?: Json | null
          overall_score?: number | null
          session_id?: string | null
          strengths?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_play_analysis_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "role_play_session_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      role_play_scenarios: {
        Row: {
          avatar_image_url: string | null
          average_duration_minutes: number | null
          category: string
          client_persona: string
          created_at: string | null
          description: string | null
          difficulty_level: string
          eleven_labs_agent_id: string | null
          eleven_labs_phone_number_id: string | null
          eleven_labs_voice_id: string | null
          first_message_override: string | null
          id: string
          initial_context: string
          is_active: boolean | null
          is_popular: boolean | null
          is_premium: boolean | null
          learning_objectives: string[] | null
          name: string
          passing_threshold: number | null
          success_criteria: string[] | null
          updated_at: string | null
        }
        Insert: {
          avatar_image_url?: string | null
          average_duration_minutes?: number | null
          category: string
          client_persona: string
          created_at?: string | null
          description?: string | null
          difficulty_level: string
          eleven_labs_agent_id?: string | null
          eleven_labs_phone_number_id?: string | null
          eleven_labs_voice_id?: string | null
          first_message_override?: string | null
          id?: string
          initial_context: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_premium?: boolean | null
          learning_objectives?: string[] | null
          name: string
          passing_threshold?: number | null
          success_criteria?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avatar_image_url?: string | null
          average_duration_minutes?: number | null
          category?: string
          client_persona?: string
          created_at?: string | null
          description?: string | null
          difficulty_level?: string
          eleven_labs_agent_id?: string | null
          eleven_labs_phone_number_id?: string | null
          eleven_labs_voice_id?: string | null
          first_message_override?: string | null
          id?: string
          initial_context?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          is_premium?: boolean | null
          learning_objectives?: string[] | null
          name?: string
          passing_threshold?: number | null
          success_criteria?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_play_session_logs: {
        Row: {
          created_at: string | null
          id: string
          scenario_id: string | null
          session_duration_seconds: number | null
          status: string | null
          transcript: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          scenario_id?: string | null
          session_duration_seconds?: number | null
          status?: string | null
          transcript?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          scenario_id?: string | null
          session_duration_seconds?: number | null
          status?: string | null
          transcript?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_play_session_logs_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "role_play_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      role_play_user_progress: {
        Row: {
          attempts: number | null
          best_score: number | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
          scenario_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          best_score?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          scenario_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          best_score?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          scenario_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_play_user_progress_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "role_play_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          action_type: string
          category: string
          created_at: string | null
          description: string | null
          display_category: string | null
          id: string
          impact_area: string | null
          is_active: boolean | null
          priority: string | null
          priority_weight: number | null
          title: string
          trigger_type: string
          trigger_value: number | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          category: string
          created_at?: string | null
          description?: string | null
          display_category?: string | null
          id?: string
          impact_area?: string | null
          is_active?: boolean | null
          priority?: string | null
          priority_weight?: number | null
          title: string
          trigger_type: string
          trigger_value?: number | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          category?: string
          created_at?: string | null
          description?: string | null
          display_category?: string | null
          id?: string
          impact_area?: string | null
          is_active?: boolean | null
          priority?: string | null
          priority_weight?: number | null
          title?: string
          trigger_type?: string
          trigger_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          client_name: string | null
          commission_amount: number | null
          created_at: string | null
          expected_close_date: string | null
          id: string
          metadata: Json | null
          notes: string | null
          property_address: string | null
          status: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_name?: string | null
          commission_amount?: number | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          property_address?: string | null
          status?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_name?: string | null
          commission_amount?: number | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          property_address?: string | null
          status?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_agent_subscriptions: {
        Row: {
          agent_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string | null
          credits_available: number | null
          credits_used: number | null
          id: string
          last_reset_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_available?: number | null
          credits_used?: number | null
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_available?: number | null
          credits_used?: number | null
          id?: string
          last_reset_at?: string | null
          updated_at?: string | null
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
        Relationships: []
      }
      user_identity_map: {
        Row: {
          clerk_id: string
          created_at: string
          internal_user_id: string
          updated_at: string
        }
        Insert: {
          clerk_id: string
          created_at?: string
          internal_user_id?: string
          updated_at?: string
        }
        Update: {
          clerk_id?: string
          created_at?: string
          internal_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_knowledge: {
        Row: {
          agent_type: string
          content: string
          created_at: string | null
          id: string
          knowledge_type: string
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          content: string
          created_at?: string | null
          id?: string
          knowledge_type: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          content?: string
          created_at?: string | null
          id?: string
          knowledge_type?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          agent_onboarding_completed: boolean | null
          call_center_onboarding_completed: boolean | null
          created_at: string | null
          id: string
          onboarding_completed: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_onboarding_completed?: boolean | null
          call_center_onboarding_completed?: boolean | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_onboarding_completed?: boolean | null
          call_center_onboarding_completed?: boolean | null
          created_at?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          activity_mode: string | null
          auto_response_enabled: boolean | null
          brand_accent_color: string | null
          brand_primary_color: string | null
          brand_secondary_color: string | null
          coaching_style: string | null
          communication_style: string | null
          content_themes: string[] | null
          created_at: string | null
          daily_reminders: boolean | null
          email_categories: string[] | null
          email_notifications: boolean | null
          id: string
          market_updates: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          weekly_reports: boolean | null
        }
        Insert: {
          activity_mode?: string | null
          auto_response_enabled?: boolean | null
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          coaching_style?: string | null
          communication_style?: string | null
          content_themes?: string[] | null
          created_at?: string | null
          daily_reminders?: boolean | null
          email_categories?: string[] | null
          email_notifications?: boolean | null
          id?: string
          market_updates?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
          weekly_reports?: boolean | null
        }
        Update: {
          activity_mode?: string | null
          auto_response_enabled?: boolean | null
          brand_accent_color?: string | null
          brand_primary_color?: string | null
          brand_secondary_color?: string | null
          coaching_style?: string | null
          communication_style?: string | null
          content_themes?: string[] | null
          created_at?: string | null
          daily_reminders?: boolean | null
          email_categories?: string[] | null
          email_notifications?: boolean | null
          id?: string
          market_updates?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_reports?: boolean | null
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
        Relationships: []
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
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
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
