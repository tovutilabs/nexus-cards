'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface CookieConsentProps {
  onAccept?: (preferences: CookiePreferences) => void;
}

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export function CookieConsent({ onAccept }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allAccepted);
  };

  const acceptSelected = () => {
    saveConsent(preferences);
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(onlyNecessary);
  };

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());

    const sessionId = getOrCreateSessionId();

    fetch('/api/compliance/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        ...prefs,
      }),
    }).catch((err) => console.error('Failed to record cookie consent:', err));

    setVisible(false);
    if (onAccept) onAccept(prefs);
  };

  const getOrCreateSessionId = () => {
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-2xl">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={rejectAll}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>Cookie Preferences</CardTitle>
          <CardDescription>
            We use cookies to enhance your experience, analyze site usage, and assist in our 
            marketing efforts. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDetails ? (
            <>
              <p className="text-sm text-muted-foreground">
                We respect your privacy. You can customize your cookie preferences or accept all
                cookies to continue. Read our{' '}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="/cookie-policy" className="text-primary hover:underline">
                  Cookie Policy
                </a>{' '}
                for more information.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={acceptAll} className="flex-1">
                  Accept All
                </Button>
                <Button variant="outline" onClick={rejectAll} className="flex-1">
                  Reject All
                </Button>
                <Button variant="ghost" onClick={() => setShowDetails(true)} className="flex-1">
                  Customize
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Necessary Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors interact with our website
                    </p>
                  </div>
                  <Switch
                    checked={preferences.analytics}
                    onCheckedChange={(checked) => updatePreference('analytics', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Used to show you relevant ads based on your interests
                    </p>
                  </div>
                  <Switch
                    checked={preferences.marketing}
                    onCheckedChange={(checked) => updatePreference('marketing', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Preference Cookies</Label>
                    <p className="text-xs text-muted-foreground">
                      Remember your settings and preferences
                    </p>
                  </div>
                  <Switch
                    checked={preferences.preferences}
                    onCheckedChange={(checked) => updatePreference('preferences', checked)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4">
                <Button onClick={acceptSelected} className="flex-1">
                  Save Preferences
                </Button>
                <Button variant="outline" onClick={() => setShowDetails(false)} className="flex-1">
                  Back
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
