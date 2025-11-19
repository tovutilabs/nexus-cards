'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye } from 'lucide-react';

interface CardData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  bio?: string;
  status: string;
  socialLinks?: Record<string, string>;
  theme?: Record<string, any>;
}

interface NfcTag {
  id: string;
  uid: string;
  status: string;
  assignedAt?: string;
}

export default function EditCardPage() {
  const [card, setCard] = useState<CardData | null>(null);
  const [nfcTags, setNfcTags] = useState<NfcTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const cardId = params.id as string;

  useEffect(() => {
    loadCard();
    loadNfcTags();
  }, [cardId]);

  const loadCard = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<CardData>(`/cards/${cardId}`);
      setCard(data);
    } catch (error) {
      console.error('Failed to load card:', error);
      alert('Failed to load card');
      router.push('/dashboard/cards');
    } finally {
      setLoading(false);
    }
  };

  const loadNfcTags = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<NfcTag[]>('/nfc/tags');
      const cardTags = data.filter((tag: any) => tag.cardId === cardId);
      setNfcTags(cardTags);
    } catch (error) {
      console.error('Failed to load NFC tags:', error);
    }
  };

  const handleSave = async () => {
    if (!card) return;

    setSaving(true);
    try {
      const apiClient = createApiClient();
      const { id: _id, slug: _slug, createdAt: _createdAt, updatedAt: _updatedAt, userId: _userId, ...updateData } = card as any;
      await apiClient.patch(`/cards/${cardId}`, updateData);
      alert('Card updated successfully!');
    } catch (error) {
      console.error('Failed to update card:', error);
      alert('Failed to update card');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!card) return;

    try {
      const apiClient = createApiClient();
      await apiClient.patch(`/cards/${cardId}`, { status: 'PUBLISHED' });
      setCard({ ...card, status: 'PUBLISHED' });
      alert('Card published successfully!');
    } catch (error) {
      console.error('Failed to publish card:', error);
      alert('Failed to publish card');
    }
  };

  const updateField = (field: string, value: any) => {
    if (!card) return;
    setCard({ ...card, [field]: value });
  };

  if (loading || !card) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/cards')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {card.firstName} {card.lastName}
            </h1>
            <p className="text-gray-600 mt-1">nexus.cards/p/{card.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={
              card.status === 'PUBLISHED'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }
          >
            {card.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/p/${card.slug}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          {card.status === 'DRAFT' && (
            <Button size="sm" onClick={handlePublish}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="nfc">NFC Tags ({nfcTags.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={card.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={card.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={card.jobTitle || ''}
                  onChange={(e) => updateField('jobTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={card.company || ''}
                  onChange={(e) => updateField('company', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={card.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={card.phone || ''}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={card.bio || ''}
                  onChange={(e) => updateField('bio', e.target.value)}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="design">
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Design customization coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                Customize colors, fonts, and layout
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="p-6">
            <div className="text-center py-12">
              <p className="text-gray-600">Social links management coming soon</p>
              <p className="text-sm text-gray-500 mt-2">
                Add LinkedIn, Twitter, GitHub, and more
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="nfc">
          <Card className="p-6">
            {nfcTags.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No NFC tags associated with this card</p>
                <p className="text-sm text-gray-500 mt-2">
                  Contact your administrator to assign NFC tags
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {nfcTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">UID: {tag.uid}</p>
                      <p className="text-sm text-gray-500">
                        Status: {tag.status}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Disassociate
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
