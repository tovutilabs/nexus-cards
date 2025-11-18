'use client';

import { useAuth } from '@/contexts/auth-context';

export function useAdminCheck() {
  const { user, loading } = useAuth();
  
  return {
    isAdmin: user?.role === 'ADMIN',
    isUser: user?.role === 'USER',
    loading,
    user,
  };
}

export function useRequireAdmin() {
  const { isAdmin, loading } = useAdminCheck();
  
  if (!loading && !isAdmin) {
    throw new Error('Admin access required');
  }
  
  return { isAdmin, loading };
}
