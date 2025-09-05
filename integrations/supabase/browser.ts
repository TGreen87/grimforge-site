'use client';

import { createBrowserClient } from '@supabase/ssr';

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Graceful fallback in preview environments without Supabase envs
  if (!url || !anon) {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-console
      console.warn('[Supabase] Missing env in client. Using no-op client to avoid runtime crash.');
    }
    const noop = async (..._args: any[]) => ({ data: null, error: null } as any);
    const chain = () => ({ select: chain, eq: chain, order: chain, single: chain, insert: chain, update: chain, delete: chain, rpc: chain, then: undefined } as any);
    const channelObj = { on: () => ({ subscribe: () => ({ id: 'noop' }) }) } as any;
    return {
      from: () => chain(),
      rpc: () => chain(),
      channel: () => channelObj,
      removeChannel: () => {},
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Auth not configured' } }),
        signOut: async () => ({ error: null }),
      },
    } as any;
  }

  return createBrowserClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    db: {
      schema: 'public'
    }
  });
}

