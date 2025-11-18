'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Search, Nfc } from 'lucide-react';

interface NfcTag {
  id: string;
  uid: string;
  status: string;
  userId?: string;
  cardId?: string;
  assignedAt?: string;
  user?: {
    email: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
  };
  card?: {
    slug: string;
    firstName: string;
    lastName: string;
  };
}

interface TagStats {
  total: number;
  unassociated: number;
  associated: number;
  deactivated: number;
}

export default function AdminNfcPage() {
  const [tags, setTags] = useState<NfcTag[]>([]);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkUids, setBulkUids] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTags();
    loadStats();
  }, []);

  const loadTags = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<NfcTag[]>('/nfc/admin/tags');
      setTags(data);
    } catch (error) {
      console.error('Failed to load NFC tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<TagStats>('/nfc/admin/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkUids.trim()) {
      alert('Please enter UIDs to import');
      return;
    }

    const uids = bulkUids
      .split('\n')
      .map((uid) => uid.trim())
      .filter((uid) => uid.length > 0);

    if (uids.length === 0) {
      alert('No valid UIDs found');
      return;
    }

    setUploading(true);
    try {
      const apiClient = createApiClient();
      const result = await apiClient.post<{
        imported: string[];
        skipped: string[];
        errors: any[];
      }>('/nfc/admin/import', { uids });

      alert(
        `Import complete!\n` +
        `Imported: ${result.imported.length}\n` +
        `Skipped: ${result.skipped.length}\n` +
        `Errors: ${result.errors.length}`
      );

      setBulkUids('');
      loadTags();
      loadStats();
    } catch (error: any) {
      console.error('Failed to import tags:', error);
      alert(error.message || 'Failed to import tags');
    } finally {
      setUploading(false);
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

  const filteredTags = tags.filter(
    (tag) =>
      tag.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.card?.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">NFC Tag Management</h1>
        <p className="text-gray-600 mt-1">Import, assign, and manage NFC tags</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Tags</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Unassociated</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.unassociated}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Associated</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.associated}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Deactivated</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">
              {stats.deactivated}
            </p>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bulk Import NFC Tags
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter UIDs (one per line)
            </label>
            <textarea
              className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="04A1B2C3D4E5F6&#10;04B2C3D4E5F607&#10;04C3D4E5F60809"
              value={bulkUids}
              onChange={(e) => setBulkUids(e.target.value)}
            />
          </div>
          <Button onClick={handleBulkImport} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Importing...' : 'Import Tags'}
          </Button>
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by UID, user email, or card slug..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredTags.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Nfc className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No tags found' : 'No NFC tags yet'}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Import NFC tags using the form above'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTags.map((tag) => (
              <Card key={tag.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
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

                  <div className="flex items-center gap-6">
                    {tag.user && (
                      <div className="text-sm">
                        <span className="text-gray-600">Assigned to:</span>{' '}
                        <span className="font-medium">
                          {tag.user.profile?.firstName} {tag.user.profile?.lastName}
                        </span>
                        <span className="text-gray-500 ml-1">
                          ({tag.user.email})
                        </span>
                      </div>
                    )}

                    {tag.card && (
                      <div className="text-sm">
                        <span className="text-gray-600">Linked to:</span>{' '}
                        <span className="font-medium">
                          {tag.card.firstName} {tag.card.lastName}
                        </span>
                        <span className="text-gray-500 ml-1">
                          (/{tag.card.slug})
                        </span>
                      </div>
                    )}

                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
