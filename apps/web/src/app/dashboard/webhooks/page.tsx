'use client';

import { useState } from 'react';
import { Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  eventType: string;
  attemptCount: number;
  responseStatus: number | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

const EVENT_TYPES = [
  { value: 'CARD_VIEW', label: 'Card View' },
  { value: 'CONTACT_CREATED', label: 'Contact Created' },
  { value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
  { value: 'NFC_TAG_SCAN', label: 'NFC Tag Scan' },
  { value: 'EXPERIMENT_EVENT', label: 'Experiment Event' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    const res = await fetch('/api/webhooks', {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setWebhooks(data);
    }
  };

  const fetchDeliveries = async (webhookId: string) => {
    const res = await fetch(`/api/webhooks/${webhookId}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      setDeliveries(data.deliveries || []);
    }
  };

  const createWebhook = async () => {
    if (!newWebhookUrl || selectedEvents.length === 0) return;

    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ url: newWebhookUrl, events: selectedEvents }),
    });

    if (res.ok) {
      const data = await res.json();
      setWebhookSecret(data.secret);
      await fetchWebhooks();
      setNewWebhookUrl('');
      setSelectedEvents([]);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    const res = await fetch(`/api/webhooks/${webhookId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (res.ok) {
      await fetchWebhooks();
      if (selectedWebhook === webhookId) {
        setSelectedWebhook(null);
        setDeliveries([]);
      }
    }
  };

  const toggleWebhook = async (webhookId: string, isActive: boolean) => {
    const res = await fetch(`/api/webhooks/${webhookId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !isActive }),
    });

    if (res.ok) {
      await fetchWebhooks();
    }
  };

  const regenerateSecret = async (webhookId: string) => {
    const res = await fetch(`/api/webhooks/${webhookId}/regenerate-secret`, {
      method: 'POST',
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      setWebhookSecret(data.secret);
    }
  };

  const retryDelivery = async (webhookId: string, deliveryId: string) => {
    const res = await fetch(
      `/api/webhooks/${webhookId}/deliveries/${deliveryId}/retry`,
      {
        method: 'POST',
        credentials: 'include',
      }
    );

    if (res.ok) {
      await fetchDeliveries(webhookId);
    }
  };

  const handleEventToggle = (eventValue: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventValue)
        ? prev.filter((e) => e !== eventValue)
        : [...prev, eventValue]
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">
            Manage webhook subscriptions for real-time events
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setWebhookSecret(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Webhook
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Webhook</DialogTitle>
            </DialogHeader>
            {webhookSecret ? (
              <div className="space-y-4">
                <div>
                  <Label>Webhook Secret</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Save this secret securely. You will need it to verify
                    webhook signatures.
                  </p>
                  <code className="block p-3 bg-muted rounded text-xs break-all">
                    {webhookSecret}
                  </code>
                </div>
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://example.com/webhooks"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Event Types</Label>
                  <div className="space-y-2 mt-2">
                    {EVENT_TYPES.map((event) => (
                      <div key={event.value} className="flex items-center">
                        <Checkbox
                          id={event.value}
                          checked={selectedEvents.includes(event.value)}
                          onCheckedChange={() => handleEventToggle(event.value)}
                        />
                        <label htmlFor={event.value} className="ml-2 text-sm">
                          {event.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={createWebhook} className="w-full">
                  Create
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Webhooks</h2>
          {webhooks.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No webhooks configured yet
            </Card>
          ) : (
            webhooks.map((webhook) => (
              <Card
                key={webhook.id}
                className={`p-4 cursor-pointer transition ${
                  selectedWebhook === webhook.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setSelectedWebhook(webhook.id);
                  fetchDeliveries(webhook.id);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <code className="text-sm">{webhook.url}</code>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge
                          key={event}
                          variant="outline"
                          className="text-xs"
                        >
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWebhook(webhook.id, webhook.isActive);
                      }}
                    >
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        regenerateSecret(webhook.id);
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWebhook(webhook.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Deliveries</h2>
          {!selectedWebhook ? (
            <Card className="p-6 text-center text-muted-foreground">
              Select a webhook to view deliveries
            </Card>
          ) : deliveries.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No deliveries yet
            </Card>
          ) : (
            <div className="space-y-2">
              {deliveries.map((delivery) => (
                <Card key={delivery.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm">
                        {delivery.eventType}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(delivery.createdAt).toLocaleString()}
                      </div>
                      <div className="text-xs mt-1">
                        Attempts: {delivery.attemptCount}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {delivery.deliveredAt ? (
                        <Badge variant="default">
                          {delivery.responseStatus}
                        </Badge>
                      ) : delivery.failedAt ? (
                        <>
                          <Badge variant="destructive">Failed</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              retryDelivery(selectedWebhook, delivery.id)
                            }
                          >
                            Retry
                          </Button>
                        </>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Verifying Webhook Signatures
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          All webhook requests include signature headers for verification:
        </p>
        <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
          {`X-Webhook-Signature: <hmac-sha256-hex>
X-Webhook-Timestamp: <unix-timestamp>

// Verify in Node.js:
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const timestamp = req.headers['x-webhook-timestamp'];
const payload = JSON.stringify(req.body);

const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(\`\${timestamp}.\${payload}\`)
  .digest('hex');

if (signature === expectedSignature) {
  // Valid webhook
}`}
        </pre>
      </Card>
    </div>
  );
}
