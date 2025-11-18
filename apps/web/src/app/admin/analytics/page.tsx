'use client';

import { Card } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Global Analytics</h1>
        <p className="text-gray-600 mt-1">
          System-wide analytics and insights
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <BarChart3 className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analytics Dashboard Coming Soon
        </h3>
        <p className="text-gray-600 mb-4">
          View system-wide analytics and performance metrics
        </p>
        <div className="text-sm text-gray-500">
          Features:
          <ul className="mt-2 space-y-1">
            <li>• Daily card views and engagement</li>
            <li>• Contact exchange trends</li>
            <li>• NFC tap analytics</li>
            <li>• User growth metrics</li>
            <li>• Geographic distribution</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
