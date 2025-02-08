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
      chip_links: {
        Row: {
          active: boolean
          chip_id: string
          collectible_id: number
          created_at: string
          id: number
        }
        Insert: {
          active?: boolean
          chip_id: string
          collectible_id: number
          created_at?: string
          id?: number
        }
        Update: {
          active?: boolean
          chip_id?: string
          collectible_id?: number
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "chip_links_collectible_id_fkey"
            columns: ["collectible_id"]
            isOneToOne: true
            referencedRelation: "collectibles"
            referencedColumns: ["id"]
          },
        ]
      }
      collectibles: {
        Row: {
          airdrop_eligibility_index: number | null
          chain: string | null
          collection_id: number
          created_at: string
          description: string
          gallery_urls: string[]
          id: number
          location: string | null
          location_note: string | null
          metadata_uri: string | null
          mint_end_date: string | null
          mint_start_date: string | null
          name: string
          nfc_public_key: string | null
          price_usd: number
          primary_image_url: string
          quantity: number | null
          quantity_type: Database["public"]["Enums"]["quantity_type"]
          whitelist: boolean | null
        }
        Insert: {
          airdrop_eligibility_index?: number | null
          chain?: string | null
          collection_id: number
          created_at?: string
          description: string
          gallery_urls: string[]
          id?: number
          location?: string | null
          location_note?: string | null
          metadata_uri?: string | null
          mint_end_date?: string | null
          mint_start_date?: string | null
          name: string
          nfc_public_key?: string | null
          price_usd: number
          primary_image_url: string
          quantity?: number | null
          quantity_type: Database["public"]["Enums"]["quantity_type"]
          whitelist?: boolean | null
        }
        Update: {
          airdrop_eligibility_index?: number | null
          chain?: string | null
          collection_id?: number
          created_at?: string
          description?: string
          gallery_urls?: string[]
          id?: number
          location?: string | null
          location_note?: string | null
          metadata_uri?: string | null
          mint_end_date?: string | null
          mint_start_date?: string | null
          name?: string
          nfc_public_key?: string | null
          price_usd?: number
          primary_image_url?: string
          quantity?: number | null
          quantity_type?: Database["public"]["Enums"]["quantity_type"]
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
          device_id: string | null
          id: string
          max_supply: number | null
          mint_address: string | null
          mint_signature: string | null
          nft_type: string | null
          price_sol: number | null
          price_usd: number | null
          quantity: number | null
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
          device_id?: string | null
          id?: string
          max_supply?: number | null
          mint_address?: string | null
          mint_signature?: string | null
          nft_type?: string | null
          price_sol?: number | null
          price_usd?: number | null
          quantity?: number | null
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
          device_id?: string | null
          id?: string
          max_supply?: number | null
          mint_address?: string | null
          mint_signature?: string | null
          nft_type?: string | null
          price_sol?: number | null
          price_usd?: number | null
          quantity?: number | null
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
