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
import { applyTemplateStyles } from '@/lib/template-themes';

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
  templateTheme,
}: CardComponentRendererProps) {
  const config = component.config as SocialLinksConfig;

  // Default values
  const links = config.links || [];
  const layout = config.layout || 'icons';
  const iconSize = config.iconSize || 'medium';
  const showLabels = config.showLabels !== false;
  const variant = config.variant || 'default';
  const title = config.title || 'Connect With Me';
  const platforms = config.platforms || [];

  // Apply template theme styling
  const containerStyles = applyTemplateStyles({
    padding: '1.5rem',
    marginBottom: '1rem',
  }, templateTheme);

  const headingColor = templateTheme?.colors.text || undefined;

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

  // Basic Business variant - matches CardRenderView lines 244-279
  if (variant === 'basic-business' && layout === 'circles') {
    const socialLinks = cardData?.socialLinks || {};
    const displayLinks = [];

    // Build links from socialLinks object (supports both formats: linkedin and linkedinUrl)
    if (platforms.includes('linkedin') && (socialLinks.linkedin || socialLinks.linkedinUrl)) {
      displayLinks.push({
        platform: 'linkedin',
        url: socialLinks.linkedin || socialLinks.linkedinUrl,
        icon: Linkedin,
        className: 'card-basic-social-link-linkedin',
      });
    }
    if (platforms.includes('twitter') && (socialLinks.twitter || socialLinks.twitterUrl)) {
      displayLinks.push({
        platform: 'twitter',
        url: socialLinks.twitter || socialLinks.twitterUrl,
        icon: Twitter,
        className: 'card-basic-social-link-twitter',
      });
    }
    if (platforms.includes('github') && (socialLinks.github || socialLinks.githubUrl)) {
      displayLinks.push({
        platform: 'github',
        url: socialLinks.github || socialLinks.githubUrl,
        icon: Github,
        className: 'card-basic-social-link-github',
      });
    }
    if (platforms.includes('facebook') && (socialLinks.facebook || socialLinks.facebookUrl)) {
      displayLinks.push({
        platform: 'facebook',
        url: socialLinks.facebook || socialLinks.facebookUrl,
        icon: Facebook,
        className: 'card-basic-social-link-facebook',
      });
    }
    if (platforms.includes('instagram') && (socialLinks.instagram || socialLinks.instagramUrl)) {
      displayLinks.push({
        platform: 'instagram',
        url: socialLinks.instagram || socialLinks.instagramUrl,
        icon: Instagram,
        className: 'card-basic-social-link-instagram',
      });
    }
    if (platforms.includes('youtube') && (socialLinks.youtube || socialLinks.youtubeUrl)) {
      displayLinks.push({
        platform: 'youtube',
        url: socialLinks.youtube || socialLinks.youtubeUrl,
        icon: Youtube,
        className: 'card-basic-social-link-youtube',
      });
    }

    if (displayLinks.length === 0 && !isEditing) {
      return null;
    }

    return (
      <div className={cn('card-basic-social', isEditing && !component.enabled && 'opacity-50')}>
        <h3 className="card-basic-social-title">{title}</h3>
        <div className="card-basic-social-links">
          {displayLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.platform}
                href={link.url}
                className={cn('card-basic-social-link', link.className)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={getPlatformName(link.platform)}
              >
                <Icon />
              </a>
            );
          })}
        </div>
        {isEditing && (
          <div className="mt-2 text-xs text-gray-500 italic">
            Social Links Component (Basic Business)
          </div>
        )}
      </div>
    );
  }

  // Default variant
  if (links.length === 0 && !isEditing) {
    return null;
  }

  // Icons layout - just icon buttons
  if (layout === 'icons') {
    return (
      <div
        style={containerStyles}
        className={cn(
          'social-links-component',
          isEditing && !component.enabled && 'opacity-50'
        )}
      >
        <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: headingColor }}>
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
