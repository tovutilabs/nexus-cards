'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { LineChart, BarChart, PieChart } from '@/components/charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Users, MousePointerClick, Share2 } from 'lucide-react';

interface AnalyticsData {
  views: number;
  uniqueVisitors: number;
  contactExchanges: number;
  linkClicks: number;
  viewsOverTime: Array<{ label: string; value: number }>;
  topReferrers: Array<{ label: string; value: number }>;
  deviceBreakdown: Array<{ label: string; value: number }>;
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCard, setSelectedCard] = useState('all');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          timeRange,
          cardId: selectedCard,
        });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/analytics?${params}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, selectedCard]);

  const stats = [
    {
      title: t('views'),
      value: data?.views || 0,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('uniqueVisitors'),
      value: data?.uniqueVisitors || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('contactExchanges'),
      value: data?.contactExchanges || 0,
      icon: Share2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('linkClicks'),
      value: data?.linkClicks || 0,
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('views')} Dashboard
        </h1>
        <p className="text-gray-600">
          Track your card performance and engagement metrics
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-full sm:w-[200px]"
            aria-label="Select time range"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">{t('last7Days')}</SelectItem>
            <SelectItem value="30d">{t('last30Days')}</SelectItem>
            <SelectItem value="90d">{t('last90Days')}</SelectItem>
            <SelectItem value="all">{t('allTime')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCard} onValueChange={setSelectedCard}>
          <SelectTrigger
            className="w-full sm:w-[200px]"
            aria-label="Select card"
          >
            <SelectValue placeholder="All Cards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cards</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrers">Referrers</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : (
                <LineChart
                  data={data?.viewsOverTime || []}
                  height={300}
                  color="#2d3494"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('topReferrers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : (
                <BarChart
                  data={data?.topReferrers || []}
                  height={300}
                  color="#0784b5"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('deviceBreakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : (
                <PieChart data={data?.deviceBreakdown || []} size={300} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
