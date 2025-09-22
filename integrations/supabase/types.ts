
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13.0.4'
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          occurred_at: string
          pathname: string
          referrer: string | null
          search: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          occurred_at?: string
          pathname: string
          referrer?: string | null
          search?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          occurred_at?: string
          pathname?: string
          referrer?: string | null
          search?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          allocated: number
          available: number
          id: string
          on_hand: number
          reorder_point: number | null
          reorder_quantity: number | null
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          allocated?: number
          available?: number
          id?: string
          on_hand?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          allocated?: number
          available?: number
          id?: string
          on_hand?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'variants'
            referencedColumns: ['id']
          }
        ]
      }
      products: {
        Row: {
          active: boolean
          artist: string
          created_at: string
          description: string | null
          featured: boolean
          format: string
          id: string
          image: string | null
          limited: boolean
          pre_order: boolean
          price: number
          release_year: number | null
          sku: string | null
          slug: string | null
          stock: number
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist: string
          created_at?: string
          description?: string | null
          featured?: boolean
          format: string
          id?: string
          image?: string | null
          limited?: boolean
          pre_order?: boolean
          price?: number
          release_year?: number | null
          sku?: string | null
          slug?: string | null
          stock?: number
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          format?: string
          id?: string
          image?: string | null
          limited?: boolean
          pre_order?: boolean
          price?: number
          release_year?: number | null
          sku?: string | null
          slug?: string | null
          stock?: number
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database['public']['Enums']['app_role']
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database['public']['Enums']['app_role']
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database['public']['Enums']['app_role']
          user_id?: string
        }
        Relationships: []
      }
      assistant_documents: {
        Row: {
          chunk_index: number
          content: string
          created_at: string
          embedding: number[] | null
          id: string
          metadata: Json | null
          source_path: string
          title: string | null
          token_count: number | null
          updated_at: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string
          embedding?: number[] | null
          id?: string
          metadata?: Json | null
          source_path: string
          title?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string
          embedding?: number[] | null
          id?: string
          metadata?: Json | null
          source_path?: string
          title?: string | null
          token_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      variants: {
        Row: {
          active: boolean
          barcode: string | null
          color: string | null
          created_at: string | null
          dimensions: string | null
          id: string
          name: string
          price: number
          product_id: string
          size: string | null
          sku: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          color?: string | null
          created_at?: string | null
          dimensions?: string | null
          id?: string
          name: string
          price: number
          product_id: string
          size?: string | null
          sku: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          active?: boolean
          barcode?: string | null
          color?: string | null
          created_at?: string | null
          dimensions?: string | null
          id?: string
          name?: string
          price?: number
          product_id?: string
          size?: string | null
          sku?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      analytics_events_7d: {
        Row: {
          event_count: number | null
          event_day: string | null
          event_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role']
          _user_id: string
        }
        Returns: boolean
      }
      match_assistant_documents: {
        Args: {
          query_embedding: number[]
          match_count?: number
          match_threshold?: number
        }
        Returns: {
          content: string
          id: string
          metadata: Json | null
          similarity: number | null
          source_path: string
          chunk_index: number
          title: string | null
        }[]
      }
    }
    Enums: {
      app_role: 'admin' | 'moderator' | 'user'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views']
      )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'moderator', 'user']
    }
  }
} as const
