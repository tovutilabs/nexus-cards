import React from 'react';
import { CardComponentRendererProps, AboutConfig } from './types';
import { cn } from '@/lib/utils';

/**
 * AboutComponent
 * 
 * Renders the "About" or bio section with optional title.
 * Supports different text alignments and rich text content.
 */
export function AboutComponent({
  component,
  cardData,
  isEditing = false,
}: CardComponentRendererProps) {
  const config = component.config as AboutConfig;

  // Default values
  const bio = config.bio || cardData?.bio || '';
  const title = config.title || 'About';
  const showTitle = config.showTitle !== false;
  const textAlign = config.textAlign || 'left';
  const maxLength = config.maxLength || 1000;

  // Truncate bio if needed
  const displayBio = bio.length > maxLength ? `${bio.slice(0, maxLength)}...` : bio;

  const alignmentClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (!bio && !isEditing) {
    return null;
  }

  return (
    <div
      className={cn(
        'about-component p-6 space-y-4',
        isEditing && !component.enabled && 'opacity-50'
      )}
    >
      {/* Title */}
      {showTitle && (
        <h3 className={cn('text-xl font-semibold text-gray-900 dark:text-white', alignmentClasses[textAlign])}>
          {title}
        </h3>
      )}

      {/* Bio Content */}
      {bio ? (
        <div
          className={cn(
            'text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed',
            alignmentClasses[textAlign]
          )}
        >
          {displayBio}
        </div>
      ) : (
        <div className="text-gray-400 italic text-center py-4">
          No bio available. Add your bio in the card settings.
        </div>
      )}

      {/* Editing indicator */}
      {isEditing && (
        <div className="mt-2 text-xs text-gray-500 italic">
          About Component
        </div>
      )}
    </div>
  );
}
