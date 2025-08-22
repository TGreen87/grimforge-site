export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          slug: string
          title: string // Legacy compatibility
          artist: string
          description: string | null
          price: number
          base_price: number
          category: string | null
          format: string
          tags: string[]
          image: string | null
          image_url: string | null
          images: string[] | null
          sku: string | null
          stock: number
          active: boolean
          featured: boolean
          limited: boolean
          pre_order: boolean
          release_year: number | null
          status: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          title?: string
          artist: string
          description?: string | null
          price?: number
          base_price?: number
          category?: string | null
          format: string
          tags?: string[]
          image?: string | null
          image_url?: string | null
          images?: string[] | null
          sku?: string | null
          stock?: number
          active?: boolean
          featured?: boolean
          limited?: boolean
          pre_order?: boolean
          release_year?: number | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          title?: string
          artist?: string
          description?: string | null
          price?: number
          base_price?: number
          category?: string | null
          format?: string
          tags?: string[]
          image?: string | null
          image_url?: string | null
          images?: string[] | null
          sku?: string | null
          stock?: number
          active?: boolean
          featured?: boolean
          limited?: boolean
          pre_order?: boolean
          release_year?: number | null
          status?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_variants_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["product_id"]
          }
        ]
      }
      variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string
          price: number
          inventory_quantity: number
          options: Json | null
          images: string[] | null
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
          inventory_quantity?: number
          options?: Json | null
          images?: string[] | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string
          price?: number
          inventory_quantity?: number
          options?: Json | null
          images?: string[] | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_inventory_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["variant_id"]
          }
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string
          price: number
          inventory_quantity: number
          options: Json | null
          images: string[] | null
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
          inventory_quantity?: number
          options?: Json | null
          images?: string[] | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sku?: string
          price?: number
          inventory_quantity?: number
          options?: Json | null
          images?: string[] | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          variant_id: string
          quantity: number
          available: number
          reserved: number
          sold: number
          reserved_quantity: number
          location: string | null
          last_restock_date: string | null
          low_stock_threshold: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          variant_id: string
          quantity?: number
          available?: number
          reserved?: number
          sold?: number
          reserved_quantity?: number
          location?: string | null
          last_restock_date?: string | null
          low_stock_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          variant_id?: string
          quantity?: number
          available?: number
          reserved?: number
          sold?: number
          reserved_quantity?: number
          location?: string | null
          last_restock_date?: string | null
          low_stock_threshold?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_movements: {
        Row: {
          id: string
          variant_id: string
          type: string
          quantity: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          metadata: Json | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          variant_id: string
          type: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          metadata?: Json | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          variant_id?: string
          type?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          metadata?: Json | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_id: string | null
          status: string
          total: number
          currency: string
          payment_status: string | null
          payment_method: string | null
          stripe_payment_intent_id: string | null
          shipping_address: Json | null
          billing_address: Json | null
          items: Json
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          status?: string
          total: number
          currency?: string
          payment_status?: string | null
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          items: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          status?: string
          total?: number
          currency?: string
          payment_status?: string | null
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          shipping_address?: Json | null
          billing_address?: Json | null
          items?: Json
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          email: string
          name: string | null
          phone: string | null
          stripe_customer_id: string | null
          addresses: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          addresses?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          phone?: string | null
          stripe_customer_id?: string | null
          addresses?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          resource_type: string
          resource_id: string | null
          user_id: string | null
          user_email: string | null
          metadata: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          resource_type: string
          resource_id?: string | null
          user_id?: string | null
          user_email?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          resource_type?: string
          resource_id?: string | null
          user_id?: string | null
          user_email?: string | null
          metadata?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_inventory: {
        Args: {
          variant_id: string
          quantity: number
        }
        Returns: boolean
      }
      receive_stock: {
        Args: {
          variant_id: string
          quantity: number
          location?: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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