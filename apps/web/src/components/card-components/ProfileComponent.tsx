import React from 'react';
import { CardComponentRendererProps, ProfileConfig } from './types';
import { User, Briefcase, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * ProfileComponent
 * 
 * Renders the user's profile section with avatar, name, title, and company.
 * Configuration options control what information is displayed and layout.
 */
export function ProfileComponent({
  component,
  cardData,
  isEditing = false,
}: CardComponentRendererProps) {
  const config = component.config as ProfileConfig;

  // Default values
  const showAvatar = config.showAvatar !== false;
  const showBio = config.showBio !== false;
  const showJobTitle = config.showJobTitle !== false;
  const showCompany = config.showCompany !== false;
  const avatarShape = config.avatarShape || 'circle';
  const layout = config.layout || 'center';
  const variant = config.variant || 'default';

  // Extract data from cardData
  const firstName = cardData?.firstName || '';
  const lastName = cardData?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Your Name';
  const jobTitle = cardData?.jobTitle || null;
  const company = cardData?.company || null;
  const avatarUrl = cardData?.avatarUrl || null;
  const bio = cardData?.bio || null;

  // Generate initials for avatar fallback
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';

  // Basic Business variant - matches CardRenderView lines 145-172
  if (variant === 'basic-business') {
    return (
      <div className={cn('card-basic-header', isEditing && !component.enabled && 'opacity-50')}>
        <div className="card-basic-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} />
          ) : (
            <div className="card-basic-avatar-fallback">
              {initials}
            </div>
          )}
        </div>
        <h1 className="card-basic-name">{fullName}</h1>
        {showJobTitle && jobTitle && (
          <p className="card-basic-title">{jobTitle}</p>
        )}
        {showCompany && company && (
          <p className="card-basic-company">{company}</p>
        )}
        {isEditing && (
          <div className="mt-2 text-xs text-gray-500 italic">
            Profile Component (Basic Business)
          </div>
        )}
      </div>
    );
  }

  // Default variant
  const layoutClasses = {
    center: 'text-center items-center',
    left: 'text-left items-start',
    right: 'text-right items-end',
  };

  const avatarShapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'profile-component p-6 flex flex-col gap-4',
        layoutClasses[layout],
        isEditing && !component.enabled && 'opacity-50'
      )}
    >
      {/* Avatar */}
      {showAvatar && (
        <Avatar className={cn('h-24 w-24', avatarShapeClasses[avatarShape])}>
          <AvatarImage src={avatarUrl || undefined} alt={fullName} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Name */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {fullName}
        </h2>

        {/* Job Title */}
        {showJobTitle && jobTitle && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 justify-center">
            <Briefcase className="h-4 w-4" />
            <span className="text-sm">{jobTitle}</span>
          </div>
        )}

        {/* Company */}
        {showCompany && company && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 justify-center">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">{company}</span>
          </div>
        )}
      </div>

      {/* Bio */}
      {showBio && bio && (
        <p className="text-gray-700 dark:text-gray-300 max-w-prose">
          {bio}
        </p>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="mt-2 text-xs text-gray-500 italic">
          Profile Component
        </div>
      )}
    </div>
  );
}
