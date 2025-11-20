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
import { Button } from '@/components/ui/button';
import { Eye, Users, MousePointerClick, Share2, Download, Globe, Monitor, Link as LinkIcon } from 'lucide-react';

interface AnalyticsData {
  views: number;
  uniqueVisitors: number;
  contactExchanges: number;
  linkClicks: number;
  viewsOverTime: Array<{ label: string; value: number }>;
  topReferrers: Array<{ label: string; value: number }>;
  deviceBreakdown: Array<{ label: string; value: number }>;
  browserBreakdown: Array<{ label: string; value: number }>;
  geoData: {
    countries: Array<{ label: string; value: number }>;
    regions: Array<{ label: string; value: number }>;
  };
  topLinks: Array<{ url: string; label: string; clicks: number }>;
}

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const [timeRange, setTimeRange] = useState('7d');
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedCard, setSelectedCard] = useState('all');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          timeRange,
          cardId: selectedCard,
          granularity,
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
  }, [timeRange, selectedCard, granularity]);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        timeRange,
        cardId: selectedCard,
        format,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export?${params}`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
    } finally {
      setExporting(false);
    }
  };

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
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Track your card performance and engagement metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exporting || loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label="Select time range"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={granularity} onValueChange={(v) => setGranularity(v as 'daily' | 'weekly' | 'monthly')}>
          <SelectTrigger
            className="w-full sm:w-[180px]"
            aria-label="Select granularity"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCard} onValueChange={setSelectedCard}>
          <SelectTrigger
            className="w-full sm:w-[180px]"
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
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="referrers">Referrers</TabsTrigger>
          <TabsTrigger value="links">Link Performance</TabsTrigger>
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

        <TabsContent value="geography" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Top Countries
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <BarChart
                    data={data?.geoData?.countries || []}
                    height={300}
                    color="#16a34a"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {(data?.geoData?.regions || []).slice(0, 15).map((region, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="text-sm text-gray-700">{region.label}</span>
                        <span className="text-sm font-medium text-gray-900">{region.value}</span>
                      </div>
                    ))}
                    {(data?.geoData?.regions?.length || 0) === 0 && (
                      <div className="text-center text-gray-400 py-8">No regional data available</div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technology" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Device Types
                </CardTitle>
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

            <Card>
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Loading...
                  </div>
                ) : (
                  <PieChart 
                    data={data?.browserBreakdown || []} 
                    size={300}
                    colors={['#f59e0b', '#dc2626', '#2d3494', '#16a34a', '#0784b5']}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Referral Sources</CardTitle>
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

        <TabsContent value="links" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Link Click Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[300px] flex items-center justify-center text-gray-400">
                  Loading...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Link</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">URL</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.topLinks || []).map((link, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{link.label}</td>
                          <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-xs">
                            {link.url}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                            {link.clicks}
                          </td>
                        </tr>
                      ))}
                      {(data?.topLinks?.length || 0) === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center py-8 text-gray-400">
                            No link clicks recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
