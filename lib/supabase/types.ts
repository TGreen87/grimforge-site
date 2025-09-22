import type { Database as SupabaseDatabase, Json as SupabaseJson } from '@/integrations/supabase/types'

export type Database = SupabaseDatabase
export type Json = SupabaseJson

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
