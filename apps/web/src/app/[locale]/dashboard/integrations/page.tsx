'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { createApiClient } from '@/lib/api-client';
import { Loader2, Check, X, ExternalLink, Zap, Cloud, Mail, Users } from 'lucide-react';

const apiClient = createApiClient();

interface Integration {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
}

interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

const INTEGRATION_PROVIDERS = [
  { id: 'SALESFORCE', name: 'Salesforce', icon: Users, type: 'CRM', description: 'Sync contacts to Salesforce' },
  { id: 'HUBSPOT', name: 'HubSpot', icon: Users, type: 'CRM', description: 'Sync contacts to HubSpot' },
  { id: 'ZOHO', name: 'Zoho CRM', icon: Users, type: 'CRM', description: 'Sync contacts to Zoho CRM' },
  { id: 'MAILCHIMP', name: 'Mailchimp', icon: Mail, type: 'Email', description: 'Sync to email lists' },
  { id: 'SENDGRID', name: 'SendGrid', icon: Mail, type: 'Email', description: 'Manage email subscribers' },
  { id: 'ZAPIER', name: 'Zapier', icon: Zap, type: 'Automation', description: 'Trigger Zapier workflows' },
  { id: 'GOOGLE_DRIVE', name: 'Google Drive', icon: Cloud, type: 'Storage', description: 'Export to Google Drive' },
  { id: 'DROPBOX', name: 'Dropbox', icon: Cloud, type: 'Storage', description: 'Export to Dropbox' },
];

