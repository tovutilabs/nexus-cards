'use client';

import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage user accounts and subscriptions
        </p>
      </div>

      <Card className="p-12 text-center">
        <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Users className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          User Management Coming Soon
        </h3>
        <p className="text-gray-600 mb-4">
          View and manage user accounts, subscriptions, and permissions
        </p>
        <div className="text-sm text-gray-500">
          Features:
          <ul className="mt-2 space-y-1">
            <li>• User list with search and filters</li>
            <li>• Subscription tier management</li>
            <li>• Account activation/deactivation</li>
            <li>• User activity logs</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
