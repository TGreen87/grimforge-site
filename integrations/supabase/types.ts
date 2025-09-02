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
      products: {
        Row: {
          id: string
          title: string
          artist: string
          description: string | null
          format: string
          price: number
          stock: number
          active: boolean
          image: string | null
          sku: string | null
          release_year: number | null
          featured: boolean
          limited: boolean
          pre_order: boolean
          tags: string[]
          slug: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          artist: string
          description?: string | null
          format: string
          price?: number
          stock?: number
          active?: boolean
          image?: string | null
          sku?: string | null
          release_year?: number | null
          featured?: boolean
          limited?: boolean
          pre_order?: boolean
          tags?: string[]
          slug?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Row']>
        Relationships: []
      }
      variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string
          price: number
          size: string | null
          color: string | null
          weight: number | null
          dimensions: string | null
          barcode: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sku: string
          price: number
          size?: string | null
          color?: string | null
          weight?: number | null
          dimensions?: string | null
          barcode?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['variants']['Row']>
        Relationships: [
          {
            foreignKeyName: 'variants_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      inventory: {
        Row: {
          id: string
          variant_id: string
          on_hand: number
          allocated: number
          available: number
          reorder_point: number | null
          reorder_quantity: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          variant_id: string
          on_hand?: number
          allocated?: number
          reorder_point?: number | null
          reorder_quantity?: number | null
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['inventory']['Row']>
        Relationships: [
          {
            foreignKeyName: 'inventory_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'variants'
            referencedColumns: ['id']
          }
        ]
      }
      customers: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          stripe_customer_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['customers']['Row']>
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          customer_id: string
          type: 'billing' | 'shipping' | null
          line1: string
          line2: string | null
          city: string
          state: string
          postal_code: string
          country: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          type?: 'billing' | 'shipping' | null
          line1: string
          line2?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['addresses']['Row']>
        Relationships: [
          {
            foreignKeyName: 'addresses_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
          total: number
          subtotal: number | null
          tax: number | null
          shipping: number | null
          currency: string | null
          payment_status: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | null
          stripe_session_id: string | null
          stripe_payment_intent_id: string | null
          shipping_address: Json | null
          billing_address: Json | null
          email: string | null
          order_number: string | null
          metadata: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          status?: Database['public']['Tables']['orders']['Row']['status']
          total: number
          subtotal?: number | null
          tax?: number | null
          shipping?: number | null
          currency?: string | null
          payment_status?: 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | null
          stripe_session_id?: string | null
          stripe_payment_intent_id?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          email?: string | null
          order_number?: string | null
          metadata?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Row']>
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string
          quantity: number
          price: number
          total: number
          product_name: string | null
          variant_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          variant_id: string
          quantity: number
          price: number
          total: number
          product_name?: string | null
          variant_name?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['order_items']['Row']>
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'variants'
            referencedColumns: ['id']
          }
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database['public']['Enums']['app_role']
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: Database['public']['Enums']['app_role']
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_roles']['Row']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          event_type: string
          event_id: string | null
          user_id: string | null
          resource_type: string | null
          resource_id: string | null
          changes: Json | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          event_id?: string | null
          user_id?: string | null
          resource_type?: string | null
          resource_id?: string | null
          changes?: Json | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Row']>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role']
          _user_id: string
        }
        Returns: boolean
      }
      decrement_inventory: {
        Args: {
          p_variant_id: string
          p_quantity: number
          p_order_id: string
        }
        Returns: boolean
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
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Insert: infer I }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends { Update: infer U }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
      app_role: ['admin', 'moderator', 'user'],
    },
  },
} as const
