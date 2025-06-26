export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      agent_chains: {
        Row: {
          configuration: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_flows: {
        Row: {
          created_at: string
          description: string | null
          flow_data: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          flow_data?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string
          description: string | null
          downloads_count: number | null
          id: string
          is_public: boolean
          name: string
          rating_average: number | null
          rating_count: number | null
          tags: string[] | null
          team_id: string | null
          template_data: Json
          updated_at: string
          version: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          description?: string | null
          downloads_count?: number | null
          id?: string
          is_public?: boolean
          name: string
          rating_average?: number | null
          rating_count?: number | null
          tags?: string[] | null
          team_id?: string | null
          template_data: Json
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          description?: string | null
          downloads_count?: number | null
          id?: string
          is_public?: boolean
          name?: string
          rating_average?: number | null
          rating_count?: number | null
          tags?: string[] | null
          team_id?: string | null
          template_data?: Json
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          created_at: string
          first_message: string | null
          id: string
          max_tokens: number | null
          model: string | null
          name: string
          system_prompt: string
          temperature: number | null
          updated_at: string
          user_id: string | null
          voice_id: string | null
          voice_provider: string | null
        }
        Insert: {
          created_at?: string
          first_message?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name: string
          system_prompt: string
          temperature?: number | null
          updated_at?: string
          user_id?: string | null
          voice_id?: string | null
          voice_provider?: string | null
        }
        Update: {
          created_at?: string
          first_message?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string | null
          voice_id?: string | null
          voice_provider?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          call_id: string | null
          confidence: number | null
          content: string
          id: string
          speaker: string
          timestamp: string | null
        }
        Insert: {
          call_id?: string | null
          confidence?: number | null
          content: string
          id?: string
          speaker: string
          timestamp?: string | null
        }
        Update: {
          call_id?: string | null
          confidence?: number | null
          content?: string
          id?: string
          speaker?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          analytics: Json | null
          assistant_id: string | null
          call_cost: number | null
          call_summary: string | null
          campaign_id: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          duration: number | null
          ended_at: string | null
          external_id: string | null
          id: string
          intent_matched: string | null
          phone_number: string | null
          recording_url: string | null
          signalwire_call_id: string | null
          squad_id: string | null
          status: string | null
          success_score: number | null
          summary: string | null
          transcript: string | null
          transfer_reason: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analytics?: Json | null
          assistant_id?: string | null
          call_cost?: number | null
          call_summary?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          duration?: number | null
          ended_at?: string | null
          external_id?: string | null
          id?: string
          intent_matched?: string | null
          phone_number?: string | null
          recording_url?: string | null
          signalwire_call_id?: string | null
          squad_id?: string | null
          status?: string | null
          success_score?: number | null
          summary?: string | null
          transcript?: string | null
          transfer_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analytics?: Json | null
          assistant_id?: string | null
          call_cost?: number | null
          call_summary?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          duration?: number | null
          ended_at?: string | null
          external_id?: string | null
          id?: string
          intent_matched?: string | null
          phone_number?: string | null
          recording_url?: string | null
          signalwire_call_id?: string | null
          squad_id?: string | null
          status?: string | null
          success_score?: number | null
          summary?: string | null
          transcript?: string | null
          transfer_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          completed_calls: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          script_id: string | null
          status: string | null
          success_rate: number | null
          total_calls: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_calls?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          script_id?: string | null
          status?: string | null
          success_rate?: number | null
          total_calls?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_calls?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          script_id?: string | null
          status?: string | null
          success_rate?: number | null
          total_calls?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chain_executions: {
        Row: {
          call_id: string | null
          chain_id: string
          completed_at: string | null
          current_step_id: string | null
          error_message: string | null
          execution_log: Json | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          call_id?: string | null
          chain_id: string
          completed_at?: string | null
          current_step_id?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          call_id?: string | null
          chain_id?: string
          completed_at?: string | null
          current_step_id?: string | null
          error_message?: string | null
          execution_log?: Json | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_executions_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_executions_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_executions_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "agent_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_executions_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "chain_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chain_executions_call_id"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chain_executions_call_id"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chain_executions_chain_id"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "agent_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_steps: {
        Row: {
          agent_id: string | null
          chain_id: string
          conditions: Json | null
          created_at: string
          fallback_step_id: string | null
          flow_id: string | null
          id: string
          step_order: number
          timeout_seconds: number | null
        }
        Insert: {
          agent_id?: string | null
          chain_id: string
          conditions?: Json | null
          created_at?: string
          fallback_step_id?: string | null
          flow_id?: string | null
          id?: string
          step_order: number
          timeout_seconds?: number | null
        }
        Update: {
          agent_id?: string | null
          chain_id?: string
          conditions?: Json | null
          created_at?: string
          fallback_step_id?: string | null
          flow_id?: string | null
          id?: string
          step_order?: number
          timeout_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chain_steps_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_steps_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "agent_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chain_steps_fallback_step_id_fkey"
            columns: ["fallback_step_id"]
            isOneToOne: false
            referencedRelation: "chain_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chain_steps_agent_id"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chain_steps_chain_id"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "agent_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chain_steps_flow_id"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "agent_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          campaign_id: string | null
          company: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          id: string
          name: string
          phone: string
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name: string
          phone: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          company?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          id?: string
          name?: string
          phone?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_logs: {
        Row: {
          call_id: string | null
          id: string
          message: string
          metadata: Json | null
          speaker: string
          timestamp: string
        }
        Insert: {
          call_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          speaker: string
          timestamp?: string
        }
        Update: {
          call_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          speaker?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      provider_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          provider: string
          user_id: string | null
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          provider: string
          user_id?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          provider?: string
          user_id?: string | null
        }
        Relationships: []
      }
      squads: {
        Row: {
          configuration: Json
          created_at: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_end: string | null
          subscription_start: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: string
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          billing_email: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          subscription_tier: string | null
          updated_at: string
        }
        Insert: {
          billing_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Update: {
          billing_email?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          subscription_tier?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      template_reviews: {
        Row: {
          created_at: string
          id: string
          rating: number
          review_text: string | null
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_reviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agent_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          api_key: string
          created_at: string
          id: string
          organization_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          api_key?: string
          created_at?: string
          id?: string
          organization_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          organization_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      voice_agents: {
        Row: {
          created_at: string
          first_message: string | null
          id: string
          max_tokens: number | null
          model: string | null
          name: string
          system_prompt: string
          temperature: number | null
          updated_at: string
          user_id: string
          voice_id: string | null
          voice_provider: string | null
        }
        Insert: {
          created_at?: string
          first_message?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name: string
          system_prompt: string
          temperature?: number | null
          updated_at?: string
          user_id: string
          voice_id?: string | null
          voice_provider?: string | null
        }
        Update: {
          created_at?: string
          first_message?: string | null
          id?: string
          max_tokens?: number | null
          model?: string | null
          name?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
          user_id?: string
          voice_id?: string | null
          voice_provider?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          call_id: string | null
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          call_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          call_id?: string | null
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_analytics_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      call_analytics_view: {
        Row: {
          analytics: Json | null
          avg_confidence: number | null
          campaign_name: string | null
          contact_company: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          duration: number | null
          ended_at: string | null
          external_id: string | null
          first_message_at: string | null
          id: string | null
          last_message_at: string | null
          message_count: number | null
          status: string | null
          summary: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_active_calls: {
        Args: { user_uuid?: string }
        Returns: {
          call_id: string
          external_id: string
          contact_name: string
          contact_phone: string
          status: string
          duration: number
          message_count: number
          last_activity: string
        }[]
      }
      get_call_transcription: {
        Args: { call_uuid: string }
        Returns: {
          speaker: string
          message: string
          confidence: number
          message_timestamp: string
        }[]
      }
      is_team_owner: {
        Args: { team_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      safe_delete_assistant: {
        Args: { assistant_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
