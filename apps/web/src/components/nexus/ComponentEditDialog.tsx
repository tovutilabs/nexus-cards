'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardComponent } from '@/components/card-components/types';

interface ComponentEditDialogProps {
  component: CardComponent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (componentId: string, updates: Partial<CardComponent>) => void;
}

export function ComponentEditDialog({
  component,
  open,
  onOpenChange,
  onSave,
}: ComponentEditDialogProps) {
  const [config, setConfig] = useState<Record<string, any>>(component?.config || {});
  const [backgroundType, setBackgroundType] = useState(
    component?.backgroundType || 'solid'
  );
  const [backgroundColor, setBackgroundColor] = useState(
    component?.backgroundColor || '#ffffff'
  );
  const [backgroundGradientStart, setBackgroundGradientStart] = useState(
    component?.backgroundGradientStart || '#ffffff'
  );
  const [backgroundGradientEnd, setBackgroundGradientEnd] = useState(
    component?.backgroundGradientEnd || '#000000'
  );
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(
    component?.backgroundImageUrl || ''
  );

  if (!component) return null;

  const handleSave = () => {
    onSave(component.id, {
      config,
      backgroundType,
      backgroundColor,
      backgroundGradientStart,
      backgroundGradientEnd,
      backgroundImageUrl,
    });
    onOpenChange(false);
  };

  const updateConfig = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const renderConfigEditor = () => {
    switch (component.type) {
      case 'PROFILE':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showAvatar">Show Avatar</Label>
              <Switch
                id="showAvatar"
                checked={config.showAvatar ?? true}
                onCheckedChange={(checked) => updateConfig('showAvatar', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showBio">Show Bio</Label>
              <Switch
                id="showBio"
                checked={config.showBio ?? true}
                onCheckedChange={(checked) => updateConfig('showBio', checked)}
              />
            </div>
          </div>
        );

      case 'ABOUT':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={config.bio || ''}
                onChange={(e) => updateConfig('bio', e.target.value)}
                placeholder="Tell your story..."
                rows={6}
              />
            </div>
          </div>
        );

      case 'CONTACT':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showEmail">Show Email</Label>
              <Switch
                id="showEmail"
                checked={config.showEmail ?? true}
                onCheckedChange={(checked) => updateConfig('showEmail', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showPhone">Show Phone</Label>
              <Switch
                id="showPhone"
                checked={config.showPhone ?? true}
                onCheckedChange={(checked) => updateConfig('showPhone', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showSMS">Show SMS Button</Label>
              <Switch
                id="showSMS"
                checked={config.showSMS ?? false}
                onCheckedChange={(checked) => updateConfig('showSMS', checked)}
              />
            </div>
          </div>
        );

      case 'SOCIAL_LINKS':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure your social media links in the card settings.
            </p>
          </div>
        );

      case 'GALLERY':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="columns">Columns</Label>
              <Select
                value={config.columns?.toString() || '3'}
                onValueChange={(value) => updateConfig('columns', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enableLightbox">Enable Lightbox</Label>
              <Switch
                id="enableLightbox"
                checked={config.enableLightbox ?? true}
                onCheckedChange={(checked) => updateConfig('enableLightbox', checked)}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No additional configuration available for this component type.
            </p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Component</DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of your {component.type.toLowerCase()}{' '}
            component.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 py-4">
            {renderConfigEditor()}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 py-4">
            <div>
              <Label htmlFor="backgroundType">Background Type</Label>
              <Select value={backgroundType} onValueChange={setBackgroundType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Color</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {backgroundType === 'solid' && (
              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            )}

            {backgroundType === 'gradient' && (
              <>
                <div>
                  <Label htmlFor="gradientStart">Gradient Start</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gradientStart"
                      type="color"
                      value={backgroundGradientStart}
                      onChange={(e) => setBackgroundGradientStart(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={backgroundGradientStart}
                      onChange={(e) => setBackgroundGradientStart(e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gradientEnd">Gradient End</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gradientEnd"
                      type="color"
                      value={backgroundGradientEnd}
                      onChange={(e) => setBackgroundGradientEnd(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={backgroundGradientEnd}
                      onChange={(e) => setBackgroundGradientEnd(e.target.value)}
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </>
            )}

            {backgroundType === 'image' && (
              <div>
                <Label htmlFor="backgroundImage">Background Image URL</Label>
                <Input
                  id="backgroundImage"
                  type="url"
                  value={backgroundImageUrl}
                  onChange={(e) => setBackgroundImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
