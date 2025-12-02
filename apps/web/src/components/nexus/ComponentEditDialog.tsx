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
import { ImageUpload } from './ImageUpload';
import { VideoUpload } from './VideoUpload';

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
            <div>
              <Label>Social Links</Label>
              <div className="space-y-4 mt-2">
                {(config.links || []).map((link: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Link {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newLinks = (config.links || []).filter((_: any, i: number) => i !== index);
                          updateConfig('links', newLinks);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div>
                      <Label>Platform</Label>
                      <Select
                        value={link.platform || 'custom'}
                        onValueChange={(value) => {
                          const newLinks = [...(config.links || [])];
                          newLinks[index] = { ...newLinks[index], platform: value };
                          updateConfig('links', newLinks);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="twitter">Twitter/X</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="linkedin">LinkedIn</SelectItem>
                          <SelectItem value="github">GitHub</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={link.url || ''}
                      onChange={(e) => {
                        const newLinks = [...(config.links || [])];
                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                        updateConfig('links', newLinks);
                      }}
                      placeholder="https://..."
                    />
                    <Input
                      value={link.username || ''}
                      onChange={(e) => {
                        const newLinks = [...(config.links || [])];
                        newLinks[index] = { ...newLinks[index], username: e.target.value };
                        updateConfig('links', newLinks);
                      }}
                      placeholder="@username (optional)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newLinks = [...(config.links || []), { platform: 'custom', url: '', username: '' }];
                    updateConfig('links', newLinks);
                  }}
                  className="w-full"
                >
                  + Add Social Link
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="socialLayout">Layout</Label>
              <Select
                value={config.layout || 'icons'}
                onValueChange={(value) => updateConfig('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="icons">Icons</SelectItem>
                  <SelectItem value="buttons">Buttons</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="iconSize">Icon Size</Label>
              <Select
                value={config.iconSize || 'medium'}
                onValueChange={(value) => updateConfig('iconSize', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showLabels">Show Labels</Label>
              <Switch
                id="showLabels"
                checked={config.showLabels ?? false}
                onCheckedChange={(checked) => updateConfig('showLabels', checked)}
              />
            </div>
          </div>
        );

      case 'VIDEO':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="videoPlatform">Video Source</Label>
              <Select
                value={config.platform || 'youtube'}
                onValueChange={(value) => {
                  updateConfig('platform', value);
                  if (value !== 'custom') {
                    updateConfig('url', '');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="custom">Upload Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {config.platform === 'custom' ? (
              <VideoUpload
                label="Video File *"
                value={config.url || ''}
                onChange={(url) => updateConfig('url', url)}
                endpoint="video"
                maxSize={100}
              />
            ) : (
              <div>
                <Label htmlFor="videoUrl">Video URL *</Label>
                <Input
                  id="videoUrl"
                  type="url"
                  value={config.url || ''}
                  onChange={(e) => updateConfig('url', e.target.value)}
                  placeholder={`https://www.${config.platform || 'youtube'}.com/...`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste a {config.platform === 'vimeo' ? 'Vimeo' : 'YouTube'} URL
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="videoTitle">Title (Optional)</Label>
              <Input
                id="videoTitle"
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Video title"
              />
            </div>
            <div>
              <ImageUpload
                label="Thumbnail (Optional)"
                value={config.thumbnail || ''}
                onChange={(url) => updateConfig('thumbnail', url)}
                endpoint="video-thumbnail"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="videoAutoplay">Autoplay</Label>
              <Switch
                id="videoAutoplay"
                checked={config.autoplay ?? false}
                onCheckedChange={(checked) => updateConfig('autoplay', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="videoControls">Show Controls</Label>
              <Switch
                id="videoControls"
                checked={config.showControls ?? true}
                onCheckedChange={(checked) => updateConfig('showControls', checked)}
              />
            </div>
          </div>
        );

      case 'GALLERY':
        return (
          <div className="space-y-4">
            <div>
              <Label>Gallery Images</Label>
              <div className="space-y-4 mt-2">
                {(config.images || []).map((img: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Image {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newImages = (config.images || []).filter((_: any, i: number) => i !== index);
                          updateConfig('images', newImages);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <ImageUpload
                      label="Image"
                      value={img.url || ''}
                      onChange={(url) => {
                        const newImages = [...(config.images || [])];
                        newImages[index] = { ...newImages[index], url };
                        updateConfig('images', newImages);
                      }}
                      endpoint="gallery-image"
                    />
                    <Input
                      value={img.caption || ''}
                      onChange={(e) => {
                        const newImages = [...(config.images || [])];
                        newImages[index] = { ...newImages[index], caption: e.target.value };
                        updateConfig('images', newImages);
                      }}
                      placeholder="Caption (optional)"
                    />
                    <Input
                      value={img.alt || ''}
                      onChange={(e) => {
                        const newImages = [...(config.images || [])];
                        newImages[index] = { ...newImages[index], alt: e.target.value };
                        updateConfig('images', newImages);
                      }}
                      placeholder="Alt text (optional)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newImages = [...(config.images || []), { url: '', caption: '', alt: '' }];
                    updateConfig('images', newImages);
                  }}
                  className="w-full"
                >
                  + Add Image
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="galleryLayout">Layout</Label>
              <Select
                value={config.layout || 'grid'}
                onValueChange={(value) => updateConfig('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="masonry">Masonry</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="showCaptions">Show Captions</Label>
              <Switch
                id="showCaptions"
                checked={config.showCaptions ?? true}
                onCheckedChange={(checked) => updateConfig('showCaptions', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="enableLightbox">Enable Lightbox</Label>
              <Switch
                id="enableLightbox"
                checked={config.lightbox ?? true}
                onCheckedChange={(checked) => updateConfig('lightbox', checked)}
              />
            </div>
          </div>
        );

      case 'CUSTOM_LINKS':
        return (
          <div className="space-y-4">
            <div>
              <Label>Custom Links</Label>
              <div className="space-y-4 mt-2">
                {(config.links || []).map((link: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Link {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newLinks = (config.links || []).filter((_: any, i: number) => i !== index);
                          updateConfig('links', newLinks);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={link.title || ''}
                      onChange={(e) => {
                        const newLinks = [...(config.links || [])];
                        newLinks[index] = { ...newLinks[index], title: e.target.value };
                        updateConfig('links', newLinks);
                      }}
                      placeholder="Link title"
                    />
                    <Input
                      value={link.url || ''}
                      onChange={(e) => {
                        const newLinks = [...(config.links || [])];
                        newLinks[index] = { ...newLinks[index], url: e.target.value };
                        updateConfig('links', newLinks);
                      }}
                      placeholder="https://..."
                    />
                    <Input
                      value={link.icon || ''}
                      onChange={(e) => {
                        const newLinks = [...(config.links || [])];
                        newLinks[index] = { ...newLinks[index], icon: e.target.value };
                        updateConfig('links', newLinks);
                      }}
                      placeholder="Icon (emoji or text)"
                    />
                    <Textarea
                      value={link.description || ''}
                      onChange={(e) => {
                        const newLinks = [...(config.links || [])];
                        newLinks[index] = { ...newLinks[index], description: e.target.value };
                        updateConfig('links', newLinks);
                      }}
                      placeholder="Description (optional)"
                      rows={2}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newLinks = [...(config.links || []), { title: '', url: '', icon: '', description: '' }];
                    updateConfig('links', newLinks);
                  }}
                  className="w-full"
                >
                  + Add Link
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="linkStyle">Style</Label>
              <Select
                value={config.style || 'button'}
                onValueChange={(value) => updateConfig('style', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minimal">Minimal</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="button">Button</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'CALENDAR':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="calendarPlatform">Platform</Label>
              <Select
                value={config.platform || 'calendly'}
                onValueChange={(value) => updateConfig('platform', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calendly">Calendly</SelectItem>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="outlook">Outlook</SelectItem>
                  <SelectItem value="custom">Custom Link</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="calendarUrl">Calendar URL *</Label>
              <Input
                id="calendarUrl"
                type="url"
                value={config.calendarUrl || ''}
                onChange={(e) => updateConfig('calendarUrl', e.target.value)}
                placeholder="https://calendly.com/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {config.platform === 'calendly' && 'Your Calendly booking URL'}
                {config.platform === 'google' && 'Google Calendar event link'}
                {config.platform === 'outlook' && 'Outlook booking link'}
                {(!config.platform || config.platform === 'custom') && 'Any calendar or booking URL'}
              </p>
            </div>
            <div>
              <Label htmlFor="buttonText">Button Text</Label>
              <Input
                id="buttonText"
                value={config.buttonText || ''}
                onChange={(e) => updateConfig('buttonText', e.target.value)}
                placeholder="Schedule a Meeting"
              />
            </div>
            <div>
              <Label htmlFor="calendarDescription">Description (Optional)</Label>
              <Textarea
                id="calendarDescription"
                value={config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                placeholder="Book time with me..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'FORM':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="formTitle">Form Title</Label>
              <Input
                id="formTitle"
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                placeholder="Contact Form"
              />
            </div>
            <div>
              <Label>Form Fields</Label>
              <div className="space-y-4 mt-2">
                {(config.fields || []).map((field: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Field {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newFields = (config.fields || []).filter((_: any, i: number) => i !== index);
                          updateConfig('fields', newFields);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div>
                      <Label>Field Type</Label>
                      <Select
                        value={field.type || 'text'}
                        onValueChange={(value) => {
                          const newFields = [...(config.fields || [])];
                          newFields[index] = { ...newFields[index], type: value };
                          updateConfig('fields', newFields);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="tel">Phone</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Input
                      value={field.name || ''}
                      onChange={(e) => {
                        const newFields = [...(config.fields || [])];
                        newFields[index] = { ...newFields[index], name: e.target.value };
                        updateConfig('fields', newFields);
                      }}
                      placeholder="Field name (e.g., email)"
                    />
                    <Input
                      value={field.label || ''}
                      onChange={(e) => {
                        const newFields = [...(config.fields || [])];
                        newFields[index] = { ...newFields[index], label: e.target.value };
                        updateConfig('fields', newFields);
                      }}
                      placeholder="Field label"
                    />
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => {
                        const newFields = [...(config.fields || [])];
                        newFields[index] = { ...newFields[index], placeholder: e.target.value };
                        updateConfig('fields', newFields);
                      }}
                      placeholder="Placeholder (optional)"
                    />
                    {field.type === 'select' && (
                      <Textarea
                        value={field.options?.join('\n') || ''}
                        onChange={(e) => {
                          const newFields = [...(config.fields || [])];
                          newFields[index] = { ...newFields[index], options: e.target.value.split('\n').filter(Boolean) };
                          updateConfig('fields', newFields);
                        }}
                        placeholder="Options (one per line)"
                        rows={3}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <Label>Required</Label>
                      <Switch
                        checked={field.required ?? false}
                        onCheckedChange={(checked) => {
                          const newFields = [...(config.fields || [])];
                          newFields[index] = { ...newFields[index], required: checked };
                          updateConfig('fields', newFields);
                        }}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFields = [...(config.fields || []), { 
                      name: '', 
                      type: 'text', 
                      label: '', 
                      placeholder: '', 
                      required: false,
                      order: (config.fields || []).length
                    }];
                    updateConfig('fields', newFields);
                  }}
                  className="w-full"
                >
                  + Add Field
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="submitButtonText">Submit Button Text</Label>
              <Input
                id="submitButtonText"
                value={config.submitButtonText || ''}
                onChange={(e) => updateConfig('submitButtonText', e.target.value)}
                placeholder="Submit"
              />
            </div>
            <div>
              <Label htmlFor="successMessage">Success Message</Label>
              <Textarea
                id="successMessage"
                value={config.successMessage || ''}
                onChange={(e) => updateConfig('successMessage', e.target.value)}
                placeholder="Thank you for your submission!"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <Switch
                id="emailNotifications"
                checked={config.emailNotifications ?? false}
                onCheckedChange={(checked) => updateConfig('emailNotifications', checked)}
              />
            </div>
            {config.emailNotifications && (
              <div>
                <Label htmlFor="notificationEmail">Notification Email</Label>
                <Input
                  id="notificationEmail"
                  type="email"
                  value={config.notificationEmail || ''}
                  onChange={(e) => updateConfig('notificationEmail', e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}
          </div>
        );

      case 'TESTIMONIALS':
        return (
          <div className="space-y-4">
            <div>
              <Label>Testimonials</Label>
              <div className="space-y-4 mt-2">
                {(config.testimonials || []).map((testimonial: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Testimonial {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newTestimonials = (config.testimonials || []).filter((_: any, i: number) => i !== index);
                          updateConfig('testimonials', newTestimonials);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={testimonial.name || ''}
                      onChange={(e) => {
                        const newTestimonials = [...(config.testimonials || [])];
                        newTestimonials[index] = { ...newTestimonials[index], name: e.target.value };
                        updateConfig('testimonials', newTestimonials);
                      }}
                      placeholder="Customer name"
                    />
                    <Input
                      value={testimonial.role || ''}
                      onChange={(e) => {
                        const newTestimonials = [...(config.testimonials || [])];
                        newTestimonials[index] = { ...newTestimonials[index], role: e.target.value };
                        updateConfig('testimonials', newTestimonials);
                      }}
                      placeholder="Role/Title (optional)"
                    />
                    <Input
                      value={testimonial.company || ''}
                      onChange={(e) => {
                        const newTestimonials = [...(config.testimonials || [])];
                        newTestimonials[index] = { ...newTestimonials[index], company: e.target.value };
                        updateConfig('testimonials', newTestimonials);
                      }}
                      placeholder="Company (optional)"
                    />
                    <Textarea
                      value={testimonial.content || ''}
                      onChange={(e) => {
                        const newTestimonials = [...(config.testimonials || [])];
                        newTestimonials[index] = { ...newTestimonials[index], content: e.target.value };
                        updateConfig('testimonials', newTestimonials);
                      }}
                      placeholder="Testimonial content"
                      rows={3}
                    />
                    <ImageUpload
                      label="Avatar (Optional)"
                      value={testimonial.avatar || ''}
                      onChange={(url) => {
                        const newTestimonials = [...(config.testimonials || [])];
                        newTestimonials[index] = { ...newTestimonials[index], avatar: url };
                        updateConfig('testimonials', newTestimonials);
                      }}
                      endpoint="profile-photo"
                    />
                    <div>
                      <Label>Rating</Label>
                      <Select
                        value={testimonial.rating?.toString() || '5'}
                        onValueChange={(value) => {
                          const newTestimonials = [...(config.testimonials || [])];
                          newTestimonials[index] = { ...newTestimonials[index], rating: parseInt(value) };
                          updateConfig('testimonials', newTestimonials);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTestimonials = [...(config.testimonials || []), { 
                      name: '', 
                      role: '', 
                      company: '', 
                      content: '', 
                      avatar: '',
                      rating: 5
                    }];
                    updateConfig('testimonials', newTestimonials);
                  }}
                  className="w-full"
                >
                  + Add Testimonial
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="testimonialsLayout">Layout</Label>
              <Select
                value={config.layout || 'carousel'}
                onValueChange={(value) => updateConfig('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showRatings">Show Ratings</Label>
              <Switch
                id="showRatings"
                checked={config.showRatings ?? true}
                onCheckedChange={(checked) => updateConfig('showRatings', checked)}
              />
            </div>
          </div>
        );

      case 'SERVICES':
        return (
          <div className="space-y-4">
            <div>
              <Label>Services</Label>
              <div className="space-y-4 mt-2">
                {(config.services || []).map((service: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Service {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newServices = (config.services || []).filter((_: any, i: number) => i !== index);
                          updateConfig('services', newServices);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      value={service.title || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...newServices[index], title: e.target.value };
                        updateConfig('services', newServices);
                      }}
                      placeholder="Service title"
                    />
                    <Textarea
                      value={service.description || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...newServices[index], description: e.target.value };
                        updateConfig('services', newServices);
                      }}
                      placeholder="Service description"
                      rows={3}
                    />
                    <Input
                      value={service.icon || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...newServices[index], icon: e.target.value };
                        updateConfig('services', newServices);
                      }}
                      placeholder="Icon (emoji or text)"
                    />
                    <Input
                      value={service.price || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...newServices[index], price: e.target.value };
                        updateConfig('services', newServices);
                      }}
                      placeholder="Price (e.g., $99)"
                    />
                    <Input
                      value={service.url || ''}
                      onChange={(e) => {
                        const newServices = [...(config.services || [])];
                        newServices[index] = { ...newServices[index], url: e.target.value };
                        updateConfig('services', newServices);
                      }}
                      placeholder="Link URL (optional)"
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newServices = [...(config.services || []), { 
                      title: '', 
                      description: '', 
                      icon: '',
                      price: '', 
                      url: ''
                    }];
                    updateConfig('services', newServices);
                  }}
                  className="w-full"
                >
                  + Add Service
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="servicesLayout">Layout</Label>
              <Select
                value={config.layout || 'grid'}
                onValueChange={(value) => updateConfig('layout', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="servicesColumns">Columns</Label>
              <Select
                value={config.columns?.toString() || '2'}
                onValueChange={(value) => updateConfig('columns', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                </SelectContent>
              </Select>
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Component</DialogTitle>
          <DialogDescription>
            Customize the appearance and behavior of your {component.type.toLowerCase()}{' '}
            component.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="content" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="style">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 py-4 overflow-y-auto flex-1">
            {renderConfigEditor()}
          </TabsContent>

          <TabsContent value="style" className="space-y-4 py-4 overflow-y-auto flex-1">
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

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
