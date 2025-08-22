import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import { createClient } from "@/lib/supabase/client";

export const dataProvider = () => {
  const supabase = createClient();
  
  return supabaseDataProvider(supabase);
};