'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Zap, Users, CreditCard, TrendingUp, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Overview {
  totalViews: number;
  totalTaps: number;
  totalExchanges: number;
  totalCards: number;
  totalUsers: number;
}

interface DailyStat {
  date: string;
  totalViews: number;
  totalTaps: number;
  totalExchanges: number;
  uniqueCards: number;
}

interface TopCard {
  cardId: string;
  views: number;
  taps: number;
  exchanges: number;
  card: {
    slug: string;
    user: {
      email: string;
      profile?: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

interface TierStats {
  tier: string;
  totalViews: number;
  totalTaps: number;
  totalExchanges: number;
  uniqueCards: number;
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [topCards, setTopCards] = useState<TopCard[]>([]);
  const [tierStats, setTierStats] = useState<TierStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7');
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const apiClient = createApiClient();

      const [overviewData, dailyData, topCardsData, tierData] =
        await Promise.all([
          apiClient.get<Overview>(
            `/admin/analytics/overview?days=${dateRange}`
          ),
          apiClient.get<{ stats: DailyStat[] }>(
            `/admin/analytics/daily?days=${dateRange}`
          ),
          apiClient.get<{ cards: TopCard[] }>(
            '/admin/analytics/top-cards?limit=10'
          ),
          apiClient.get<{ stats: TierStats[] }>(
            `/admin/analytics/by-tier?days=${dateRange}`
          ),
        ]);

      setOverview(overviewData);
      setDailyStats(dailyData.stats);
      setTopCards(topCardsData.cards);
      setTierStats(tierData.stats);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTierBadge = (tier: string) => {
    const tierColors = {
      FREE: 'bg-gray-100 text-gray-800',
      PRO: 'bg-blue-100 text-blue-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge className={tierColors[tier as keyof typeof tierColors]}>
        {tier}
      </Badge>
    );
  };

  if (loading && !overview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Global Analytics</h1>
          <p className="text-gray-600 mt-1">
            System-wide analytics and insights
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {overview && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalViews.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Taps</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalTaps.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Exchanges</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalExchanges.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Cards</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalCards.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.totalUsers.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Activity
          </h2>
          {dailyStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No activity data yet
            </p>
          ) : (
            <div className="space-y-3">
              {dailyStats.map((stat) => (
                <div key={stat.date} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(stat.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-xs text-gray-500">
                      {stat.uniqueCards} cards
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Views</p>
                      <p className="font-semibold text-blue-600">
                        {stat.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Taps</p>
                      <p className="font-semibold text-purple-600">
                        {stat.totalTaps.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Exchanges</p>
                      <p className="font-semibold text-green-600">
                        {stat.totalExchanges.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Top Performing Cards
          </h2>
          {topCards.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No cards yet</p>
          ) : (
            <div className="space-y-3">
              {topCards.map((card, index) => (
                <div key={card.cardId} className="border-b pb-3 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {card.card.user.profile?.firstName}{' '}
                          {card.card.user.profile?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          /{card.card.slug}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-gray-600">Views</p>
                      <p className="font-bold text-blue-600">{card.views}</p>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <p className="text-gray-600">Taps</p>
                      <p className="font-bold text-purple-600">{card.taps}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-gray-600">Exchanges</p>
                      <p className="font-bold text-green-600">
                        {card.exchanges}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Performance by Subscription Tier
        </h2>
        {tierStats.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tier data yet</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {tierStats.map((stat) => (
              <div key={stat.tier} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  {getTierBadge(stat.tier)}
                  <span className="text-xs text-gray-500">
                    {stat.uniqueCards} cards
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Views</span>
                    <span className="font-semibold text-blue-600">
                      {stat.totalViews.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Taps</span>
                    <span className="font-semibold text-purple-600">
                      {stat.totalTaps.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Exchanges</span>
                    <span className="font-semibold text-green-600">
                      {stat.totalExchanges.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