const WEBHOOK_EVENTS = [
  { id: 'CONTACT_CREATED', name: 'Contact Created', description: 'When a new contact is added' },
  { id: 'CARD_VIEW', name: 'Card View', description: 'When your card is viewed' },
  { id: 'LINK_CLICK', name: 'Link Click', description: 'When a link is clicked' },
  { id: 'SUBSCRIPTION_UPDATED', name: 'Subscription Updated', description: 'When subscription changes' },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [integrationsData, webhooksData] = await Promise.all([
        apiClient.get<Integration[]>('/integrations'),
        apiClient.get<WebhookSubscription[]>('/integrations/webhooks'),
      ]);
      setIntegrations(integrationsData);
      setWebhooks(webhooksData);
    } catch (err: any) {
      setError(err.message || 'Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const getIntegration = (provider: string) => {
    return integrations.find((i) => i.provider === provider);
  };

  const handleConnect = (provider: string) => {
    setSelectedProvider(provider);
    setCredentials({});
    setError(null);
    setConnectDialogOpen(true);
  };

  const handleOAuthConnect = async (provider: string) => {
    setActionLoading(provider);
    try {
      const authUrl = `/integrations/oauth/${provider.toLowerCase()}/authorize`;
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to initiate OAuth');
      setActionLoading(null);
    }
  };

  const submitConnection = async () => {
    if (!selectedProvider) return;

    setActionLoading('connect');
    try {
      await apiClient.post('/integrations/connect', {
        provider: selectedProvider,
        credentials,
      });

      setSuccess(`${selectedProvider} connected successfully`);
      setConnectDialogOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to connect integration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Disconnect ${provider}?`)) return;

    setActionLoading(provider);
    try {
      await apiClient.delete(`/integrations/${provider}`);

      setSuccess(`${provider} disconnected`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (provider: string) => {
    setActionLoading(`sync-${provider}`);
    try {
      await apiClient.post(`/integrations/${provider}/sync`);

      setSuccess(`${provider} sync started`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to sync');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateWebhook = async () => {
    setActionLoading('webhook');
    try {
      await apiClient.post('/integrations/webhooks', {
        url: webhookUrl,
        events: webhookEvents,
      });

      setSuccess('Webhook created successfully');
      setWebhookDialogOpen(false);
      setWebhookUrl('');
      setWebhookEvents([]);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create webhook');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Delete this webhook?')) return;

    setActionLoading(`webhook-${id}`);
    try {
      await apiClient.delete(`/integrations/webhooks/${id}`);

      setSuccess('Webhook deleted');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete webhook');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleWebhook = async (id: string, isActive: boolean) => {
    setActionLoading(`webhook-${id}`);
    try {
      await apiClient.patch(`/integrations/webhooks/${id}`, {
        isActive: !isActive,
      });

      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update webhook');
    } finally {
      setActionLoading(null);
    }
  };

  const getCredentialFields = (provider: string) => {
    switch (provider) {
      case 'SALESFORCE':
        return [
          { key: 'instanceUrl', label: 'Instance URL', placeholder: 'https://your-instance.salesforce.com' },
          { key: 'accessToken', label: 'Access Token', placeholder: 'Your access token' },
        ];
      case 'HUBSPOT':
        return [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Your HubSpot access token' },
        ];
      case 'ZOHO':
        return [
          { key: 'accessToken', label: 'Access Token', placeholder: 'Your Zoho access token' },
          { key: 'apiDomain', label: 'API Domain', placeholder: 'https://www.zohoapis.com' },
        ];
      case 'MAILCHIMP':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'Your Mailchimp API key' },
          { key: 'audienceId', label: 'Audience ID', placeholder: 'Your audience list ID' },
        ];
      case 'SENDGRID':
        return [
          { key: 'apiKey', label: 'API Key', placeholder: 'Your SendGrid API key' },
          { key: 'listId', label: 'List ID', placeholder: 'Your contact list ID' },
        ];
      case 'ZAPIER':
        return [
          { key: 'webhookUrl', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/...' },
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-2">
          Connect your favorite tools and automate your workflows
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {INTEGRATION_PROVIDERS.map((provider) => {
          const integration = getIntegration(provider.id);
          const Icon = provider.icon;
          const isOAuth = provider.id === 'GOOGLE_DRIVE' || provider.id === 'DROPBOX';

          return (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  {integration && (
                    <Badge variant={integration.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {integration.status === 'ACTIVE' && <Check className="h-3 w-3 mr-1" />}
                      {integration.status === 'ERROR' && <X className="h-3 w-3 mr-1" />}
                      {integration.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {integration ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(provider.id)}
                        disabled={actionLoading === `sync-${provider.id}`}
                      >
                        {actionLoading === `sync-${provider.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Sync Now'
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(provider.id)}
                        disabled={actionLoading === provider.id}
                      >
                        {actionLoading === provider.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Disconnect'
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() =>
                        isOAuth ? handleOAuthConnect(provider.id) : handleConnect(provider.id)
                      }
                      disabled={actionLoading === provider.id}
                    >
                      {actionLoading === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Connect
                          {isOAuth && <ExternalLink className="h-3 w-3 ml-1" />}
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {integration?.lastSyncAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Webhooks</h2>
            <p className="text-muted-foreground">Receive real-time event notifications</p>
          </div>
          <Button onClick={() => setWebhookDialogOpen(true)}>
            Create Webhook
          </Button>
        </div>

        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-mono">{webhook.url}</CardTitle>
                    <CardDescription className="mt-1">
                      Events: {webhook.events.join(', ')}
                    </CardDescription>
                  </div>
                  <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                    {webhook.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleWebhook(webhook.id, webhook.isActive)}
                    disabled={actionLoading === `webhook-${webhook.id}`}
                  >
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                    disabled={actionLoading === `webhook-${webhook.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {webhooks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No webhooks configured yet
            </p>
          )}
        </div>
      </div>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {selectedProvider}</DialogTitle>
            <DialogDescription>
              Enter your credentials to connect this integration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedProvider &&
              getCredentialFields(selectedProvider).map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.key.includes('token') || field.key.includes('key') ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={credentials[field.key] || ''}
                    onChange={(e) =>
                      setCredentials({ ...credentials, [field.key]: e.target.value })
                    }
                  />
                </div>
              ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitConnection} disabled={actionLoading === 'connect'}>
              {actionLoading === 'connect' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Configure a webhook to receive event notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-app.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={event.id}
                    checked={webhookEvents.includes(event.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setWebhookEvents([...webhookEvents, event.id]);
                      } else {
                        setWebhookEvents(webhookEvents.filter((e) => e !== event.id));
                      }
                    }}
                  />
                  <div>
                    <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                      {event.name}
                    </label>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateWebhook}
              disabled={!webhookUrl || webhookEvents.length === 0 || actionLoading === 'webhook'}
            >
              {actionLoading === 'webhook' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
