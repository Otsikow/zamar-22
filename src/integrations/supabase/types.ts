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
      ad_logs: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          ip: unknown | null
          placement: string | null
          referrer: string | null
          type: string
          ua: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          ip?: unknown | null
          placement?: string | null
          referrer?: string | null
          type: string
          ua?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          ip?: unknown | null
          placement?: string | null
          referrer?: string | null
          type?: string
          ua?: string | null
        }
        Relationships: []
      }
      admin_creation_attempts: {
        Row: {
          attempted_at: string | null
          attempted_by: string | null
          id: string
          ip_address: unknown | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          attempted_by?: string | null
          id?: string
          ip_address?: unknown | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          attempted_by?: string | null
          id?: string
          ip_address?: unknown | null
          success?: boolean
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
          clicks: number
          created_at: string
          end_date: string | null
          frequency: number | null
          id: string
          impressions: number
          is_active: boolean | null
          media_url: string | null
          paid: boolean
          placement: string | null
          start_date: string | null
          status: string
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_type: string
          clicks?: number
          created_at?: string
          end_date?: string | null
          frequency?: number | null
          id?: string
          impressions?: number
          is_active?: boolean | null
          media_url?: string | null
          paid?: boolean
          placement?: string | null
          start_date?: string | null
          status?: string
          target_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          clicks?: number
          created_at?: string
          end_date?: string | null
          frequency?: number | null
          id?: string
          impressions?: number
          is_active?: boolean | null
          media_url?: string | null
          paid?: boolean
          placement?: string | null
          start_date?: string | null
          status?: string
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          ad_type: string
          clicks: number | null
          created_at: string
          end_date: string | null
          frequency: number | null
          id: string
          impressions: number | null
          is_active: boolean
          media_url: string | null
          placement: string | null
          start_date: string | null
          status: string | null
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          ad_type: string
          clicks?: number | null
          created_at?: string
          end_date?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          is_active?: boolean
          media_url?: string | null
          placement?: string | null
          start_date?: string | null
          status?: string | null
          target_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          ad_type?: string
          clicks?: number | null
          created_at?: string
          end_date?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          is_active?: boolean
          media_url?: string | null
          placement?: string | null
          start_date?: string | null
          status?: string | null
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
          image_url: string | null
          message: string
          room_id: string
          seen: boolean | null
          sender_id: string
          sent_at: string
        }
        Insert: {
          id?: string
          image_url?: string | null
          message: string
          room_id: string
          seen?: boolean | null
          sender_id: string
          sent_at?: string
        }
        Update: {
          id?: string
          image_url?: string | null
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
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
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
            foreignKeyName: "chat_rooms_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      custom_song_assets: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: string
          kind: string | null
          notes: string | null
          request_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          kind?: string | null
          notes?: string | null
          request_id: string
          storage_path: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: string
          kind?: string | null
          notes?: string | null
          request_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_song_assets_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_song_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_song_deliveries: {
        Row: {
          cover_art_path: string | null
          delivered_at: string | null
          delivered_by: string | null
          final_audio_path: string
          id: string
          lyrics_pdf_path: string | null
          request_id: string
        }
        Insert: {
          cover_art_path?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          final_audio_path: string
          id?: string
          lyrics_pdf_path?: string | null
          request_id: string
        }
        Update: {
          cover_art_path?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          final_audio_path?: string
          id?: string
          lyrics_pdf_path?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_song_deliveries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_song_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_song_messages: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_song_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_song_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_song_orders: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_price_id: string
          stripe_session_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_price_id: string
          stripe_session_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_price_id?: string
          stripe_session_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_song_requests: {
        Row: {
          assigned_admin: string | null
          created_at: string
          currency: string | null
          duration_seconds: number | null
          id: string
          key_message: string
          language: string | null
          need_by_date: string | null
          occasion: string
          price_cents: number | null
          reference_file_url: string | null
          reference_urls: string[] | null
          scripture_quote: string | null
          scripture_ref: string | null
          status: Database["public"]["Enums"]["custom_status"] | null
          stripe_pi_id: string | null
          style: string | null
          style_genre: string
          tier: string
          title: string | null
          tone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_admin?: string | null
          created_at?: string
          currency?: string | null
          duration_seconds?: number | null
          id?: string
          key_message: string
          language?: string | null
          need_by_date?: string | null
          occasion: string
          price_cents?: number | null
          reference_file_url?: string | null
          reference_urls?: string[] | null
          scripture_quote?: string | null
          scripture_ref?: string | null
          status?: Database["public"]["Enums"]["custom_status"] | null
          stripe_pi_id?: string | null
          style?: string | null
          style_genre: string
          tier: string
          title?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_admin?: string | null
          created_at?: string
          currency?: string | null
          duration_seconds?: number | null
          id?: string
          key_message?: string
          language?: string | null
          need_by_date?: string | null
          occasion?: string
          price_cents?: number | null
          reference_file_url?: string | null
          reference_urls?: string[] | null
          scripture_quote?: string | null
          scripture_ref?: string | null
          status?: Database["public"]["Enums"]["custom_status"] | null
          stripe_pi_id?: string | null
          style?: string | null
          style_genre?: string
          tier?: string
          title?: string | null
          tone?: string | null
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
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
      playlist_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          playlist_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          playlist_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          playlist_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_comments_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_likes: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_likes_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_songs: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          song_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          song_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_songs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_songs_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          show_creator: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          show_creator?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          show_creator?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          billing_interval: string | null
          category: string
          created_at: string | null
          currency: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at: string | null
        }
        Insert: {
          billing_interval?: string | null
          category: string
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string | null
          category?: string
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
          stripe_price_id?: string
          stripe_product_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          pending_ref_code: string | null
          preferred_language: string | null
          referral_code: string | null
          referred_by: string | null
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          pending_ref_code?: string | null
          preferred_language?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          pending_ref_code?: string | null
          preferred_language?: string | null
          referral_code?: string | null
          referred_by?: string | null
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
      purchases: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          id: string
          product_id: string | null
          song_id: string | null
          status: string | null
          stripe_payment_id: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          product_id?: string | null
          song_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          product_id?: string | null
          song_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip: string | null
          ref_code: string
          referrer_id: string | null
          ua: string | null
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip?: string | null
          ref_code: string
          referrer_id?: string | null
          ua?: string | null
        }
        Update: {
          clicked_at?: string
          id?: string
          ip?: string | null
          ref_code?: string
          referrer_id?: string | null
          ua?: string | null
        }
        Relationships: []
      }
      referral_config: {
        Row: {
          id: number
          level1_rate: number
          level2_rate: number
          min_purchase_cents: number
        }
        Insert: {
          id?: number
          level1_rate?: number
          level2_rate?: number
          min_purchase_cents?: number
        }
        Update: {
          id?: number
          level1_rate?: number
          level2_rate?: number
          min_purchase_cents?: number
        }
        Relationships: []
      }
      referral_earnings: {
        Row: {
          amount: number
          created_at: string | null
          earned_at: string | null
          generation: number
          id: string
          payment_id: string | null
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
          payment_id?: string | null
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
          payment_id?: string | null
          referred_user_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          amount_pence: number
          created_at: string | null
          generation: number
          id: string
          level: number
          referred_at: string | null
          referred_user_id: string
          referrer_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_pence?: number
          created_at?: string | null
          generation: number
          id?: string
          level?: number
          referred_at?: string | null
          referred_user_id: string
          referrer_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_pence?: number
          created_at?: string | null
          generation?: number
          id?: string
          level?: number
          referred_at?: string | null
          referred_user_id?: string
          referrer_id?: string
          status?: string
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
      security_audit_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
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
      song_suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          fulfilled_at: string | null
          id: string
          preferred_language: string | null
          scripture_reference: string | null
          song_id: string | null
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          fulfilled_at?: string | null
          id?: string
          preferred_language?: string | null
          scripture_reference?: string | null
          song_id?: string | null
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          fulfilled_at?: string | null
          id?: string
          preferred_language?: string | null
          scripture_reference?: string | null
          song_id?: string | null
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_suggestions_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
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
          suggested_by: string | null
          suggested_by_display: string | null
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
          suggested_by?: string | null
          suggested_by_display?: string | null
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
          suggested_by?: string | null
          suggested_by_display?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "songs_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_suggested_by_fkey"
            columns: ["suggested_by"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
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
      testimonies: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          country: string | null
          created_at: string
          display_name: string | null
          id: string
          media_type: string | null
          media_url: string | null
          message: string
          published_at: string | null
          song_id: string | null
          status: Database["public"]["Enums"]["testimony_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message: string
          published_at?: string | null
          song_id?: string | null
          status?: Database["public"]["Enums"]["testimony_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message?: string
          published_at?: string | null
          song_id?: string | null
          status?: Database["public"]["Enums"]["testimony_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_custom_library: {
        Row: {
          cover_art_path: string | null
          created_at: string | null
          final_audio_path: string
          id: string
          lyrics_pdf_path: string | null
          request_id: string
          title: string
          user_id: string
        }
        Insert: {
          cover_art_path?: string | null
          created_at?: string | null
          final_audio_path: string
          id?: string
          lyrics_pdf_path?: string | null
          request_id: string
          title: string
          user_id: string
        }
        Update: {
          cover_art_path?: string | null
          created_at?: string | null
          final_audio_path?: string
          id?: string
          lyrics_pdf_path?: string | null
          request_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_library_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "custom_song_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favourites: {
        Row: {
          created_at: string
          id: string
          song_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          song_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          song_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favourites_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favourites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_referral_summary"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      admin_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string | null
          status: string | null
          tier: string | null
          updated_at: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string | null
          preferred_language: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          preferred_language?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          preferred_language?: string | null
        }
        Relationships: []
      }
      public_testimonies: {
        Row: {
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          media_type: string | null
          media_url: string | null
          message: string | null
          published_at: string | null
          song_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          published_at?: string | null
          song_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          media_type?: string | null
          media_url?: string | null
          message?: string | null
          published_at?: string | null
          song_id?: string | null
        }
        Relationships: []
      }
      v_my_referral_totals: {
        Row: {
          me: string | null
          paid_out_pence: number | null
          pending_payout_pence: number | null
          total_earned_pence: number | null
          total_referrals: number | null
        }
        Relationships: []
      }
      v_referral_earnings_detailed: {
        Row: {
          amount: number | null
          created_at: string | null
          generation: number | null
          id: string | null
          payment_amount: number | null
          payment_created_at: string | null
          payment_currency: string | null
          payment_id: string | null
          referred_user_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_referral_summary: {
        Row: {
          direct_referrals: number | null
          indirect_referrals: number | null
          paid_earnings: number | null
          pending_earnings: number | null
          total_earned: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_top_referrers_last30: {
        Row: {
          earned_30d: number | null
          earner_id: string | null
          earning_events: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_manual_referral_reward: {
        Args: {
          p_level: number
          p_payment_amount: number
          p_referred_user_id: string
          p_reward_amount: number
          p_user_id: string
        }
        Returns: undefined
      }
      admin_list_orders: {
        Args: { p_q?: string; p_status?: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          status: string
          tier: string
          updated_at: string
          user_email: string
          user_id: string
        }[]
      }
      admin_soft_delete_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_suspend_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_unsuspend_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      apply_referral: {
        Args: { new_user: string; raw_ref: string }
        Returns: undefined
      }
      approve_referral_for: {
        Args: { order_total_pence: number; referred: string }
        Returns: undefined
      }
      approve_testimony: {
        Args: { p_admin: string; p_testimony_id: string }
        Returns: undefined
      }
      atomic_grant_first_admin: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_ref_code_for: {
        Args: { user_id: string }
        Returns: undefined
      }
      extract_single_ip: {
        Args: { ip_input: string }
        Returns: unknown
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_session_count: {
        Args: { minutes_threshold?: number }
        Returns: number
      }
      get_all_referral_rewards: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          level: number
          payment_amount: number
          referred_email: string
          referred_first_name: string
          referred_last_name: string
          referred_user_id: string
          referrer_email: string
          referrer_first_name: string
          referrer_last_name: string
          reward_amount: number
          reward_type: string
          user_id: string
        }[]
      }
      get_donation_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          monthly_donors: number
          one_time_donations: number
          total_amount: number
          total_donations: number
        }[]
      }
      get_donations_by_campaign: {
        Args: Record<PropertyKey, never>
        Returns: {
          campaign_name: string
          donation_count: number
          total_amount: number
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
          amount: number
          campaign: string
          created_at: string
          donor_email: string
          donor_name: string
          id: string
          type: string
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
          email: string
          first_name: string
          last_name: string
          reward_count: number
          total_earned: number
          user_id: string
        }[]
      }
      get_user_referral_stats: {
        Args: { target_user_id: string }
        Returns: {
          active_referrals: number
          inactive_referrals: number
          paid_earnings: number
          pending_earnings: number
          total_earned: number
          total_referrals: number
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
      insert_referral_earnings_after_payment_v2: {
        Args: { p_payment_id: string; payer_id: string; payment_amount: number }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      link_referral: {
        Args: { p_referral_code: string }
        Returns: boolean
      }
      log_admin_operation: {
        Args: {
          additional_info?: Json
          operation_type: string
          target_id?: string
          target_table: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_ip_address?: string
          p_metadata?: Json
          p_user_agent?: string
        }
        Returns: undefined
      }
      mark_paid: {
        Args: { amount: number; request: string }
        Returns: undefined
      }
      mark_referral_earnings_as_paid: {
        Args: { earnings_ids: string[]; payout_method?: string }
        Returns: undefined
      }
      privacy_safe_name: {
        Args: { u_id: string }
        Returns: string
      }
      process_referral_earnings: {
        Args: { new_user: string; payment_amount: number }
        Returns: undefined
      }
      reject_testimony: {
        Args: { p_admin: string; p_reason: string; p_testimony_id: string }
        Returns: undefined
      }
      reverse_referral_earnings_for_payment: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "deleted"
      custom_status:
        | "pending_brief"
        | "quoted"
        | "awaiting_payment"
        | "in_production"
        | "draft_shared"
        | "revision_requested"
        | "approved"
        | "delivered"
        | "cancelled"
        | "rejected"
      testimony_status: "pending" | "approved" | "rejected"
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
      account_status: ["active", "suspended", "deleted"],
      custom_status: [
        "pending_brief",
        "quoted",
        "awaiting_payment",
        "in_production",
        "draft_shared",
        "revision_requested",
        "approved",
        "delivered",
        "cancelled",
        "rejected",
      ],
      testimony_status: ["pending", "approved", "rejected"],
    },
  },
} as const
