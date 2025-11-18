'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface CardData {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  jobTitle?: string;
  company?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  theme?: string;
  createdAt: string;
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<CardData[]>('/cards');
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this card?')) {
      return;
    }

    try {
      const apiClient = createApiClient();
      await apiClient.delete(`/cards/${id}`);
      setCards(cards.filter((card) => card.id !== id));
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('Failed to delete card');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Cards</h1>
          <p className="text-gray-600 mt-1">
            Manage your digital business cards
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/cards/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Card
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No cards yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first digital business card
          </p>
          <Button onClick={() => router.push('/dashboard/cards/new')}>
            Create Your First Card
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {card.firstName} {card.lastName}
                    </h3>
                    {card.jobTitle && (
                      <p className="text-sm text-gray-600">{card.jobTitle}</p>
                    )}
                    {card.company && (
                      <p className="text-sm text-gray-500">{card.company}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(card.status)}>
                    {card.status}
                  </Badge>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  nexus.cards/p/{card.slug}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(`/p/${card.slug}`, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/cards/${card.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
