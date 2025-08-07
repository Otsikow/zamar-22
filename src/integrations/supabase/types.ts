export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      active_sessions: {
        Row: {
          created_at: string
          id: string
          last_ping: string
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_ping?: string
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_ping?: string
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ads: {
        Row: {
          ad_type: string
          created_at: string
          frequency: number | null
          id: string
          is_active: boolean | null
          media_url: string | null
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_type: string
          created_at?: string
          frequency?: number | null
          id?: string
          is_active?: boolean | null
          media_url?: string | null
          target_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          created_at?: string
          frequency?: number | null
          id?: string
          is_active?: boolean | null
          media_url?: string | null
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_translations: {
        Row: {
          created_at: string
          id: string
          key: string
          language: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          language: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          language?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          message: string
          room_id: string
          seen: boolean | null
          sender_id: string
          sent_at: string
        }
        Insert: {
          id?: string
          message: string
          room_id: string
          seen?: boolean | null
          sender_id: string
          sent_at?: string
        }
        Update: {
          id?: string
          message?: string
          room_id?: string
          seen?: boolean | null
          sender_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_song_requests: {
        Row: {
          created_at: string
          id: string
          key_message: string
          language: string | null
          occasion: string
          reference_file_url: string | null
          scripture_quote: string | null
          status: string | null
          style_genre: string
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_message: string
          language?: string | null
          occasion: string
          reference_file_url?: string | null
          scripture_quote?: string | null
          status?: string | null
          style_genre: string
          tier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key_message?: string
          language?: string | null
          occasion?: string
          reference_file_url?: string | null
          scripture_quote?: string | null
          status?: string | null
          style_genre?: string
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      custom_songs: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          lyrics_url: string | null
          song_title: string
          status: string | null
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          lyrics_url?: string | null
          song_title: string
          status?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          lyrics_url?: string | null
          song_title?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          campaign: string | null
          created_at: string
          id: string
          status: string | null
          stripe_payment_id: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          campaign?: string | null
          created_at?: string
          id?: string
          status?: string | null
          stripe_payment_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          campaign?: string | null
          created_at?: string
          id?: string
          status?: string | null
          stripe_payment_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lyrics: {
        Row: {
          created_at: string
          id: string
          language: string | null
          pdf_url: string | null
          song_id: string | null
          text: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          pdf_url?: string | null
          song_id?: string | null
          text?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          pdf_url?: string | null
          song_id?: string | null
          text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          payment_type: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          payment_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          payment_type?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          song_id: string | null
          status: string | null
          stripe_payment_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          song_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          song_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string | null
          earned_at: string | null
          generation: number
          id: string
          referred_user_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          earned_at?: string | null
          generation: number
          id?: string
          referred_user_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          earned_at?: string | null
          generation?: number
          id?: string
          referred_user_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          generation: number
          id: string
          referred_at: string | null
          referred_user_id: string
          referrer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generation: number
          id?: string
          referred_at?: string | null
          referred_user_id: string
          referrer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generation?: number
          id?: string
          referred_at?: string | null
          referred_user_id?: string
          referrer_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_change_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          new_role: string | null
          old_role: string | null
          user_id: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          user_id?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_role?: string | null
          old_role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      song_plays: {
        Row: {
          country: string | null
          created_at: string
          id: string
          song_id: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          song_id?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          song_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "song_plays_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          audio_url: string | null
          created_at: string
          featured: boolean | null
          genre: string | null
          id: string
          language: string | null
          occasion: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          featured?: boolean | null
          genre?: string | null
          id?: string
          language?: string | null
          occasion?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          featured?: boolean | null
          genre?: string | null
          id?: string
          language?: string | null
          occasion?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      synced_lyrics: {
        Row: {
          created_at: string | null
          id: string
          line_index: number
          song_id: string | null
          text: string
          time_seconds: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          line_index: number
          song_id?: string | null
          text: string
          time_seconds: number
        }
        Update: {
          created_at?: string | null
          id?: string
          line_index?: number
          song_id?: string | null
          text?: string
          time_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "synced_lyrics_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          audio_url: string | null
          created_at: string
          id: string
          message: string
          moderated_at: string | null
          moderated_by: string | null
          name: string
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string
          id?: string
          message: string
          moderated_at?: string | null
          moderated_by?: string | null
          name: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string
          id?: string
          message?: string
          moderated_at?: string | null
          moderated_by?: string | null
          name?: string
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_manual_referral_reward: {
        Args: {
          p_user_id: string
          p_referred_user_id: string
          p_payment_amount: number
          p_reward_amount: number
          p_level: number
        }
        Returns: undefined
      }
      get_all_referral_rewards: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          referred_user_id: string
          payment_amount: number
          reward_amount: number
          level: number
          reward_type: string
          created_at: string
          referrer_first_name: string
          referrer_last_name: string
          referrer_email: string
          referred_first_name: string
          referred_last_name: string
          referred_email: string
        }[]
      }
      get_donation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_donations: number
          monthly_donors: number
          one_time_donations: number
          total_amount: number
        }[]
      }
      get_donations_by_campaign: {
        Args: Record<PropertyKey, never>
        Returns: {
          campaign_name: string
          total_amount: number
          donation_count: number
        }[]
      }
      get_monthly_referral_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total: number
        }[]
      }
      get_recent_donations: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          amount: number
          donor_name: string
          donor_email: string
          campaign: string
          type: string
          created_at: string
        }[]
      }
      get_referral_count: {
        Args: Record<PropertyKey, never>
        Returns: {
          count: number
        }[]
      }
      get_referral_totals: {
        Args: Record<PropertyKey, never>
        Returns: {
          total: number
        }[]
      }
      get_top_referrers: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          first_name: string
          last_name: string
          email: string
          total_earned: number
          reward_count: number
        }[]
      }
      get_user_referral_stats: {
        Args: { target_user_id: string }
        Returns: {
          total_referrals: number
          active_referrals: number
          inactive_referrals: number
          total_earned: number
          paid_earnings: number
          pending_earnings: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      insert_referral_earnings_after_payment: {
        Args: { payer_id: string; payment_amount: number }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_referral_earnings_as_paid: {
        Args: { earnings_ids: string[]; payout_method?: string }
        Returns: undefined
      }
      process_referral_earnings: {
        Args: { new_user: string; payment_amount: number }
        Returns: undefined
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
    Enums: {},
  },
} as const
