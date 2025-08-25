import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

export const dataProvider = () => {
  const supabase = getSupabaseBrowserClient();
  
  return supabaseDataProvider(supabase);
};