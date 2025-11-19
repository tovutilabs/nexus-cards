'use client';

import { useAuth } from '@/contexts/auth-context';
import { NexusCard } from '@/components/nexus';
import { NexusButton } from '@/components/nexus';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <NexusButton onClick={logout} variant="outline">
          Sign out
        </NexusButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NexusCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cards</h3>
          <p className="text-3xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-600 mt-2">
            {user?.subscription?.tier === 'FREE' && 'Limit: 1 card'}
            {user?.subscription?.tier === 'PRO' && 'Limit: 5 cards'}
            {user?.subscription?.tier === 'PREMIUM' && 'Unlimited cards'}
          </p>
        </NexusCard>

        <NexusCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Contacts</h3>
          <p className="text-3xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-600 mt-2">
            {user?.subscription?.tier === 'FREE' && 'Limit: 50 contacts'}
            {(user?.subscription?.tier === 'PRO' ||
              user?.subscription?.tier === 'PREMIUM') &&
              'Unlimited contacts'}
          </p>
        </NexusCard>

        <NexusCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analytics
          </h3>
          <p className="text-3xl font-bold text-indigo-600">0</p>
          <p className="text-sm text-gray-600 mt-2">views today</p>
        </NexusCard>
      </div>

      <NexusCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/cards/new">
            <NexusButton fullWidth>Create Card</NexusButton>
          </Link>
          <Link href="/dashboard/settings/account">
            <NexusButton fullWidth variant="outline">
              Edit Profile
            </NexusButton>
          </Link>
        </div>
      </NexusCard>

      <NexusCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Account Information
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Subscription Tier</p>
            <p className="font-medium">{user?.subscription?.tier || 'FREE'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Account Role</p>
            <p className="font-medium">{user?.role}</p>
          </div>
        </div>
      </NexusCard>
    </div>
  );
}
