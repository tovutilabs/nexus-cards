'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { NexusButton } from '@/components/nexus';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Nexus Cards
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Digital Business Card Platform
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/register">
            <NexusButton size="lg">
              Get Started
            </NexusButton>
          </Link>
          <Link href="/auth/login">
            <NexusButton variant="outline" size="lg">
              Sign In
            </NexusButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
