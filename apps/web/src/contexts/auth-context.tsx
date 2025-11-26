'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { User, LoginData, RegisterData, UpdateProfileData } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<any>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    try {
      const apiClient = createApiClient();
      const userData = await apiClient.get<User>('/users/me');
      setUser(userData);
      return true;
    } catch (error) {
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const login = async (data: LoginData) => {
    const apiClient = createApiClient();
    const result = await apiClient.post<{ user?: User; requires2FA?: boolean }>('/auth/login', data);
    
    // Check if 2FA is required
    if (result.requires2FA) {
      return result; // Return the result so login page can handle redirect
    }
    
    if (result.user) {
      // Set user state immediately
      setUser(result.user);
      
      // Redirect admin users to admin dashboard, regular users to dashboard
      const targetPath = result.user.role === 'ADMIN' ? '/admin' : '/dashboard';
      router.push(targetPath);
    }
    
    return result;
  };

  const register = async (data: RegisterData) => {
    const apiClient = createApiClient();
    const result = await apiClient.post<{ user: User }>('/auth/register', data);
    setUser(result.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      const apiClient = createApiClient();
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  };

  const updateProfile = async (data: UpdateProfileData) => {
    const apiClient = createApiClient();
    const updatedUser = await apiClient.patch<User>('/users/me/profile', data);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
