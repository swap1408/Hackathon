import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthAPI, AuthUser, getAccessToken, getStoredUser } from '@/lib/api';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from storage on mount
    const stored = getStoredUser();
    const token = getAccessToken();
    if (token && stored) {
      setUser(stored);
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const u = await AuthAPI.login(email, password);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const u = await AuthAPI.register(name, email, password);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await AuthAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
