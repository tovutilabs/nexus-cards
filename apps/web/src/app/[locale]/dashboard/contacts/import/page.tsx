'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createApiClient } from '@/lib/api-client';

interface ParsedContact {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}

export default function ImportContactsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedContact[]>([]);
  const [importResult, setImportResult] = useState<any>(null);
  const [bulkTags] = useState<string[]>([]);
  const [markAsFavorite, setMarkAsFavorite] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    await parseCSV(selectedFile);
  };

  const parseCSV = async (file: File) => {
    setParsing(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one row');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const contacts: ParsedContact[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        const contact: any = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim();
          if (value) {
            // Map common header variations
            if (header.includes('first') || header === 'firstname') {
              contact.firstName = value;
            } else if (header.includes('last') || header === 'lastname') {
              contact.lastName = value;
            } else if (header.includes('email') || header === 'e-mail') {
              contact.email = value;
            } else if (header.includes('phone') || header.includes('tel')) {
              contact.phone = value;
            } else if (header.includes('company') || header.includes('organization')) {
              contact.company = value;
            } else if (header.includes('title') || header.includes('position')) {
              contact.jobTitle = value;
            } else if (header.includes('note')) {
              contact.notes = value;
            }
          }
        });

        if (contact.firstName && contact.lastName && contact.email) {
          contacts.push(contact as ParsedContact);
        }
      }

      setPreview(contacts);
      toast({
        title: 'Preview Ready',
        description: `${contacts.length} contacts parsed successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Parse Error',
        description: error.message || 'Failed to parse CSV file',
        variant: 'destructive',
      });
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result.map((v) => v.replace(/^"|"$/g, ''));
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    try {
      const apiClient = createApiClient();
      const result: {
        success: number;
        failed: number;
        imported: any[];
        errors: Array<{ row: number; data: any; error: string }>;
      } = await apiClient.post('/contacts/import', {
        contacts: preview,
        tags: bulkTags,
        favorite: markAsFavorite,
      });

      setImportResult(result);

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${result.success} of ${preview.length} contacts`,
      });

      if (result.failed === 0) {
        setTimeout(() => router.push('/dashboard/contacts'), 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import contacts',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Import Contacts from CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file to bulk import contacts to your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!file && (
            <div>
              <Label htmlFor="csv-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Click to upload CSV file
                  </p>
                  <p className="text-sm text-gray-600">
                    or drag and drop your file here
                  </p>
                </div>
              </Label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <Alert className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>CSV Format:</strong> Your CSV should include columns:
                  First Name, Last Name, Email (required), Phone, Company, Job Title, Notes (optional)
                </AlertDescription>
              </Alert>
            </div>
          )}

          {parsing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-gray-600">Parsing CSV file...</p>
            </div>
          )}

          {preview.length > 0 && !importResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Preview ({preview.length} contacts)
                </h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setPreview([]);
                  }}
                >
                  Cancel
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Company</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 10).map((contact, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">
                            {contact.firstName} {contact.lastName}
                          </td>
                          <td className="px-4 py-2">{contact.email}</td>
                          <td className="px-4 py-2">{contact.company || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 10 && (
                  <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                    +{preview.length - 10} more contacts
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="favorite"
                    checked={markAsFavorite}
                    onCheckedChange={setMarkAsFavorite}
                  />
                  <Label htmlFor="favorite" className="cursor-pointer">
                    Mark all as favorites
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
                size="lg"
              >
                {importing ? 'Importing...' : `Import ${preview.length} Contacts`}
              </Button>
            </div>
          )}

          {importResult && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Import Complete!
                </h3>
                <p className="text-gray-600">
                  Successfully imported {importResult.success} of {preview.length} contacts
                </p>
              </div>

              {importResult.failed > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {importResult.failed} contacts failed to import. Check for duplicate emails or validation errors.
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={() => router.push('/dashboard/contacts')}
                className="w-full"
              >
                View Contacts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
