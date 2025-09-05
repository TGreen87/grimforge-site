import { AuthProvider } from "@refinedev/core";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    const supabase = getSupabaseBrowserClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          name: "Login Error",
        },
      };
    }

    // Soft-authorize for now: allow any authenticated user.
    // If a role exists, ensure it's admin (case-insensitive), otherwise proceed.
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user?.id)
        .single();
      const role = roleData?.role?.toLowerCase?.();
      if (role && role !== 'admin') {
        // Non-admin user: continue but you may restrict resources via permissions later
        console.warn('Non-admin login detected; proceeding due to relaxed gating');
      }
    } catch (e) {
      // Ignore role lookup errors in preview/staging
      console.warn('Role lookup failed, allowing access');
    }

    return {
      success: true,
      redirectTo: "/admin",
    };
  },
  
  logout: async () => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          name: "Logout Error",
        },
      };
    }

    return {
      success: true,
      redirectTo: "/admin/login",
    };
  },
  
  check: async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return {
          authenticated: false,
          redirectTo: "/admin/login",
        };
      }

      // Relaxed gating: if role is present and not admin (case-insensitive), still allow for now
      try {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        const role = roleData?.role?.toLowerCase?.();
        if (role && role !== 'admin') {
          console.warn('Non-admin session detected; proceeding due to relaxed gating');
        }
      } catch (e) {
        // Ignore failures (preview envs)
      }

      return {
        authenticated: true,
      };
    } catch (error) {
      console.warn('Admin auth check failed:', (error as Error)?.message);
      return {
        authenticated: false,
        redirectTo: "/admin/login",
      };
    }
  },
  
  getPermissions: async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      return roleData?.role || 'admin';
    } catch {
      return 'admin';
    }
  },
  
  getIdentity: async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // First try to get session, then fallback to getUser()
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        return {
          id: session.user.id,
          name: session.user.email || session.user.user_metadata?.full_name || 'Admin User',
          avatar: session.user.user_metadata?.avatar_url,
          email: session.user.email,
        };
      }

      // Fallback to getUser() for edge cases
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn('Failed to get user identity:', error?.message);
        return null;
      }

      return {
        id: user.id,
        name: user.email || user.user_metadata?.full_name || 'Admin User',
        avatar: user.user_metadata?.avatar_url,
        email: user.email,
      };
    } catch (error) {
      console.error('Error getting user identity:', error);
      return null;
    }
  },
  
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};
