'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NexusButton, NexusCard } from '@/components/nexus';
import { useAuth } from '@/contexts/auth-context';

interface OAuthProvider {
  id: string;
  provider: string;
  email: string | null;
  isPrimary: boolean;
  createdAt: string;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [oauthProviders, setOAuthProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOAuthProviders();
  }, []);

  const fetchOAuthProviders = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/oauth/providers`,
        {
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOAuthProviders(data);
      }
    } catch (err) {
      console.error('Failed to fetch OAuth providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = () => {
    router.push('/auth/two-factor/setup');
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) {
      return;
    }

    const code = prompt('Enter your 2FA code to confirm:');
    if (!code) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/2fa/disable`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code }),
        }
      );

      if (response.ok) {
        alert('2FA disabled successfully');
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to disable 2FA');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleRegenerateBackupCodes = async () => {
    const code = prompt('Enter your 2FA code to regenerate backup codes:');
    if (!code) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/2fa/backup-codes/regenerate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ code }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // Create a formatted string of backup codes
        const codesText = `Nexus Cards - 2FA Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\n${data.backupCodes.join('\n')}\n\nKeep these codes in a safe place. Each code can only be used once.`;
        
        // Download as file
        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexus-cards-backup-codes.txt';
        a.click();
        URL.revokeObjectURL(url);

        alert('Backup codes regenerated and downloaded');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to regenerate backup codes');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    if (!confirm(`Are you sure you want to unlink ${provider}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/oauth/providers/${provider.toLowerCase()}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        fetchOAuthProviders();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to unlink provider');
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const handleLinkProvider = (provider: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.location.href = `${apiUrl}/auth/oauth/${provider.toLowerCase()}`;
  };

  const isProviderLinked = (provider: string) => {
    return oauthProviders.some(p => p.provider === provider);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600">Manage your account security and authentication methods</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Two-Factor Authentication */}
      <NexusCard>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add an extra layer of security to your account
            </p>
            {user?.twoFactorEnabled && (
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enabled
              </div>
            )}
          </div>
          <div className="ml-4">
            {user?.twoFactorEnabled ? (
              <div className="space-x-2">
                <NexusButton
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateBackupCodes}
                >
                  Regenerate Backup Codes
                </NexusButton>
                <NexusButton
                  variant="outline"
                  size="sm"
                  onClick={handleDisable2FA}
                >
                  Disable
                </NexusButton>
              </div>
            ) : (
              <NexusButton size="sm" onClick={handleEnable2FA}>
                Enable 2FA
              </NexusButton>
            )}
          </div>
        </div>
      </NexusCard>

      {/* Social Login Connections */}
      <NexusCard>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Login Connections</h2>
        <p className="text-sm text-gray-600 mb-6">
          Connect your account with social providers for easier login
        </p>

        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-indigo-600 border-r-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {['GOOGLE', 'LINKEDIN', 'MICROSOFT'].map((provider) => {
              const linked = isProviderLinked(provider);
              const providerData = oauthProviders.find(p => p.provider === provider);

              return (
                <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {provider === 'GOOGLE' && (
                        <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center">
                          <svg className="h-6 w-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                      )}
                      {provider === 'LINKEDIN' && (
                        <div className="h-10 w-10 rounded-full bg-[#0077B5] flex items-center justify-center">
                          <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </div>
                      )}
                      {provider === 'MICROSOFT' && (
                        <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center">
                          <svg className="h-6 w-6" viewBox="0 0 23 23" fill="none">
                            <path d="M0 0h11v11H0z" fill="#f25022"/>
                            <path d="M12 0h11v11H12z" fill="#00a4ef"/>
                            <path d="M0 12h11v11H0z" fill="#7fba00"/>
                            <path d="M12 12h11v11H12z" fill="#ffb900"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{provider.charAt(0) + provider.slice(1).toLowerCase()}</div>
                      {linked && providerData && (
                        <div className="text-sm text-gray-500">
                          {providerData.email}
                          {providerData.isPrimary && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                              Primary
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    {linked ? (
                      <NexusButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkProvider(provider)}
                      >
                        Unlink
                      </NexusButton>
                    ) : (
                      <NexusButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkProvider(provider)}
                      >
                        Connect
                      </NexusButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </NexusCard>

      {/* Email Verification */}
      {!user?.emailVerified && (
        <NexusCard>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Email Verification</h2>
              <p className="mt-1 text-sm text-gray-600">
                Your email address is not verified. Please check your inbox for a verification link.
              </p>
            </div>
            <div className="ml-4">
              <NexusButton
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await fetch(
                      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/email/resend-verification`,
                      {
                        method: 'POST',
                        credentials: 'include',
                      }
                    );
                    alert('Verification email sent!');
                  } catch (err) {
                    alert('Failed to send verification email');
                  }
                }}
              >
                Resend Email
              </NexusButton>
            </div>
          </div>
        </NexusCard>
      )}
    </div>
  );
}
