'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createApiClient } from '@/lib/api-client';
import { Loader2, Bell, Mail } from 'lucide-react';

const apiClient = createApiClient();

interface NotificationPreferences {
  id: string;
  userId: string;
  newContactEmail: boolean;
  newContactInApp: boolean;
  analyticsMilestoneEmail: boolean;
  analyticsMilestoneInApp: boolean;
  paymentSuccessEmail: boolean;
  paymentSuccessInApp: boolean;
  nfcTagScanEmail: boolean;
  nfcTagScanInApp: boolean;
  cardViewMilestoneEmail: boolean;
  cardViewMilestoneInApp: boolean;
  subscriptionExpiringEmail: boolean;
  subscriptionExpiringInApp: boolean;
  marketingEmails: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<NotificationPreferences>('/notifications/preferences');
      setPreferences(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await apiClient.patch('/notifications/preferences', {
        newContactEmail: preferences.newContactEmail,
        newContactInApp: preferences.newContactInApp,
        analyticsMilestoneEmail: preferences.analyticsMilestoneEmail,
        analyticsMilestoneInApp: preferences.analyticsMilestoneInApp,
        paymentSuccessEmail: preferences.paymentSuccessEmail,
        paymentSuccessInApp: preferences.paymentSuccessInApp,
        nfcTagScanEmail: preferences.nfcTagScanEmail,
        nfcTagScanInApp: preferences.nfcTagScanInApp,
        cardViewMilestoneEmail: preferences.cardViewMilestoneEmail,
        cardViewMilestoneInApp: preferences.cardViewMilestoneInApp,
        subscriptionExpiringEmail: preferences.subscriptionExpiringEmail,
        subscriptionExpiringInApp: preferences.subscriptionExpiringInApp,
        marketingEmails: preferences.marketingEmails,
      });

      setSuccess('Notification preferences saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Alert variant="destructive">
          <AlertDescription>Failed to load notification preferences</AlertDescription>
        </Alert>
      </div>
    );
  }

  const notificationTypes = [
    {
      title: 'New Contact',
      description: 'When someone shares their contact information with you',
      emailKey: 'newContactEmail' as const,
      inAppKey: 'newContactInApp' as const,
    },
    {
      title: 'Analytics Milestone',
      description: 'When your cards reach view milestones',
      emailKey: 'analyticsMilestoneEmail' as const,
      inAppKey: 'analyticsMilestoneInApp' as const,
    },
    {
      title: 'Payment Success',
      description: 'When a payment is processed successfully',
      emailKey: 'paymentSuccessEmail' as const,
      inAppKey: 'paymentSuccessInApp' as const,
    },
    {
      title: 'NFC Tag Scan',
      description: 'When your NFC tag is scanned',
      emailKey: 'nfcTagScanEmail' as const,
      inAppKey: 'nfcTagScanInApp' as const,
    },
    {
      title: 'Card View Milestone',
      description: 'When your card is viewed a certain number of times',
      emailKey: 'cardViewMilestoneEmail' as const,
      inAppKey: 'cardViewMilestoneInApp' as const,
    },
    {
      title: 'Subscription Expiring',
      description: 'When your subscription is about to expire',
      emailKey: 'subscriptionExpiringEmail' as const,
      inAppKey: 'subscriptionExpiringInApp' as const,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage how you receive notifications
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Notification Channels</CardTitle>
            <CardDescription>
              Choose how you want to be notified for each event type
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {notificationTypes.map((type) => (
              <div key={type.title} className="border-b pb-6 last:border-b-0 last:pb-0">
                <div className="mb-4">
                  <h3 className="font-semibold mb-1">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.emailKey}`} className="cursor-pointer">
                        Email
                      </Label>
                    </div>
                    <Switch
                      id={`${type.emailKey}`}
                      checked={preferences[type.emailKey]}
                      onCheckedChange={(checked) => updatePreference(type.emailKey, checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor={`${type.inAppKey}`} className="cursor-pointer">
                        In-App
                      </Label>
                    </div>
                    <Switch
                      id={`${type.inAppKey}`}
                      checked={preferences[type.inAppKey]}
                      onCheckedChange={(checked) => updatePreference(type.inAppKey, checked)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketing Communications</CardTitle>
            <CardDescription>
              Receive updates about new features and product announcements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="marketingEmails" className="cursor-pointer">
                  Marketing Emails
                </Label>
              </div>
              <Switch
                id="marketingEmails"
                checked={preferences.marketingEmails}
                onCheckedChange={(checked) => updatePreference('marketingEmails', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={loadPreferences} disabled={saving}>
            Reset
          </Button>
          <Button onClick={savePreferences} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
