'use client';

import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure system-wide settings and preferences
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Settings className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          System Settings Coming Soon
        </h3>
        <p className="text-gray-600 mb-4">
          Configure application settings and preferences
        </p>
        <div className="text-sm text-gray-500">
          Features:
          <ul className="mt-2 space-y-1">
            <li>• Email configuration</li>
            <li>• Subscription tier limits</li>
            <li>• Feature flags</li>
            <li>• API rate limits</li>
            <li>• Backup and maintenance</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
