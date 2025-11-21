'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/charts';
import { ArrowLeft, TrendingUp, Users, Target } from 'lucide-react';

interface ExperimentResults {
  experiment: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    targetPath: string;
    conversionGoal: string;
    startDate: string | null;
    endDate: string | null;
  };
  results: Array<{
    variant: string;
    assignments: number;
    conversions: number;
    conversionRate: number;
  }>;
  totalAssignments: number;
  totalConversions: number;
  eventBreakdown: Array<{
    variant: string;
    eventType: string;
    count: number;
  }>;
}

export default function ExperimentResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<ExperimentResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchResults();
    }
  }, [id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/experiments/${id}/results`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const results = await response.json();
      setData(results);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64 text-gray-400">
          Loading experiment results...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64 text-gray-400">
          Experiment not found
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const bestVariant = data.results.reduce((best, current) => 
    current.conversionRate > best.conversionRate ? current : best
  , data.results[0]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Experiments
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {data.experiment.name}
              </h1>
              <Badge className={getStatusColor(data.experiment.status)}>
                {data.experiment.status}
              </Badge>
            </div>
            {data.experiment.description && (
              <p className="text-gray-600 mb-2">{data.experiment.description}</p>
            )}
            <div className="flex gap-4 text-sm text-gray-500">
              <span>Target: {data.experiment.targetPath}</span>
              <span>Goal: {data.experiment.conversionGoal}</span>
              {data.experiment.startDate && (
                <span>
                  Started: {new Date(data.experiment.startDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Assignments</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.totalAssignments.toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <Users className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Conversions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.totalConversions.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <Target className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Best Performer</p>
                <p className="text-3xl font-bold text-gray-900">{bestVariant.variant}</p>
                <p className="text-sm text-gray-500">
                  {bestVariant.conversionRate.toFixed(2)}% conversion
                </p>
              </div>
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                    Variant
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    Assignments
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    Conversions
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    Conversion Rate
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">
                    Lift vs Best
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.results
                  .sort((a, b) => b.conversionRate - a.conversionRate)
                  .map((result) => {
                    const lift = result.variant === bestVariant.variant
                      ? 0
                      : ((result.conversionRate - bestVariant.conversionRate) / bestVariant.conversionRate) * 100;

                    return (
                      <tr
                        key={result.variant}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {result.variant}
                          {result.variant === bestVariant.variant && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              Winner
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          {result.assignments.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 text-right">
                          {result.conversions.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                          {result.conversionRate.toFixed(2)}%
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium text-right ${
                          lift > 0 ? 'text-green-600' : lift < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {lift === 0 ? '-' : `${lift > 0 ? '+' : ''}${lift.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Rate by Variant</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={data.results.map((r) => ({
              label: r.variant,
              value: parseFloat(r.conversionRate.toFixed(2)),
            }))}
            height={300}
            color="#16a34a"
          />
        </CardContent>
      </Card>
    </div>
  );
}
