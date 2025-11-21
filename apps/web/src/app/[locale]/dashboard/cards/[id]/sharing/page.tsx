'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Link2, Share2, Trash2, ExternalLink, MessageCircle, Send, Mail, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareLink {
  id: string;
  token: string;
  name?: string;
  privacyMode: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
  expiresAt?: string;
  allowContactSubmission: boolean;
  channel: string;
  shareCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  url: string;
  isExpired: boolean;
  hasPassword: boolean;
}

interface Card {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  privacyMode: 'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED';
  allowContactSubmission: boolean;
}

export default function CardSharingPage() {
  const params = useParams();
  const { toast } = useToast();
  const cardId = params.id as string;

  const [card, setCard] = useState<Card | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state for creating new share link
  const [linkName, setLinkName] = useState('');
  const [privacyMode, setPrivacyMode] = useState<'PUBLIC' | 'PRIVATE' | 'PASSWORD_PROTECTED'>('PUBLIC');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState<string>('never');
  const [allowContactSubmission, setAllowContactSubmission] = useState(true);

  useEffect(() => {
    fetchCard();
    fetchShareLinks();
  }, [cardId]);

  const fetchCard = async () => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCard(data);
      }
    } catch (error) {
      console.error('Error fetching card:', error);
    }
  };

  const fetchShareLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/share-links/card/${cardId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data);
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiresAt = (expiresIn: string): Date | undefined => {
    if (expiresIn === 'never') return undefined;
    
    const now = new Date();
    const hours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
    }[expiresIn];

    if (hours) {
      now.setHours(now.getHours() + hours);
      return now;
    }
    return undefined;
  };

  const createShareLink = async () => {
    try {
      setCreating(true);

      const expiresAt = calculateExpiresAt(expiresIn);

      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cardId,
          name: linkName || undefined,
          privacyMode,
          password: privacyMode === 'PASSWORD_PROTECTED' ? password : undefined,
          expiresAt: expiresAt?.toISOString(),
          allowContactSubmission,
          channel: 'DIRECT',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Share link created',
          description: 'Your share link has been created successfully.',
        });
        setShowCreateDialog(false);
        resetForm();
        fetchShareLinks();
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create share link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeShareLink = async (id: string) => {
    try {
      const response = await fetch(`/api/share-links/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Link revoked',
          description: 'The share link has been revoked.',
        });
        fetchShareLinks();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke share link.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Link copied to clipboard.',
    });
  };

  const resetForm = () => {
    setLinkName('');
    setPrivacyMode('PUBLIC');
    setPassword('');
    setExpiresIn('never');
    setAllowContactSubmission(true);
  };

  const generateChannelUrl = async (shareUrl: string, channel: string) => {
    try {
      const response = await fetch('/api/share-links/channel-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shareUrl,
          cardTitle: `${card?.firstName} ${card?.lastName}'s Card`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const channelUrls: Record<string, string> = data;
        const url = channelUrls[channel.toLowerCase()];
        if (url) {
          window.open(url, '_blank');
        }
      }
    } catch (error) {
      console.error('Error generating channel URL:', error);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertDescription>Card not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const cardUrl = `${window.location.origin}/p/${card.slug}`;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Share Card</h1>
        <p className="text-muted-foreground">
          Manage sharing links and privacy settings for {card.firstName} {card.lastName}
        </p>
      </div>

      <Tabs defaultValue="links" className="space-y-4">
        <TabsList>
          <TabsTrigger value="links">Share Links</TabsTrigger>
          <TabsTrigger value="channels">Quick Share</TabsTrigger>
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Share Links</CardTitle>
                  <CardDescription>
                    Create custom share links with specific permissions and expiration dates
                  </CardDescription>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Link2 className="mr-2 h-4 w-4" />
                      Create Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Share Link</DialogTitle>
                      <DialogDescription>
                        Create a custom share link with specific settings
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Link Name (Optional)</Label>
                        <Input
                          id="name"
                          value={linkName}
                          onChange={(e) => setLinkName(e.target.value)}
                          placeholder="e.g., For networking event"
                        />
                      </div>
                      <div>
                        <Label htmlFor="privacy">Privacy Mode</Label>
                        <Select value={privacyMode} onValueChange={(value: any) => setPrivacyMode(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">Public</SelectItem>
                            <SelectItem value="PRIVATE">Private (Login Required)</SelectItem>
                            <SelectItem value="PASSWORD_PROTECTED">Password Protected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {privacyMode === 'PASSWORD_PROTECTED' && (
                        <div>
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="expires">Expires In</Label>
                        <Select value={expiresIn} onValueChange={setExpiresIn}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="1h">1 Hour</SelectItem>
                            <SelectItem value="24h">24 Hours</SelectItem>
                            <SelectItem value="7d">7 Days</SelectItem>
                            <SelectItem value="30d">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="contact">Allow Contact Submission</Label>
                        <Switch
                          id="contact"
                          checked={allowContactSubmission}
                          onCheckedChange={setAllowContactSubmission}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createShareLink} disabled={creating}>
                        {creating ? 'Creating...' : 'Create Link'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {shareLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Share2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No share links yet</p>
                  <p className="text-sm">Create a custom share link to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Privacy</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shareLinks.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{link.name || 'Unnamed Link'}</div>
                            <div className="text-xs text-muted-foreground">
                              Created {new Date(link.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={link.privacyMode === 'PUBLIC' ? 'default' : 'secondary'}>
                            {link.privacyMode === 'PASSWORD_PROTECTED' ? 'Password' : link.privacyMode}
                          </Badge>
                          {link.hasPassword && ' 🔒'}
                        </TableCell>
                        <TableCell>
                          {link.expiresAt ? (
                            <div>
                              <div>{new Date(link.expiresAt).toLocaleDateString()}</div>
                              {link.isExpired && (
                                <Badge variant="destructive" className="mt-1">
                                  Expired
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>{link.shareCount}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(link.url)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(link.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => revokeShareLink(link.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Share</CardTitle>
              <CardDescription>
                Share your card directly via popular messaging and social platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Card URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={cardUrl} readOnly />
                  <Button onClick={() => copyToClipboard(cardUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => generateChannelUrl(cardUrl, 'whatsapp')}
                >
                  <MessageCircle className="h-8 w-8 text-green-600" />
                  <span>WhatsApp</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => generateChannelUrl(cardUrl, 'telegram')}
                >
                  <Send className="h-8 w-8 text-blue-500" />
                  <span>Telegram</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => generateChannelUrl(cardUrl, 'email')}
                >
                  <Mail className="h-8 w-8 text-gray-600" />
                  <span>Email</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => generateChannelUrl(cardUrl, 'linkedin')}
                >
                  <Linkedin className="h-8 w-8 text-blue-700" />
                  <span>LinkedIn</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => generateChannelUrl(cardUrl, 'sms')}
                >
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                  <span>SMS</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Privacy Settings</CardTitle>
              <CardDescription>
                Configure default privacy settings for your card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  These settings apply when someone accesses your card directly without a share link.
                </AlertDescription>
              </Alert>
              <div>
                <Label>Default Privacy Mode</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Current: <Badge>{card.privacyMode}</Badge>
                </p>
                <p className="text-sm text-muted-foreground">
                  To change the default privacy mode, edit your card settings.
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Contact Submissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow people to submit their contact information
                  </p>
                </div>
                <Badge variant={card.allowContactSubmission ? 'default' : 'secondary'}>
                  {card.allowContactSubmission ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
