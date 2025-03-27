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
      bot_analytics: {
        Row: {
          bot_id: string
          chat_count: number
          created_at: string
          date: string
          id: string
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          bot_id: string
          chat_count?: number
          created_at?: string
          date: string
          id?: string
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          bot_id?: string
          chat_count?: number
          created_at?: string
          date?: string
          id?: string
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_analytics_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      bots: {
        Row: {
          bot_type: string | null
          chat_bubble_style: string | null
          company: string | null
          created_at: string
          font_family: string | null
          id: string
          name: string
          primary_color: string | null
          show_powered_by: boolean | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_type?: string | null
          chat_bubble_style?: string | null
          company?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          name: string
          primary_color?: string | null
          show_powered_by?: boolean | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_type?: string | null
          chat_bubble_style?: string | null
          company?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          name?: string
          primary_color?: string | null
          show_powered_by?: boolean | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          bot_id: string
          created_at: string
          customer_email: string | null
          customer_location: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          customer_email?: string | null
          customer_location?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          customer_email?: string | null
          customer_location?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          browser: string | null
          content: string | null
          email: string | null
          id: string
          os: string | null
          page_url: string | null
          status: string
          timestamp: string
          type: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          browser?: string | null
          content?: string | null
          email?: string | null
          id?: string
          os?: string | null
          page_url?: string | null
          status?: string
          timestamp?: string
          type: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          browser?: string | null
          content?: string | null
          email?: string | null
          id?: string
          os?: string | null
          page_url?: string | null
          status?: string
          timestamp?: string
          type?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string | null
          payment_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          payment_date?: string | null
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string | null
          payment_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_sources: {
        Row: {
          bot_id: string
          content: string | null
          created_at: string
          id: string
          source_type: string
        }
        Insert: {
          bot_id: string
          content?: string | null
          created_at?: string
          id?: string
          source_type: string
        }
        Update: {
          bot_id?: string
          content?: string | null
          created_at?: string
          id?: string
          source_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_type: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last_four: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_type: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last_four: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_type?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last_four?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          billing_cycle: string
          created_at: string
          end_date: string | null
          id: string
          plan_name: string
          price: number
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          billing_cycle: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan_name: string
          price: number
          start_date?: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          billing_cycle?: string
          created_at?: string
          end_date?: string | null
          id?: string
          plan_name?: string
          price?: number
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          access_level: string
          created_at: string | null
          id: string
          member_id: string
          owner_id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          access_level?: string
          created_at?: string | null
          id?: string
          member_id: string
          owner_id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          created_at?: string | null
          id?: string
          member_id?: string
          owner_id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          bot_purpose: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bot_purpose?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bot_purpose?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      users_metadata: {
        Row: {
          conversations_used: number | null
          created_at: string
          customer_id: string | null
          has_payment_method: boolean
          id: string
          live_bots_count: number | null
          messages_used: number | null
          payment_status: string
          status: string
          subscription_tier: string | null
          team_members_count: number | null
          updated_at: string
        }
        Insert: {
          conversations_used?: number | null
          created_at?: string
          customer_id?: string | null
          has_payment_method?: boolean
          id: string
          live_bots_count?: number | null
          messages_used?: number | null
          payment_status?: string
          status?: string
          subscription_tier?: string | null
          team_members_count?: number | null
          updated_at?: string
        }
        Update: {
          conversations_used?: number | null
          created_at?: string
          customer_id?: string | null
          has_payment_method?: boolean
          id?: string
          live_bots_count?: number | null
          messages_used?: number | null
          payment_status?: string
          status?: string
          subscription_tier?: string | null
          team_members_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          name: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      widget_settings: {
        Row: {
          button_offset: number
          created_at: string
          id: string
          position: string
          updated_at: string
          user_id: string
        }
        Insert: {
          button_offset?: number
          created_at?: string
          id?: string
          position?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          button_offset?: number
          created_at?: string
          id?: string
          position?: string
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
      get_bot_by_id_string: {
        Args: {
          id_param: string
        }
        Returns: {
          id: string
          name: string
          user_id: string
          company: string
          bot_type: string
          created_at: string
          updated_at: string
          primary_color: string
        }[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
