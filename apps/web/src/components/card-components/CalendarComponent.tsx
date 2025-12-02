'use client';

import React from 'react';
import { Calendar as CalendarIcon, ExternalLink, Pencil } from 'lucide-react';
import { CardComponentRendererProps, CalendarConfig } from './types';
import { NexusButton } from '@/components/nexus';

export function CalendarComponent({
  component,
  cardData,
  isEditing = false,
  onEdit,
}: CardComponentRendererProps) {
  const config = component.config as CalendarConfig;

  // Show placeholder in edit mode if no calendar configured
  if (!config?.calendarUrl && isEditing) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Calendar Integration</h3>
        <p className="text-sm text-gray-500 mb-4">
          Schedule meetings with Calendly, Google Calendar, or Outlook
        </p>
        {onEdit && (
          <NexusButton onClick={() => onEdit(component)} size="sm">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Connect Calendar
          </NexusButton>
        )}
      </div>
    );
  }

  if (!config?.calendarUrl) {
    return null;
  }

  const platform = config.platform || 'custom';
  const buttonText = config.buttonText || 'Schedule a Meeting';
  const description = config.description;

  // Render embedded calendar for Calendly
  if (platform === 'calendly' && config.calendarUrl.includes('calendly.com')) {
    return (
      <div className="p-6">
        {isEditing && onEdit && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => onEdit(component)}
              className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              Edit Calendar
            </button>
          </div>
        )}

        {description && (
          <p className="text-gray-600 mb-4 text-center">{description}</p>
        )}

        <div className="relative w-full" style={{ minHeight: '630px' }}>
          <iframe
            src={config.calendarUrl}
            className="w-full h-full rounded-lg border border-gray-200"
            style={{ minHeight: '630px' }}
            frameBorder="0"
            title="Schedule a meeting"
          />
        </div>
      </div>
    );
  }

  // Render button for Google Calendar, Outlook, or custom links
  return (
    <div className="p-6">
      {isEditing && onEdit && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => onEdit(component)}
            className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit Calendar
          </button>
        </div>
      )}

      <div className="text-center">
        {description && (
          <p className="text-gray-600 mb-4">{description}</p>
        )}

        <a
          href={config.calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <CalendarIcon className="h-5 w-5" />
          <span>{buttonText}</span>
          <ExternalLink className="h-4 w-4" />
        </a>

        {platform === 'google' && (
          <p className="text-xs text-gray-500 mt-3">Opens in Google Calendar</p>
        )}
        {platform === 'outlook' && (
          <p className="text-xs text-gray-500 mt-3">Opens in Outlook Calendar</p>
        )}
      </div>
    </div>
  );
}
