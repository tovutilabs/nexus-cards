'use client';

import { useState, useEffect } from 'react';
import { Plus, X, GripVertical, ExternalLink, Linkedin, Twitter, Github, Facebook, Instagram, Youtube, MessageCircle, Music, Video, Globe, Send, Camera, Pin, BookOpen, Dribbble, Figma, MessageSquare, Hash, Slack, Disc } from 'lucide-react';
import { NexusButton } from './nexus-button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const SOCIAL_PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, color: '#1DA1F2' },
  { value: 'github', label: 'GitHub', icon: Github, color: '#181717' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
  { value: 'tiktok', label: 'TikTok', icon: Music, color: '#000000' },
  { value: 'discord', label: 'Discord', icon: MessageSquare, color: '#5865F2' },
  { value: 'twitch', label: 'Twitch', icon: Video, color: '#9146FF' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: '#25D366' },
  { value: 'telegram', label: 'Telegram', icon: Send, color: '#26A5E4' },
  { value: 'snapchat', label: 'Snapchat', icon: Camera, color: '#FFFC00' },
  { value: 'pinterest', label: 'Pinterest', icon: Pin, color: '#E60023' },
  { value: 'medium', label: 'Medium', icon: BookOpen, color: '#000000' },
  { value: 'dribbble', label: 'Dribbble', icon: Dribbble, color: '#EA4C89' },
  { value: 'behance', label: 'Behance', icon: Figma, color: '#1769FF' },
  { value: 'stackoverflow', label: 'Stack Overflow', icon: Hash, color: '#F58025' },
  { value: 'reddit', label: 'Reddit', icon: MessageCircle, color: '#FF4500' },
  { value: 'slack', label: 'Slack', icon: Slack, color: '#4A154B' },
  { value: 'spotify', label: 'Spotify', icon: Disc, color: '#1DB954' },
  { value: 'website', label: 'Website', icon: Globe, color: '#6366F1' },
];

interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

interface SocialLinksManagerProps {
  cardId: string;
  initialLinks?: Record<string, string>;
  onUpdate?: (links: Record<string, string>) => void;
}

export function SocialLinksManager({
  cardId,
  initialLinks = {},
  onUpdate,
}: SocialLinksManagerProps) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Convert Record<string, string> to SocialLink[]
    const links = Object.entries(initialLinks).map(([platform, url]) => ({
      platform,
      url,
    }));
    setSocialLinks(links);
  }, [initialLinks]);

  const getPlatformInfo = (platform: string) => {
    return SOCIAL_PLATFORMS.find(p => p.value === platform) || SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1];
  };

  const addSocialLink = () => {
    if (!newPlatform || !newUrl) {
      setError('Please select a platform and enter a URL');
      return;
    }

    // Validate URL
    try {
      new URL(newUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    // Check if platform already exists
    if (socialLinks.some(link => link.platform === newPlatform)) {
      setError('This platform is already added');
      return;
    }

    setSocialLinks([...socialLinks, { platform: newPlatform, url: newUrl }]);
    setNewPlatform('');
    setNewUrl('');
    setError('');
  };

  const removeSocialLink = (platform: string) => {
    setSocialLinks(socialLinks.filter(link => link.platform !== platform));
  };

  const updateSocialLink = (platform: string, url: string) => {
    setSocialLinks(socialLinks.map(link =>
      link.platform === platform ? { ...link, url } : link
    ));
  };

  const saveSocialLinks = async () => {
    setSaving(true);
    setError('');

    try {
      // Convert SocialLink[] to Record<string, string>
      const linksObject = socialLinks.reduce((acc, link) => {
        acc[link.platform] = link.url;
        return acc;
      }, {} as Record<string, string>);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cards/${cardId}/social-links`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ socialLinks: linksObject }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save social links');
      }

      if (onUpdate) {
        onUpdate(linksObject);
      }
    } catch (err) {
      setError('Failed to save social links. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const availablePlatforms = SOCIAL_PLATFORMS.filter(
    p => !socialLinks.some(link => link.platform === p.value)
  );

  return (
    <div className="space-y-6">
      {/* Add New Link */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Add Social Link</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="platform">Platform</Label>
            <Select value={newPlatform} onValueChange={setNewPlatform}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {availablePlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: platform.color }} />
                        <span>{platform.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://example.com/profile"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <NexusButton
            onClick={addSocialLink}
            disabled={!newPlatform || !newUrl}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Social Link
          </NexusButton>
        </div>
      </Card>

      {/* Existing Links */}
      {socialLinks.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Your Social Links</h3>
          <div className="space-y-3">
            {socialLinks.map((link) => {
              const platformInfo = getPlatformInfo(link.platform);
              const Icon = platformInfo.icon;

              return (
                <div
                  key={link.platform}
                  className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
                >
                  <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                  
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: platformInfo.color + '15' }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: platformInfo.color }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{platformInfo.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {link.url}
                    </div>
                  </div>

                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => removeSocialLink(link.platform)}
                    className="text-muted-foreground hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <NexusButton onClick={saveSocialLinks} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </NexusButton>
          </div>
        </Card>
      )}

      {socialLinks.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <p className="text-sm">No social links added yet.</p>
            <p className="text-xs mt-1">Add your first social link above to get started.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
