'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Check,
  CreditCard,
  AlertCircle,
  Calendar,
  TrendingUp,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Subscription {
  tier: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  cardsUsed: number;
  cardsLimit: number;
  contactsCount: number;
  contactsLimit: number;
  analyticsRetentionDays: number;
}

const tiers = [
  {
    name: 'FREE',
    displayName: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '1 digital card',
      '50 contacts',
      '7-day analytics',
      'QR code & NFC support',
      'Basic themes',
    ],
  },
  {
    name: 'PRO',
    displayName: 'Pro',
    price: '$9',
    period: 'per month',
    features: [
      '5 digital cards',
      'Unlimited contacts',
      '90-day analytics',
      'Priority support',
      'Custom themes',
      'Basic integrations',
      'Export contacts',
    ],
  },
  {
    name: 'PREMIUM',
    displayName: 'Premium',
    price: '$29',
    period: 'per month',
    features: [
      'Unlimited cards',
      'Unlimited contacts',
      'Unlimited analytics',
      'API access',
      'Advanced integrations',
      'Custom CSS',
      'White-label option',
      'Dedicated support',
    ],
  },
];

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [processing, setProcessing] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const loadData = async () => {
    try {
      const apiClient = createApiClient();
      const [userResponse, usageResponse] = await Promise.all([
        apiClient.get('/users/me'),
        apiClient.get('/billing/usage'),
      ]);

      setSubscription((userResponse as any).subscription);
      setUsage(usageResponse as Usage);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Success',
        description: 'Your subscription has been updated successfully!',
      });
    }

    if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Canceled',
        description: 'Subscription update was canceled.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  const handleUpgrade = async () => {
    if (!selectedTier) return;

    setProcessing(true);
    try {
      const apiClient = createApiClient();
      const response = (await apiClient.post('/billing/checkout-session', {
        tier: selectedTier,
      })) as { url: string; sessionId: string };

      window.location.href = response.url;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      const apiClient = createApiClient();
      await apiClient.delete('/billing/subscription');

      toast({
        title: 'Success',
        description:
          'Your subscription will be canceled at the end of the billing period',
      });

      setCancelDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel subscription',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openUpgradeDialog = (tier: string) => {
    setSelectedTier(tier);
    setUpgradeDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-800' },
      PAST_DUE: {
        label: 'Past Due',
        className: 'bg-yellow-100 text-yellow-800',
      },
      CANCELED: { label: 'Canceled', className: 'bg-red-100 text-red-800' },
      TRIALING: { label: 'Trial', className: 'bg-blue-100 text-blue-800' },
      INCOMPLETE: {
        label: 'Incomplete',
        className: 'bg-gray-100 text-gray-800',
      },
    };

    const config = statusMap[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-800',
    };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (loading || !subscription || !usage) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const currentTier = subscription.tier;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription and billing information
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Current Plan
            </h2>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-indigo-600">
                  {tiers.find((t) => t.name === currentTier)?.displayName ||
                    currentTier}
                </span>
                {getStatusBadge(subscription.status)}
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on{' '}
                    {new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {currentTier !== 'FREE' && !subscription.cancelAtPeriodEnd && (
              <Button
                variant="outline"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Usage & Limits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <CreditCard className="h-4 w-4" />
              <span>Digital Cards</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.cardsUsed} /{' '}
              {usage.cardsLimit === -1 ? 'Unlimited' : usage.cardsLimit}
            </div>
            {usage.cardsLimit !== -1 && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600"
                  style={{
                    width: `${(usage.cardsUsed / usage.cardsLimit) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <FileText className="h-4 w-4" />
              <span>Contacts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.contactsCount} /{' '}
              {usage.contactsLimit === -1 ? 'Unlimited' : usage.contactsLimit}
            </div>
            {usage.contactsLimit !== -1 && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600"
                  style={{
                    width: `${(usage.contactsCount / usage.contactsLimit) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics Retention</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {usage.analyticsRetentionDays === -1
                ? 'Unlimited'
                : `${usage.analyticsRetentionDays} days`}
            </div>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`p-6 ${
                tier.name === currentTier
                  ? 'border-indigo-600 border-2'
                  : 'border-gray-200'
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {tier.displayName}
                </h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  <span className="text-gray-600 ml-2">/ {tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.name === currentTier ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : tier.name === 'FREE' ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => openUpgradeDialog(tier.name)}
                  disabled={currentTier === 'FREE'}
                >
                  Downgrade
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => openUpgradeDialog(tier.name)}
                >
                  {currentTier === 'FREE' ? 'Upgrade' : 'Switch Plan'}
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      {subscription.status === 'PAST_DUE' && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">
                Payment Past Due
              </h3>
              <p className="text-sm text-yellow-800 mt-1">
                There was an issue processing your payment. Please update your
                payment method to continue using your subscription.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Switch to{' '}
              {tiers.find((t) => t.name === selectedTier)?.displayName}
            </DialogTitle>
            <DialogDescription>
              You will be redirected to Stripe to complete the payment. Your
              subscription will be updated immediately upon successful payment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={processing}>
              {processing ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Your subscription will remain active until the end of the current
              billing period. You will not be charged again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
