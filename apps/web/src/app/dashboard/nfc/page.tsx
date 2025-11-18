'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Nfc, Link as LinkIcon } from 'lucide-react';

interface NfcTag {
  id: string;
  uid: string;
  status: string;
  cardId?: string;
  assignedAt?: string;
  card?: {
    slug: string;
    firstName: string;
    lastName: string;
  };
}

export default function NfcPage() {
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<NfcTag[]>('/nfc/tags');
      setTags(data);
    } catch (error) {
      console.error('Failed to load NFC tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSOCIATED':
        return 'bg-green-100 text-green-800';
      case 'UNASSOCIATED':
        return 'bg-yellow-100 text-yellow-800';
      case 'DEACTIVATED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">NFC Tags</h1>
        <p className="text-gray-600 mt-1">
          Manage your NFC tags and their associations
        </p>
      </div>

      {tags.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Nfc className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No NFC tags assigned
          </h3>
          <p className="text-gray-600">
            Contact your administrator to have NFC tags assigned to your account
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Card key={tag.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Nfc className="h-5 w-5 text-indigo-600" />
                  <span className="font-mono text-sm font-semibold">
                    {tag.uid}
                  </span>
                </div>
                <Badge className={getStatusColor(tag.status)}>
                  {tag.status}
                </Badge>
              </div>

              {tag.status === 'ASSOCIATED' && tag.card ? (
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Linked to:</p>
                    <p className="font-medium">
                      {tag.card.firstName} {tag.card.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      nexus.cards/p/{tag.card.slug}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Change Association
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p className="mb-3">This tag is not linked to any card</p>
                  <Button variant="outline" size="sm" className="w-full">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Associate with Card
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
