import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storageKeys } from "@/src/lib/storage";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const current = localStorage.getItem(storageKeys.user);
    if (current) {
      setUser(JSON.parse(current));
      setIsLoading(false);
      return;
    }
    const legacy = localStorage.getItem("blackplague_user");
    if (legacy) {
      localStorage.setItem(storageKeys.user, legacy);
      localStorage.removeItem("blackplague_user");
      setUser(JSON.parse(legacy));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful login
    const mockUser: User = {
      id: "user_" + Date.now(),
      email,
      name: email.split("@")[0],
      role: email.includes("admin") ? "admin" : 
           email.includes("wholesale") ? "wholesale" : "customer",
      joinedAt: new Date().toISOString()
    };
    
    setUser(mockUser);
    localStorage.setItem(storageKeys.user, JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock successful registration
    const mockUser: User = {
      id: "user_" + Date.now(),
      email,
      name,
      role: "customer",
      joinedAt: new Date().toISOString()
    };
    
    setUser(mockUser);
    localStorage.setItem(storageKeys.user, JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
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

