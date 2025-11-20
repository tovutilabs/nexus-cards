'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createApiClient } from '@/lib/api-client';
import { Loader2, Download, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const apiClient = createApiClient();

interface DataExport {
  id: string;
  format: string;
  status: string;
  fileUrl?: string;
  expiresAt: string;
  createdAt: string;
}

export default function PrivacyDataPage() {
  const [exports, setExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadExports();
  }, []);

  const loadExports = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<DataExport[]>('/compliance/data-exports');
      setExports(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load data exports');
    } finally {
      setLoading(false);
    }
  };

  const requestExport = async (format: 'JSON' | 'CSV') => {
    try {
      setExporting(true);
      setError(null);
      setSuccess(null);

      await apiClient.post('/compliance/data-export', { format });

      setSuccess(`Data export requested. You'll receive an email when it's ready.`);
      setTimeout(() => setSuccess(null), 5000);

      await loadExports();
    } catch (err: any) {
      setError(err.message || 'Failed to request data export');
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      setError(null);

      await apiClient.delete('/compliance/account');

      window.location.href = '/auth/login?deleted=true';
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-green-600 text-sm font-medium">Ready</span>;
      case 'PENDING':
        return <span className="text-yellow-600 text-sm font-medium">Processing...</span>;
      case 'FAILED':
        return <span className="text-red-600 text-sm font-medium">Failed</span>;
      default:
        return <span className="text-gray-600 text-sm font-medium">{status}</span>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Privacy & Data</h1>
        <p className="text-muted-foreground">
          Manage your personal data and privacy settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Export Your Data</CardTitle>
            <CardDescription>
              Download a copy of all your data stored in Nexus Cards. This includes your profile,
              cards, contacts, and analytics data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                variant="outline"
                onClick={() => requestExport('JSON')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export as JSON
              </Button>
              <Button
                variant="outline"
                onClick={() => requestExport('CSV')}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export as CSV
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : exports.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm mb-2">Recent Exports</h3>
                {exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {exp.format} Export
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(exp.createdAt).toLocaleDateString()} • Expires{' '}
                        {new Date(exp.expiresAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(exp.status)}
                      {exp.status === 'COMPLETED' && exp.fileUrl && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={exp.fileUrl} download>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exports yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control how your data is used and shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Analytics Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Allow us to collect anonymous usage data to improve the product
                </p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Cookie Preferences</p>
                <p className="text-sm text-muted-foreground">
                  Manage your cookie consent settings
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Delete Account</CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                This will permanently delete your account and all associated data, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All your digital cards</li>
                <li>Contact information and exchanges</li>
                <li>Analytics data</li>
                <li>NFC tag associations</li>
                <li>Integration connections</li>
                <li>Billing and subscription information</li>
              </ul>
              <p className="font-semibold text-red-600">
                This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Yes, Delete My Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
