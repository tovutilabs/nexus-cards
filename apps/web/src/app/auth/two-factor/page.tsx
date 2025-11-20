'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NexusButton, NexusCard, NexusInput } from '@/components/nexus';
import Link from 'next/link';

function TwoFactorVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const email = searchParams.get('email');
  const password = searchParams.get('password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Session expired. Please login again.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/login/2fa`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            email,
            password,
            twoFactorCode: code,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message || 'Invalid code');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <NexusCard className="w-full max-w-md p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Expired</h1>
            <p className="text-gray-600 mb-6">
              Your session has expired. Please login again.
            </p>
            <Link href="/auth/login">
              <NexusButton className="w-full">Back to Login</NexusButton>
            </Link>
          </div>
        </NexusCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <NexusCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
          <p className="text-gray-600">Enter the code from your authenticator app</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Authentication Code
            </label>
            <NexusInput
              id="code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <NexusButton
            type="submit"
            className="w-full"
            disabled={isLoading || code.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </NexusButton>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Lost access to your authenticator?{' '}
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
                Use backup code
              </Link>
            </p>
          </div>

          <div className="text-center text-sm">
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
              Back to Login
            </Link>
          </div>
        </form>
      </NexusCard>
    </div>
  );
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
      </div>
    }>
      <TwoFactorVerifyContent />
    </Suspense>
  );
}
