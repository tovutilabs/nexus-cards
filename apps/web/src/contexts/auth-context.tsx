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

/* eslint-disable no-console */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
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
      console.error('Failed to fetch user:', error);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    fetchUser().finally(() => setLoading(false));
  }, [fetchUser]);

  const login = async (data: LoginData) => {
    const apiClient = createApiClient();
    const result = await apiClient.post<{ user: User }>('/auth/login', data);
    setUser(result.user);
    router.push('/dashboard');
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
