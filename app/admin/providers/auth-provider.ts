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

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user?.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      await supabase.auth.signOut();
      return {
        success: false,
        error: {
          message: "You don't have permission to access the admin panel",
          name: "Authorization Error",
        },
      };
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
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return {
        authenticated: false,
        redirectTo: "/admin/login",
      };
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (roleData?.role !== 'admin') {
      return {
        authenticated: false,
        redirectTo: "/admin/login",
      };
    }

    return {
      authenticated: true,
    };
  },
  
  getPermissions: async () => {
    const supabase = getSupabaseBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    return roleData?.role || null;
  },
  
  getIdentity: async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      
      // Use getUser() instead of getSession() for better reliability in edge runtime
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