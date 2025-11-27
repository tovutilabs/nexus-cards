import React from 'react';
import { CardComponentRendererProps, SocialLinksConfig } from './types';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github, 
  Youtube, 
  Link as LinkIcon,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * SocialLinksComponent
 * 
 * Renders social media links with platform icons.
 * Supports multiple layouts (icons, buttons, compact) and customizable styling.
 */

// Map platform names to icons
const PLATFORM_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
  youtube: Youtube,
  email: Mail,
  default: LinkIcon,
};

// Platform display names
const PLATFORM_NAMES: Record<string, string> = {
  facebook: 'Facebook',
  twitter: 'Twitter',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  snapchat: 'Snapchat',
  pinterest: 'Pinterest',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  email: 'Email',
};

export function SocialLinksComponent({
  component,
  cardData,
  isEditing = false,
}: CardComponentRendererProps) {
  const config = component.config as SocialLinksConfig;

  // Default values
  const links = config.links || [];
  const layout = config.layout || 'icons';
  const iconSize = config.iconSize || 'medium';
  const showLabels = config.showLabels !== false;

  const getIcon = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    return PLATFORM_ICONS[normalizedPlatform] || PLATFORM_ICONS.default;
  };

  const getPlatformName = (platform: string) => {
    const normalizedPlatform = platform.toLowerCase();
    return PLATFORM_NAMES[normalizedPlatform] || platform;
  };

  const iconSizeClasses = {
    small: 'h-5 w-5',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
  };

  if (links.length === 0 && !isEditing) {
    return null;
  }

  // Icons layout - just icon buttons
  if (layout === 'icons') {
    return (
      <div
        className={cn(
          'social-links-component p-6',
          isEditing && !component.enabled && 'opacity-50'
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          Connect With Me
        </h3>

        {links.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {links.map((link, index) => {
              const Icon = getIcon(link.platform);
              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center p-3 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label={getPlatformName(link.platform)}
                >
                  <Icon className={cn(iconSizeClasses[iconSize], 'text-gray-700 dark:text-gray-300')} />
                </a>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-400 italic text-center py-4">
            No social links added yet.
          </div>
        )}

        {isEditing && (
          <div className="mt-4 text-xs text-gray-500 italic text-center">
            Social Links Component
          </div>
        )}
      </div>
    );
  }

  // Buttons layout - full button with icon and label
  if (layout === 'buttons') {
    return (
      <div
        className={cn(
          'social-links-component p-6',
          isEditing && !component.enabled && 'opacity-50'
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Follow Me
        </h3>

        {links.length > 0 ? (
          <div className="flex flex-col gap-2">
            {links.map((link, index) => {
              const Icon = getIcon(link.platform);
              return (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  className="w-full justify-start"
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-5 w-5 mr-2" />
                    {showLabels && getPlatformName(link.platform)}
                    {link.username && <span className="ml-auto text-gray-500">@{link.username}</span>}
                  </a>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="text-gray-400 italic text-center py-4">
            No social links added yet.
          </div>
        )}

        {isEditing && (
          <div className="mt-4 text-xs text-gray-500 italic">
            Social Links Component
          </div>
        )}
      </div>
    );
  }

  // Compact layout - horizontal row with small icons
  return (
    <div
      className={cn(
        'social-links-component px-6 py-3 border-y border-gray-200 dark:border-gray-700',
        isEditing && !component.enabled && 'opacity-50'
      )}
    >
      {links.length > 0 ? (
        <div className="flex items-center justify-center gap-4">
          {links.map((link, index) => {
            const Icon = getIcon(link.platform);
            return (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                aria-label={getPlatformName(link.platform)}
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      ) : (
        <div className="text-gray-400 italic text-center py-2 text-sm">
          No social links
        </div>
      )}

      {isEditing && (
        <div className="mt-2 text-xs text-gray-500 italic text-center">
          Social Links Component (Compact)
        </div>
      )}
    </div>
  );
}
