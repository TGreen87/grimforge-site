import { dataProvider as supabaseDataProvider } from "@refinedev/supabase";
import type { DataProvider } from "@refinedev/core";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

async function handleApi<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return body?.data ?? body;
}

export const dataProvider = (): DataProvider => {
  const supabase = getSupabaseBrowserClient();
  const base = supabaseDataProvider(supabase);

  return {
    ...base,
    create: async ({ resource, variables, meta }) => {
      if (resource === "products") {
        const data = await handleApi("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variables),
        });
        return { data } as any;
      }
      return base.create({ resource, variables, meta });
    },
    update: async ({ resource, id, variables, meta }) => {
      if (resource === "products") {
        const data = await handleApi(`/api/admin/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variables),
        });
        return { data } as any;
      }
      return base.update({ resource, id, variables, meta });
    },
    deleteOne: async ({ resource, id, meta }) => {
      if (resource === "products") {
        const data = await handleApi(`/api/admin/products/${id}`, {
          method: "DELETE",
        });
        return { data } as any;
      }
      return base.deleteOne({ resource, id, meta });
    },
  };
};
