'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

export default function ShareTokenPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/share/${token}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.requiresPassword) {
          setRequiresPassword(true);
          setLoading(false);
        } else if (data.card) {
          // Redirect to the card page
          router.push(`/p/${data.card.slug}?token=${token}`);
        }
      } else if (response.status === 401) {
        setError('This share link is invalid or has expired.');
        setLoading(false);
      } else {
        throw new Error('Failed to validate share link');
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setError('Failed to load share link. Please try again.');
      setLoading(false);
    }
  };

  const validatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setValidating(true);
      setError('');

      const response = await fetch(`/api/public/share/${token}/validate-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.card) {
          // Redirect to the card page
          router.push(`/p/${data.card.slug}?token=${token}&password=${encodeURIComponent(password)}`);
        }
      } else if (response.status === 401) {
        setError('Invalid password. Please try again.');
      } else {
        throw new Error('Failed to validate password');
      }
    } catch (error) {
      console.error('Error validating password:', error);
      setError('Failed to validate password. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading share link...</p>
        </div>
      </div>
    );
  }

  if (error && !requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Share Link Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button className="w-full mt-4" onClick={() => router.push('/')}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>
              This card requires a password to view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={validatePassword} className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={validating}>
                {validating ? 'Validating...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
