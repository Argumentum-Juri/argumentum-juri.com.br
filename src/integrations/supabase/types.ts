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
      annual_token_renewal_tracker: {
        Row: {
          created_at: string | null
          granted_months_this_cycle: number
          id: string
          next_token_grant_date: string
          status: string
          stripe_annual_price_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string
          tokens_per_month: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_months_this_cycle?: number
          id?: string
          next_token_grant_date: string
          status?: string
          stripe_annual_price_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id: string
          tokens_per_month: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_months_this_cycle?: number
          id?: string
          next_token_grant_date?: string
          status?: string
          stripe_annual_price_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string
          tokens_per_month?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      petition_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          file_url: string | null
          id: string
          petition_id: string
          r2_key: string | null
          size: number | null
          storage_path: string | null
          storage_provider: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          file_url?: string | null
          id?: string
          petition_id: string
          r2_key?: string | null
          size?: number | null
          storage_path?: string | null
          storage_provider?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string | null
          id?: string
          petition_id?: string
          r2_key?: string | null
          size?: number | null
          storage_path?: string | null
          storage_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "petition_attachments_petition_id_fkey"
            columns: ["petition_id"]
            isOneToOne: false
            referencedRelation: "petitions"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          petition_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          petition_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          petition_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "petition_comments_petition_id_fkey"
            columns: ["petition_id"]
            isOneToOne: false
            referencedRelation: "petitions"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          file_url: string | null
          id: string
          petition_id: string
          r2_key: string | null
          storage_path: string | null
          storage_provider: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          petition_id: string
          r2_key?: string | null
          storage_path?: string | null
          storage_provider?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          petition_id?: string
          r2_key?: string | null
          storage_path?: string | null
          storage_provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "petition_documents_petition_id_fkey"
            columns: ["petition_id"]
            isOneToOne: false
            referencedRelation: "petitions"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          is_approved: boolean | null
          petition_id: string
          reviewer_id: string | null
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          petition_id: string
          reviewer_id?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean | null
          petition_id?: string
          reviewer_id?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "petition_reviews_petition_id_fkey"
            columns: ["petition_id"]
            isOneToOne: false
            referencedRelation: "petitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petition_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      petition_settings: {
        Row: {
          accent_color: string | null
          created_at: string
          font_family: string
          font_size: string
          id: string
          letterhead_template_original_filename: string | null
          letterhead_template_r2_key: string | null
          letterhead_template_storage_provider: string | null
          letterhead_template_url: string | null
          line_spacing: string
          logo_original_filename: string | null
          logo_r2_key: string | null
          logo_storage_provider: string | null
          logo_url: string | null
          margin_size: string
          paragraph_indent: string
          petition_template_original_filename: string | null
          petition_template_r2_key: string | null
          petition_template_storage_provider: string | null
          petition_template_url: string | null
          primary_color: string | null
          updated_at: string
          use_letterhead: boolean
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          font_family?: string
          font_size?: string
          id?: string
          letterhead_template_original_filename?: string | null
          letterhead_template_r2_key?: string | null
          letterhead_template_storage_provider?: string | null
          letterhead_template_url?: string | null
          line_spacing?: string
          logo_original_filename?: string | null
          logo_r2_key?: string | null
          logo_storage_provider?: string | null
          logo_url?: string | null
          margin_size?: string
          paragraph_indent?: string
          petition_template_original_filename?: string | null
          petition_template_r2_key?: string | null
          petition_template_storage_provider?: string | null
          petition_template_url?: string | null
          primary_color?: string | null
          updated_at?: string
          use_letterhead?: boolean
          user_id: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          font_family?: string
          font_size?: string
          id?: string
          letterhead_template_original_filename?: string | null
          letterhead_template_r2_key?: string | null
          letterhead_template_storage_provider?: string | null
          letterhead_template_url?: string | null
          line_spacing?: string
          logo_original_filename?: string | null
          logo_r2_key?: string | null
          logo_storage_provider?: string | null
          logo_url?: string | null
          margin_size?: string
          paragraph_indent?: string
          petition_template_original_filename?: string | null
          petition_template_r2_key?: string | null
          petition_template_storage_provider?: string | null
          petition_template_url?: string | null
          primary_color?: string | null
          updated_at?: string
          use_letterhead?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petition_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      petitions: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          current_signatures: string | null
          description: string
          form_answers: Json | null
          form_schema: string | null
          form_type: string | null
          has_process: boolean | null
          id: string
          legal_area: string | null
          petition_type: string | null
          process_number: string | null
          rejection_count: number | null
          status: string
          target: string | null
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          current_signatures?: string | null
          description: string
          form_answers?: Json | null
          form_schema?: string | null
          form_type?: string | null
          has_process?: boolean | null
          id?: string
          legal_area?: string | null
          petition_type?: string | null
          process_number?: string | null
          rejection_count?: number | null
          status?: string
          target?: string | null
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          current_signatures?: string | null
          description?: string
          form_answers?: Json | null
          form_schema?: string | null
          form_type?: string | null
          has_process?: boolean | null
          id?: string
          legal_area?: string | null
          petition_type?: string | null
          process_number?: string | null
          rejection_count?: number | null
          status?: string
          target?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "petitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petitions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          choice_reason: string | null
          city: string | null
          created_at: string
          delegation_areas: string | null
          delegation_intent: string | null
          document: string | null
          email: string | null
          id: string
          is_admin: boolean
          name: string | null
          oab_number: string | null
          office_areas: string | null
          person_type: string | null
          phone: string | null
          purchase_reason: string | null
          social_media: string | null
          state: string | null
          stripe_customer_id: string | null
          team_size: string | null
          terms_accepted: boolean | null
          terms_accepted_at: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          choice_reason?: string | null
          city?: string | null
          created_at?: string
          delegation_areas?: string | null
          delegation_intent?: string | null
          document?: string | null
          email?: string | null
          id: string
          is_admin?: boolean
          name?: string | null
          oab_number?: string | null
          office_areas?: string | null
          person_type?: string | null
          phone?: string | null
          purchase_reason?: string | null
          social_media?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          team_size?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          choice_reason?: string | null
          city?: string | null
          created_at?: string
          delegation_areas?: string | null
          delegation_intent?: string | null
          document?: string | null
          email?: string | null
          id?: string
          is_admin?: boolean
          name?: string | null
          oab_number?: string | null
          office_areas?: string | null
          person_type?: string | null
          phone?: string | null
          purchase_reason?: string | null
          social_media?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          team_size?: string | null
          terms_accepted?: boolean | null
          terms_accepted_at?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          inviter_id: string
          role: string
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          inviter_id: string
          role?: string
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          role?: string
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          role: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          team_id?: string
          updated_at?: string
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
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          petition_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          petition_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          petition_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_petition_id_fkey"
            columns: ["petition_id"]
            isOneToOne: false
            referencedRelation: "petitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tokens: {
        Row: {
          created_at: string
          id: string
          tokens: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tokens?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tokens?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_tokens: {
        Args: { p_user_id: string; p_amount: number }
        Returns: undefined
      }
      check_file_access: {
        Args: { file_path: string; petition_id: string }
        Returns: boolean
      }
      delete_user_data: {
        Args: { user_id: string }
        Returns: boolean
      }
      get_user_teams: {
        Args: Record<PropertyKey, never> | { input_user_id: string }
        Returns: {
          team_id: number
          team_name: string
        }[]
      }
      grant_monthly_annual_tokens: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_email: {
        Args: { email: string }
        Returns: boolean
      }
      is_admin_id: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { user_uuid: string; team_uuid: string }
        Returns: boolean
      }
      is_team_member_safe: {
        Args: { user_id: string; team_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { team_uuid: string }
        Returns: boolean
      }
      is_team_owner_safe: {
        Args: { team_id: string }
        Returns: boolean
      }
      process_monthly_renewals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      temp_store_team_owners: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      toggle_admin_status: {
        Args: { target_user_id: string; set_admin: boolean }
        Returns: boolean
      }
      user_is_team_member: {
        Args: { team_id_param: string }
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
