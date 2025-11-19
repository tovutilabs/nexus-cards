'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit2, Trash2, Flag, Gauge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
  updatedBy: string;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('feature_flags');

  useEffect(() => {
    loadSettings();
  }, [selectedCategory]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const apiClient = createApiClient();
      const params =
        selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
      const data = await apiClient.get<{ settings: Setting[] }>(
        `/admin/settings${params}`
      );
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formKey || !formValue) {
      toast({
        title: 'Validation Error',
        description: 'Key and value are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const apiClient = createApiClient();
      let parsedValue: any = formValue;

      // Try to parse as JSON for complex values
      try {
        parsedValue = JSON.parse(formValue);
      } catch {
        // Keep as string if not valid JSON
      }

      await apiClient.post('/admin/settings', {
        key: formKey,
        value: parsedValue,
        description: formDescription || undefined,
        category: formCategory,
      });

      toast({
        title: 'Success',
        description: 'Setting created successfully',
      });

      setCreateDialogOpen(false);
      resetForm();
      loadSettings();
    } catch (error: any) {
      console.error('Failed to create setting:', error);
      toast({
        title: 'Create Failed',
        description: error.message || 'Failed to create setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSetting || !formValue) {
      toast({
        title: 'Validation Error',
        description: 'Value is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const apiClient = createApiClient();
      let parsedValue: any = formValue;

      try {
        parsedValue = JSON.parse(formValue);
      } catch {
        // Keep as string if not valid JSON
      }

      await apiClient.patch(`/admin/settings/${selectedSetting.key}`, {
        value: parsedValue,
        description: formDescription || undefined,
        category: formCategory,
      });

      toast({
        title: 'Success',
        description: 'Setting updated successfully',
      });

      setEditDialogOpen(false);
      setSelectedSetting(null);
      resetForm();
      loadSettings();
    } catch (error: any) {
      console.error('Failed to update setting:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSetting) return;

    setSaving(true);
    try {
      const apiClient = createApiClient();
      await apiClient.delete(`/admin/settings/${selectedSetting.key}`);

      toast({
        title: 'Success',
        description: 'Setting deleted successfully',
      });

      setDeleteDialogOpen(false);
      setSelectedSetting(null);
      loadSettings();
    } catch (error: any) {
      console.error('Failed to delete setting:', error);
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete setting',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateDialogOpen(true);
  };

  const openEditDialog = (setting: Setting) => {
    setSelectedSetting(setting);
    setFormKey(setting.key);
    setFormValue(
      typeof setting.value === 'object'
        ? JSON.stringify(setting.value, null, 2)
        : String(setting.value)
    );
    setFormDescription(setting.description || '');
    setFormCategory(setting.category);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (setting: Setting) => {
    setSelectedSetting(setting);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormKey('');
    setFormValue('');
    setFormDescription('');
    setFormCategory('feature_flags');
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      feature_flags: 'bg-blue-100 text-blue-800',
      limits: 'bg-purple-100 text-purple-800',
      export_options: 'bg-green-100 text-green-800',
      email_config: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colors[category] || colors.other}>
        {category.replace('_', ' ')}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'feature_flags') return <Flag className="h-4 w-4" />;
    if (category === 'limits') return <Gauge className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  if (loading && settings.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Setting
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="feature_flags">Feature Flags</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="export_options">Export</TabsTrigger>
          <TabsTrigger value="email_config">Email</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {settings.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="mx-auto w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Settings className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No settings found
              </h3>
              <p className="text-gray-600 mb-4">
                {selectedCategory === 'all'
                  ? 'Create your first setting'
                  : `No ${selectedCategory.replace('_', ' ')} settings yet`}
              </p>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Setting
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {settings.map((setting) => (
                <Card key={setting.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gray-100 rounded-lg mt-1">
                        {getCategoryIcon(setting.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {setting.key}
                          </span>
                          {getCategoryBadge(setting.category)}
                        </div>
                        {setting.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {setting.description}
                          </p>
                        )}
                        <div className="p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 overflow-x-auto">
                          {typeof setting.value === 'object'
                            ? JSON.stringify(setting.value, null, 2)
                            : String(setting.value)}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Updated {new Date(setting.updatedAt).toLocaleString()}{' '}
                          by {setting.updatedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(setting)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(setting)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Setting</DialogTitle>
            <DialogDescription>Add a new system setting</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key *
              </label>
              <Input
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                placeholder="setting_key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value * (JSON or string)
              </label>
              <Textarea
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                placeholder='true or "value" or {"key": "value"}'
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature_flags">Feature Flags</SelectItem>
                  <SelectItem value="limits">Limits</SelectItem>
                  <SelectItem value="export_options">Export Options</SelectItem>
                  <SelectItem value="email_config">Email Config</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
            <DialogDescription>
              Update the setting for {selectedSetting?.key}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key
              </label>
              <Input value={formKey} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Value * (JSON or string)
              </label>
              <Textarea
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature_flags">Feature Flags</SelectItem>
                  <SelectItem value="limits">Limits</SelectItem>
                  <SelectItem value="export_options">Export Options</SelectItem>
                  <SelectItem value="email_config">Email Config</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Setting</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the setting{' '}
              <strong>{selectedSetting?.key}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
