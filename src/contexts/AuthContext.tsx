import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storageKeys } from "@/src/lib/storage";
import { getSupabaseBrowserClient } from "@/integrations/supabase/browser";

interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "wholesale" | "admin";
  joinedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a default context instead of throwing error to prevent deployment crashes
    return {
      user: null,
      isLoading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      isAuthenticated: false
    };
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Map Supabase session user to our site User type
  const mapSupabaseUser = (u: any): User => ({
    id: u.id,
    email: u.email || '',
    name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'User',
    role: 'customer',
    joinedAt: u.created_at || new Date().toISOString(),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supabase = getSupabaseBrowserClient();

    // Bootstrap from Supabase session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        // Fallback to legacy/local user for non-Supabase flows
        const current = localStorage.getItem(storageKeys.user);
        if (current) setUser(JSON.parse(current));
        const legacy = localStorage.getItem('blackplague_user');
        if (!current && legacy) {
          localStorage.setItem(storageKeys.user, legacy);
          localStorage.removeItem('blackplague_user');
          setUser(JSON.parse(legacy));
        }
      }
      setIsLoading(false);
    });

    // Keep in sync with Supabase auth state
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
        localStorage.removeItem(storageKeys.user);
      }
    });
    return () => {
      subscription.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) setUser(mapSupabaseUser(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) throw error;
      if (data.user) setUser(mapSupabaseUser(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    localStorage.removeItem(storageKeys.user);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
