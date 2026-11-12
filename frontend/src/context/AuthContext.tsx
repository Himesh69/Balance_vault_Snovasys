import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../lib/api.js';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ACCOUNT_HOLDER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  onboarding?: {
    id: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
    reviewNotes?: string;
  };
  accounts?: Array<{
    id: string;
    accountNumber: string;
    status: string;
    cachedBalance: number;
    currency: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('bv_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      if (!token) {
        setUser(null);
        return;
      }
      const data = await apiRequest<User>('/auth/me');
      setUser(data);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('bv_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('bv_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

