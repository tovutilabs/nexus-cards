'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Integration {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
}

const integrationProviders = [
  {
    id: 'SALESFORCE',
    name: 'Salesforce',
    description: 'Sync contacts with Salesforce CRM',
    icon: '🌩️',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
    ],
  },
  {
    id: 'HUBSPOT',
    name: 'HubSpot',
    description: 'Manage contacts in HubSpot',
    icon: '🟠',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }],
  },
  {
    id: 'ZOHO',
    name: 'Zoho CRM',
    description: 'Connect with Zoho CRM',
    icon: '🔷',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
    ],
  },
  {
    id: 'MAILCHIMP',
    name: 'Mailchimp',
    description: 'Add contacts to Mailchimp lists',
    icon: '📧',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'server', label: 'Server Prefix (e.g., us1)', type: 'text' },
    ],
  },
  {
    id: 'SENDGRID',
    name: 'SendGrid',
    description: 'Send emails via SendGrid',
    icon: '✉️',
    fields: [{ key: 'apiKey', label: 'API Key', type: 'password' }],
  },
  {
    id: 'ZAPIER',
    name: 'Zapier',
    description: 'Trigger Zapier workflows',
    icon: '⚡',
    fields: [{ key: 'webhookUrl', label: 'Webhook URL', type: 'text' }],
  },
  {
    id: 'GOOGLE_DRIVE',
    name: 'Google Drive',
    description: 'Save contacts to Google Drive',
    icon: '📁',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', type: 'password' },
    ],
  },
  {
    id: 'DROPBOX',
    name: 'Dropbox',
    description: 'Store contact files in Dropbox',
    icon: '📦',
    fields: [{ key: 'accessToken', label: 'Access Token', type: 'password' }],
  },
];

export default function IntegrationsPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get('/integrations');
      setIntegrations(data as Integration[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openConnectDialog = (provider: any) => {
    setSelectedProvider(provider);
    setCredentials({});
    setConnectDialogOpen(true);
  };

  const handleConnect = async () => {
    if (!selectedProvider) return;

    setProcessing(true);
    try {
      const apiClient = createApiClient();
      await apiClient.post('/integrations/connect', {
        provider: selectedProvider.id,
        credentials,
      });

      toast({
        title: 'Success',
        description: `Connected to ${selectedProvider.name}`,
      });

      setConnectDialogOpen(false);
      loadIntegrations();
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description:
          error.message || `Failed to connect to ${selectedProvider.name}`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisconnect = async (provider: string, providerName: string) => {
    if (!confirm(`Are you sure you want to disconnect from ${providerName}?`)) {
      return;
    }

    try {
      const apiClient = createApiClient();
      await apiClient.delete(`/integrations/${provider}`);

      toast({
        title: 'Success',
        description: `Disconnected from ${providerName}`,
      });

      loadIntegrations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message || `Failed to disconnect from ${providerName}`,
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (provider: string, providerName: string) => {
    setSyncing(provider);
    try {
      const apiClient = createApiClient();
      const result = (await apiClient.post(
        `/integrations/${provider}/sync`,
        {}
      )) as { message?: string };

      toast({
        title: 'Sync Complete',
        description: result.message || `Synced with ${providerName}`,
      });

      loadIntegrations();
    } catch (error: any) {
      toast({
        title: 'Sync Failed',
        description: error.message || `Failed to sync with ${providerName}`,
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  const isConnected = (providerId: string): boolean => {
    return integrations.some((i) => i.provider === providerId);
  };

  const getIntegration = (providerId: string): Integration | undefined => {
    return integrations.find((i) => i.provider === providerId);
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (status === 'ERROR') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-2">
          Connect your favorite tools to sync contacts and automate workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrationProviders.map((provider) => {
          const integration = getIntegration(provider.id);
          const connected = isConnected(provider.id);

          return (
            <Card key={provider.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{provider.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {provider.description}
                    </p>
                  </div>
                </div>
                {connected && integration && getStatusBadge(integration.status)}
              </div>

              {integration?.lastSyncAt && (
                <p className="text-xs text-gray-500 mb-4">
                  Last synced:{' '}
                  {new Date(integration.lastSyncAt).toLocaleString()}
                </p>
              )}

              <div className="flex gap-2">
                {connected ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(provider.id, provider.name)}
                      disabled={syncing === provider.id}
                    >
                      {syncing === provider.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openConnectDialog(provider)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Reconfigure
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDisconnect(provider.id, provider.name)
                      }
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => openConnectDialog(provider)}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to {selectedProvider?.name}</DialogTitle>
            <DialogDescription>
              Enter your {selectedProvider?.name} credentials to establish the
              connection.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedProvider?.fields.map((field: any) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={credentials[field.key] || ''}
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      [field.key]: e.target.value,
                    })
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={processing}>
              {processing ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
