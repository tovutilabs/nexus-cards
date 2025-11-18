'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Search, Shield, CreditCard, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
  };
  subscription?: {
    tier: 'FREE' | 'PRO' | 'PREMIUM';
    status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
  };
  stats?: {
    cardsCount: number;
    contactsCount: number;
  };
}

interface UserStats {
  totalUsers: number;
  byTier: {
    FREE: number;
    PRO: number;
    PREMIUM: number;
  };
  adminUsers: number;
  activeSubscriptions: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN'>('USER');
  const [newTier, setNewTier] = useState<'FREE' | 'PRO' | 'PREMIUM'>('FREE');
  const [saving, setSaving] = useState(false);
  const [userUsage, setUserUsage] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [roleFilter, tierFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const apiClient = createApiClient();
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (tierFilter !== 'all') params.append('tier', tierFilter);
      
      const data = await apiClient.get<{ users: User[]; total: number }>(
        `/admin/users?${params.toString()}`
      );
      setUsers(data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<UserStats>('/admin/users/stats/overview');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const apiClient = createApiClient();
      await apiClient.patch(`/admin/users/${selectedUser.id}/role`, {
        role: newRole,
      });

      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });

      setRoleDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTierChange = async () {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const apiClient = createApiClient();
      await apiClient.patch(`/admin/users/${selectedUser.id}/subscription`, {
        tier: newTier,
      });

      toast({
        title: 'Success',
        description: `Subscription tier updated to ${newTier}`,
      });

      setTierDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
      loadStats();
    } catch (error: any) {
      console.error('Failed to update tier:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update subscription tier',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  const openTierDialog = (user: User) => {
    setSelectedUser(user);
    setNewTier(user.subscription?.tier || 'FREE');
    setTierDialogOpen(true);
  };

  const openUsageDialog = async (user: User) => {
    setSelectedUser(user);
    setUsageDialogOpen(true);
    setUserUsage(null);

    try {
      const apiClient = createApiClient();
      const data = await apiClient.get(`/admin/users/${user.id}/usage`);
      setUserUsage(data);
    } catch (error) {
      console.error('Failed to load usage:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user usage metrics',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'ADMIN' ? (
      <Badge className="bg-red-100 text-red-800">ADMIN</Badge>
    ) : (
      <Badge variant="secondary">USER</Badge>
    );
  };

  const getTierBadge = (tier?: string) => {
    const tierColors = {
      FREE: 'bg-gray-100 text-gray-800',
      PRO: 'bg-blue-100 text-blue-800',
      PREMIUM: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge className={tierColors[tier as keyof typeof tierColors] || 'bg-gray-100 text-gray-800'}>
        {tier || 'FREE'}
      </Badge>
    );
  };

  const getStatusBadge = (status?: string) => {
    const statusColors = {
      ACTIVE: 'bg-green-100 text-green-800',
      CANCELED: 'bg-gray-100 text-gray-800',
      PAST_DUE: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status || 'ACTIVE'}
      </Badge>
    );
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and subscriptions</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">FREE / PRO / PREMIUM</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.byTier.FREE} / {stats.byTier.PRO} / {stats.byTier.PREMIUM}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Active Subscriptions</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeSubscriptions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600">Admins</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.adminUsers}</p>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by email or name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="PREMIUM">Premium</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm ? 'No users found' : 'No users yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search' : 'Users will appear here'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </span>
                      {getRoleBadge(user.role)}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getTierBadge(user.subscription?.tier)}
                      {getStatusBadge(user.subscription?.status)}
                      <span className="text-xs text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openUsageDialog(user)}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Usage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openTierDialog(user)}
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Tier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRoleDialog(user)}
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Role
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={saving}>
              {saving ? 'Saving...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Update the subscription tier for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
            <Select value={newTier} onValueChange={(value: any) => setNewTier(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTierDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleTierChange} disabled={saving}>
              {saving ? 'Saving...' : 'Update Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Usage Metrics</DialogTitle>
            <DialogDescription>
              Usage statistics for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!userUsage ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cards</p>
                  <p className="text-xl font-bold text-gray-900">
                    {userUsage.usage.cards.current} / {userUsage.usage.cards.limit === 9007199254740991 ? '∞' : userUsage.usage.cards.limit}
                  </p>
                  {userUsage.usage.cards.limit !== 9007199254740991 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min(userUsage.usage.cards.percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Contacts</p>
                  <p className="text-xl font-bold text-gray-900">
                    {userUsage.usage.contacts.current} / {userUsage.usage.contacts.limit === 9007199254740991 ? '∞' : userUsage.usage.contacts.limit}
                  </p>
                  {userUsage.usage.contacts.limit !== 9007199254740991 && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min(userUsage.usage.contacts.percentage, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Recent Activity (Last 7 Days)</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Card Views:</span>
                      <span className="font-semibold">{userUsage.recentActivity.cardViews}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NFC Taps:</span>
                      <span className="font-semibold">{userUsage.recentActivity.nfcTaps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact Submissions:</span>
                      <span className="font-semibold">{userUsage.recentActivity.contactSubmissions}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setUsageDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
