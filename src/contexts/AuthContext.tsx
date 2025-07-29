import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("blackplague_user");
    console.log("AuthContext: Saved user from localStorage:", savedUser);
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log("AuthContext: Parsed user:", parsedUser);
      setUser(parsedUser);
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
    localStorage.setItem("blackplague_user", JSON.stringify(mockUser));
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
    localStorage.setItem("blackplague_user", JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("blackplague_user");
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};