'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import {
  User,
  LoginData,
  RegisterData,
  AuthTokens,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  UpdateProfileData,
} from '@/lib/auth';

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

  const fetchUser = useCallback(async (token: string) => {
    try {
      const apiClient = createApiClient(token);
      const userData = await apiClient.get<User>('/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      removeAuthToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      fetchUser(token).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (data: LoginData) => {
    const apiClient = createApiClient();
    const tokens = await apiClient.post<AuthTokens>('/auth/login', data);
    setAuthToken(tokens.accessToken);
    await fetchUser(tokens.accessToken);
    router.push('/dashboard');
  };

  const register = async (data: RegisterData) => {
    const apiClient = createApiClient();
    const tokens = await apiClient.post<AuthTokens>('/auth/register', data);
    setAuthToken(tokens.accessToken);
    await fetchUser(tokens.accessToken);
    router.push('/dashboard');
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    router.push('/auth/login');
  };

  const updateProfile = async (data: UpdateProfileData) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    const apiClient = createApiClient(token);
    const updatedUser = await apiClient.patch<User>('/users/me/profile', data);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (token) {
      await fetchUser(token);
    }
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
