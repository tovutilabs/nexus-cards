'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NexusButton, NexusCard, NexusInput } from '@/components/nexus';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export default function Setup2FAPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<'loading' | 'setup' | 'verify' | 'success'>('loading');
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.twoFactorEnabled) {
      router.push('/dashboard/settings');
      return;
    }

    fetchSetupData();
  }, [user, router]);

  const fetchSetupData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/2fa/setup`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (response.ok) {
        setQrCode(data.qrCode);
        setStep('setup');
      } else {
        setError(data.message || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleVerifyAndEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/2fa/enable`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBackupCodes(data.backupCodes || []);
        setStep('success');
      } else {
        setError(data.message || 'Invalid code');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = `Nexus Cards - 2FA Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-cards-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <NexusCard className="w-full max-w-2xl p-8">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Setting up 2FA...</p>
          </div>
        </NexusCard>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <NexusCard className="w-full max-w-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">2FA Enabled Successfully!</h1>
            <p className="text-gray-600">Save your backup codes in a safe place</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Backup Codes</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {backupCodes.map((code, index) => (
                <code key={index} className="bg-white px-4 py-2 rounded border text-center font-mono">
                  {code}
                </code>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Each backup code can only be used once. Store them securely.
            </p>
            <NexusButton
              variant="outline"
              className="w-full"
              onClick={downloadBackupCodes}
            >
              Download Backup Codes
            </NexusButton>
          </div>

          <Link href="/dashboard/settings">
            <NexusButton className="w-full">Go to Settings</NexusButton>
          </Link>
        </NexusCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white p-4">
      <NexusCard className="w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Enable Two-Factor Authentication</h1>
          <p className="text-gray-600">Secure your account with 2FA</p>
        </div>

        {error && (
          <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Scan QR Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
            </p>
            <div className="flex justify-center bg-white p-4 rounded-lg border">
              {qrCode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Step 2: Verify Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            <form onSubmit={handleVerifyAndEnable} className="space-y-4">
              <NexusInput
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <div className="flex gap-4">
                <Link href="/dashboard/settings" className="flex-1">
                  <NexusButton variant="outline" className="w-full">
                    Cancel
                  </NexusButton>
                </Link>
                <NexusButton
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || code.length !== 6}
                >
                  {isLoading ? 'Verifying...' : 'Enable 2FA'}
                </NexusButton>
              </div>
            </form>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">Important</h3>
            <p className="text-sm text-yellow-800">
              After enabling 2FA, you will receive backup codes. Store them securely as they can be used to access your account if you lose access to your authenticator app.
            </p>
          </div>
        </div>
      </NexusCard>
    </div>
  );
}
