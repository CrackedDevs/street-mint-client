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
      admin_signature_codes: {
        Row: {
          active: boolean
          admin_signature_code: string
          collectible_id: number
          created_at: string
          id: number
        }
        Insert: {
          active?: boolean
          admin_signature_code: string
          collectible_id: number
          created_at?: string
          id?: number
        }
        Update: {
          active?: boolean
          admin_signature_code?: string
          collectible_id?: number
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "admin_signature_codes_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          app_password: string
          avatar_url: string
          bio: string
          collections: number[] | null
          email: string
          farcaster_username: string | null
          id: number
          instagram_username: string | null
          linkedin_username: string | null
          username: string
          wallet_address: string
          x_username: string | null
        }
        Insert: {
          app_password?: string
          avatar_url: string
          bio: string
          collections?: number[] | null
          email: string
          farcaster_username?: string | null
          id: number
          instagram_username?: string | null
          linkedin_username?: string | null
          username: string
          wallet_address: string
          x_username?: string | null
        }
        Update: {
          app_password?: string
          avatar_url?: string
          bio?: string
          collections?: number[] | null
          email?: string
          farcaster_username?: string | null
          id?: number
          instagram_username?: string | null
          linkedin_username?: string | null
          username?: string
          wallet_address?: string
          x_username?: string | null
        }
        Relationships: []
      }
      batch_listings: {
        Row: {
          airdrop_eligibility_index: number | null
          always_active: boolean | null
          batch_end_date: string | null
          batch_hour: number | null
          batch_start_date: string | null
          bg_color: string | null
          chain: string | null
          collectible_description: string
          collectible_name: string
          collectible_sample_media: string | null
          collectible_template_media: string | null
          collection_id: number
          created_at: string
          creator_royalty_array: Json | null
          cta_description: string | null
          cta_email_list: Json[] | null
          cta_enable: boolean | null
          cta_has_email_capture: boolean | null
          cta_has_text_capture: boolean | null
          cta_link: string | null
          cta_logo_url: string | null
          cta_text: string | null
          cta_text_list: Json[] | null
          cta_title: string | null
          custom_email: boolean | null
          custom_email_body: string | null
          custom_email_subject: string | null
          description: string | null
          enable_card_payments: boolean | null
          frequency_days: Json | null
          frequency_type: string | null
          gallery_name: string | null
          gallery_urls: string[]
          id: number
          is_irls: boolean | null
          is_light_version: boolean
          is_video: boolean | null
          location: string | null
          location_note: string | null
          logo_image: string | null
          loyalty_bg_color: string | null
          metadata_uri: string | null
          name: string | null
          nfc_public_key: string | null
          only_card_payment: boolean | null
          price_usd: number
          primary_image_url: string
          primary_media_type: string | null
          quantity: number | null
          quantity_type: Database["public"]["Enums"]["quantity_type"]
          sponsor_id: number | null
          stripe_price_id: string | null
          total_collectibles: number
          whitelist: boolean | null
        }
        Insert: {
          airdrop_eligibility_index?: number | null
          always_active?: boolean | null
          batch_end_date?: string | null
          batch_hour?: number | null
          batch_start_date?: string | null
          bg_color?: string | null
          chain?: string | null
          collectible_description: string
          collectible_name: string
          collectible_sample_media?: string | null
          collectible_template_media?: string | null
          collection_id: number
          created_at?: string
          creator_royalty_array?: Json | null
          cta_description?: string | null
          cta_email_list?: Json[] | null
          cta_enable?: boolean | null
          cta_has_email_capture?: boolean | null
          cta_has_text_capture?: boolean | null
          cta_link?: string | null
          cta_logo_url?: string | null
          cta_text?: string | null
          cta_text_list?: Json[] | null
          cta_title?: string | null
          custom_email?: boolean | null
          custom_email_body?: string | null
          custom_email_subject?: string | null
          description?: string | null
          enable_card_payments?: boolean | null
          frequency_days?: Json | null
          frequency_type?: string | null
          gallery_name?: string | null
          gallery_urls: string[]
          id?: number
          is_irls?: boolean | null
          is_light_version?: boolean
          is_video?: boolean | null
          location?: string | null
          location_note?: string | null
          logo_image?: string | null
          loyalty_bg_color?: string | null
          metadata_uri?: string | null
          name?: string | null
          nfc_public_key?: string | null
          only_card_payment?: boolean | null
          price_usd: number
          primary_image_url: string
          primary_media_type?: string | null
          quantity?: number | null
          quantity_type: Database["public"]["Enums"]["quantity_type"]
          sponsor_id?: number | null
          stripe_price_id?: string | null
          total_collectibles?: number
          whitelist?: boolean | null
        }
        Update: {
          airdrop_eligibility_index?: number | null
          always_active?: boolean | null
          batch_end_date?: string | null
          batch_hour?: number | null
          batch_start_date?: string | null
          bg_color?: string | null
          chain?: string | null
          collectible_description?: string
          collectible_name?: string
          collectible_sample_media?: string | null
          collectible_template_media?: string | null
          collection_id?: number
          created_at?: string
          creator_royalty_array?: Json | null
          cta_description?: string | null
          cta_email_list?: Json[] | null
          cta_enable?: boolean | null
          cta_has_email_capture?: boolean | null
          cta_has_text_capture?: boolean | null
          cta_link?: string | null
          cta_logo_url?: string | null
          cta_text?: string | null
          cta_text_list?: Json[] | null
          cta_title?: string | null
          custom_email?: boolean | null
          custom_email_body?: string | null
          custom_email_subject?: string | null
          description?: string | null
          enable_card_payments?: boolean | null
          frequency_days?: Json | null
          frequency_type?: string | null
          gallery_name?: string | null
          gallery_urls?: string[]
          id?: number
          is_irls?: boolean | null
          is_light_version?: boolean
          is_video?: boolean | null
          location?: string | null
          location_note?: string | null
          logo_image?: string | null
          loyalty_bg_color?: string | null
          metadata_uri?: string | null
          name?: string | null
          nfc_public_key?: string | null
          only_card_payment?: boolean | null
          price_usd?: number
          primary_image_url?: string
          primary_media_type?: string | null
          quantity?: number | null
          quantity_type?: Database["public"]["Enums"]["quantity_type"]
          sponsor_id?: number | null
          stripe_price_id?: string | null
          total_collectibles?: number
          whitelist?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_listings_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_listings_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_links: {
        Row: {
          active: boolean
          artists_id: number | null
          batch_listing_id: number | null
          chip_id: string
          collectible_id: number | null
          created_at: string
          id: number
        }
        Insert: {
          active?: boolean
          artists_id?: number | null
          batch_listing_id?: number | null
          chip_id: string
          collectible_id?: number | null
          created_at?: string
          id?: number
        }
        Update: {
          active?: boolean
          artists_id?: number | null
          batch_listing_id?: number | null
          chip_id?: string
          collectible_id?: number | null
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chip_links_artists_id_fkey"
            columns: ["artists_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chip_links_batch_listing_id_fkey"
            columns: ["batch_listing_id"]
            isOneToOne: false
            referencedRelation: "batch_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chip_links_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      chip_taps: {
        Row: {
          created_at: string
          e: string
          id: number
          last_uuid: string
          n: string
          server_auth: boolean
          x: string
        }
        Insert: {
          created_at?: string
          e: string
          id?: number
          last_uuid?: string
          n: string
          server_auth?: boolean
          x: string
        }
        Update: {
          created_at?: string
          e?: string
          id?: number
          last_uuid?: string
          n?: string
          server_auth?: boolean
          x?: string
        }
        Relationships: []
      }
      chip_taps_paid: {
        Row: {
          created_at: string
          e: string
          id: number
          n: string
          x: string
        }
        Insert: {
          created_at?: string
          e: string
          id?: number
          n: string
          x: string
        }
        Update: {
          created_at?: string
          e?: string
          id?: number
          n?: string
          x?: string
        }
        Relationships: []
      }
      collectible_schedule: {
        Row: {
          chip_id: string | null
          collectible_id: number | null
          created_at: string
          executed: boolean | null
          id: number
          schedule_unix: number | null
        }
        Insert: {
          chip_id?: string | null
          collectible_id?: number | null
          created_at?: string
          executed?: boolean | null
          id?: number
          schedule_unix?: number | null
        }
        Update: {
          chip_id?: string | null
          collectible_id?: number | null
          created_at?: string
          executed?: boolean | null
          id?: number
          schedule_unix?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collectible_schedule_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      collectibles: {
        Row: {
          airdrop_eligibility_index: number | null
          batch_listing_id: number | null
          chain: string | null
          collection_id: number
          created_at: string
          creator_royalty_array: Json | null
          cta_description: string | null
          cta_email_list: Json[] | null
          cta_enable: boolean | null
          cta_has_email_capture: boolean | null
          cta_has_text_capture: boolean | null
          cta_link: string | null
          cta_logo_url: string | null
          cta_text: string | null
          cta_text_list: Json[] | null
          cta_title: string | null
          custom_email: boolean | null
          custom_email_body: string | null
          custom_email_subject: string | null
          day_number: number | null
          description: string
          enable_card_payments: boolean | null
          gallery_name: string | null
          gallery_urls: string[]
          id: number
          is_irls: boolean | null
          is_light_version: boolean
          is_video: boolean | null
          location: string | null
          location_note: string | null
          metadata_uri: string | null
          mint_end_date: string | null
          mint_start_date: string | null
          name: string
          nfc_public_key: string | null
          only_card_payment: boolean | null
          price_usd: number
          primary_image_url: string
          primary_media_type: string | null
          quantity: number | null
          quantity_type: Database["public"]["Enums"]["quantity_type"]
          sponsor_id: number | null
          stripe_price_id: string | null
          whitelist: boolean | null
        }
        Insert: {
          airdrop_eligibility_index?: number | null
          batch_listing_id?: number | null
          chain?: string | null
          collection_id: number
          created_at?: string
          creator_royalty_array?: Json | null
          cta_description?: string | null
          cta_email_list?: Json[] | null
          cta_enable?: boolean | null
          cta_has_email_capture?: boolean | null
          cta_has_text_capture?: boolean | null
          cta_link?: string | null
          cta_logo_url?: string | null
          cta_text?: string | null
          cta_text_list?: Json[] | null
          cta_title?: string | null
          custom_email?: boolean | null
          custom_email_body?: string | null
          custom_email_subject?: string | null
          day_number?: number | null
          description: string
          enable_card_payments?: boolean | null
          gallery_name?: string | null
          gallery_urls: string[]
          id?: number
          is_irls?: boolean | null
          is_light_version?: boolean
          is_video?: boolean | null
          location?: string | null
          location_note?: string | null
          metadata_uri?: string | null
          mint_end_date?: string | null
          mint_start_date?: string | null
          name: string
          nfc_public_key?: string | null
          only_card_payment?: boolean | null
          price_usd: number
          primary_image_url: string
          primary_media_type?: string | null
          quantity?: number | null
          quantity_type: Database["public"]["Enums"]["quantity_type"]
          sponsor_id?: number | null
          stripe_price_id?: string | null
          whitelist?: boolean | null
        }
        Update: {
          airdrop_eligibility_index?: number | null
          batch_listing_id?: number | null
          chain?: string | null
          collection_id?: number
          created_at?: string
          creator_royalty_array?: Json | null
          cta_description?: string | null
          cta_email_list?: Json[] | null
          cta_enable?: boolean | null
          cta_has_email_capture?: boolean | null
          cta_has_text_capture?: boolean | null
          cta_link?: string | null
          cta_logo_url?: string | null
          cta_text?: string | null
          cta_text_list?: Json[] | null
          cta_title?: string | null
          custom_email?: boolean | null
          custom_email_body?: string | null
          custom_email_subject?: string | null
          day_number?: number | null
          description?: string
          enable_card_payments?: boolean | null
          gallery_name?: string | null
          gallery_urls?: string[]
          id?: number
          is_irls?: boolean | null
          is_light_version?: boolean
          is_video?: boolean | null
          location?: string | null
          location_note?: string | null
          metadata_uri?: string | null
          mint_end_date?: string | null
          mint_start_date?: string | null
          name?: string
          nfc_public_key?: string | null
          only_card_payment?: boolean | null
          price_usd?: number
          primary_image_url?: string
          primary_media_type?: string | null
          quantity?: number | null
          quantity_type?: Database["public"]["Enums"]["quantity_type"]
          sponsor_id?: number | null
          stripe_price_id?: string | null
          whitelist?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "collectibles_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collectibles_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          artist: number
          collection_mint_public_key: string | null
          created_at: string | null
          description: string
          id: number
          merkle_tree_public_key: string | null
          metadata_uri: string | null
          name: string
        }
        Insert: {
          artist: number
          collection_mint_public_key?: string | null
          created_at?: string | null
          description: string
          id: number
          merkle_tree_public_key?: string | null
          metadata_uri?: string | null
          name: string
        }
        Update: {
          artist?: number
          collection_mint_public_key?: string | null
          created_at?: string | null
          description?: string
          id?: number
          merkle_tree_public_key?: string | null
          metadata_uri?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_artist_fkey"
            columns: ["artist"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      light_orders: {
        Row: {
          airdrop_won: boolean
          collectible_id: number | null
          collection_id: number | null
          created_at: string | null
          cta_email: string | null
          cta_text: string | null
          device_id: string | null
          email: string
          email_sent: boolean | null
          id: string
          last_uuid: string | null
          max_supply: number | null
          mint_address: string | null
          mint_signature: string | null
          nft_type: string | null
          price_sol: number | null
          price_usd: number | null
          quantity: number | null
          signature_code: string | null
          status: string | null
          transaction_signature: string | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          airdrop_won?: boolean
          collectible_id?: number | null
          collection_id?: number | null
          created_at?: string | null
          cta_email?: string | null
          cta_text?: string | null
          device_id?: string | null
          email: string
          email_sent?: boolean | null
          id?: string
          last_uuid?: string | null
          max_supply?: number | null
          mint_address?: string | null
          mint_signature?: string | null
          nft_type?: string | null
          price_sol?: number | null
          price_usd?: number | null
          quantity?: number | null
          signature_code?: string | null
          status?: string | null
          transaction_signature?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          airdrop_won?: boolean
          collectible_id?: number | null
          collection_id?: number | null
          created_at?: string | null
          cta_email?: string | null
          cta_text?: string | null
          device_id?: string | null
          email?: string
          email_sent?: boolean | null
          id?: string
          last_uuid?: string | null
          max_supply?: number | null
          mint_address?: string | null
          mint_signature?: string | null
          nft_type?: string | null
          price_sol?: number | null
          price_usd?: number | null
          quantity?: number | null
          signature_code?: string | null
          status?: string | null
          transaction_signature?: string | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "light_orders_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "light_orders_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      nfc_taps: {
        Row: {
          created_at: string | null
          id: number
          random_number: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          random_number: string
        }
        Update: {
          created_at?: string | null
          id?: number
          random_number?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          airdrop_won: boolean
          collectible_id: number | null
          collection_id: number | null
          created_at: string | null
          cta_email: string | null
          cta_text: string | null
          device_id: string | null
          id: string
          max_supply: number | null
          mint_address: string | null
          mint_signature: string | null
          nft_type: string | null
          price_sol: number | null
          price_usd: number | null
          quantity: number | null
          sol_address: string | null
          status: string | null
          tiplink_url: string | null
          transaction_signature: string | null
          updated_at: string | null
          wallet_address: string
        }
        Insert: {
          airdrop_won?: boolean
          collectible_id?: number | null
          collection_id?: number | null
          created_at?: string | null
          cta_email?: string | null
          cta_text?: string | null
          device_id?: string | null
          id?: string
          max_supply?: number | null
          mint_address?: string | null
          mint_signature?: string | null
          nft_type?: string | null
          price_sol?: number | null
          price_usd?: number | null
          quantity?: number | null
          sol_address?: string | null
          status?: string | null
          tiplink_url?: string | null
          transaction_signature?: string | null
          updated_at?: string | null
          wallet_address: string
        }
        Update: {
          airdrop_won?: boolean
          collectible_id?: number | null
          collection_id?: number | null
          created_at?: string | null
          cta_email?: string | null
          cta_text?: string | null
          device_id?: string | null
          id?: string
          max_supply?: number | null
          mint_address?: string | null
          mint_signature?: string | null
          nft_type?: string | null
          price_sol?: number | null
          price_usd?: number | null
          quantity?: number | null
          sol_address?: string | null
          status?: string | null
          tiplink_url?: string | null
          transaction_signature?: string | null
          updated_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: false
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          artist_id: number | null
          created_at: string
          id: number
          img_url: string | null
          name: string | null
        }
        Insert: {
          artist_id?: number | null
          created_at?: string
          id?: number
          img_url?: string | null
          name?: string | null
        }
        Update: {
          artist_id?: number | null
          created_at?: string
          id?: number
          img_url?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      stampbooks: {
        Row: {
          artist_id: number
          bg_color: string | null
          collectibles: number[]
          created_at: string
          description: string | null
          id: number
          logo_image: string | null
          loyalty_bg_color: string | null
          name: string | null
        }
        Insert: {
          artist_id: number
          bg_color?: string | null
          collectibles?: number[]
          created_at?: string
          description?: string | null
          id?: number
          logo_image?: string | null
          loyalty_bg_color?: string | null
          name?: string | null
        }
        Update: {
          artist_id?: number
          bg_color?: string | null
          collectibles?: number[]
          created_at?: string
          description?: string | null
          id?: number
          logo_image?: string | null
          loyalty_bg_color?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stampbooks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number | null
          created_at: string
          id: number
          order_id: string | null
          session_id: string | null
          status: string | null
          transaction_dump: Json | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: number
          order_id?: string | null
          session_id?: string | null
          status?: string | null
          transaction_dump?: Json | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: number
          order_id?: string | null
          session_id?: string | null
          status?: string | null
          transaction_dump?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      collectible_type: "IRLS" | "STREETMINT" | "TEST_IRLS" | "TEST_STREETMINT"
      quantity_type: "limited" | "unlimited" | "single"
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
    Enums: {
      collectible_type: ["IRLS", "STREETMINT", "TEST_IRLS", "TEST_STREETMINT"],
      quantity_type: ["limited", "unlimited", "single"],
    },
  },
} as const
