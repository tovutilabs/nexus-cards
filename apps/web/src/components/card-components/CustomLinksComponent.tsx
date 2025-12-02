'use client';

import React from 'react';
import { ExternalLink, Plus, Pencil } from 'lucide-react';
import { CardComponentRendererProps, CustomLinksConfig } from './types';
import { NexusButton } from '@/components/nexus';

export function CustomLinksComponent({
  component,
  cardData,
  isEditing = false,
  onEdit,
}: CardComponentRendererProps) {
  const config = component.config as CustomLinksConfig;
  const links = config?.links || [];
  const style = config?.style || 'button';

  // Show placeholder in edit mode if no links configured
  if (links.length === 0 && isEditing) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <ExternalLink className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Custom Links</h3>
        <p className="text-sm text-gray-500 mb-4">
          Add custom buttons linking to any URL
        </p>
        {onEdit && (
          <NexusButton onClick={() => onEdit(component)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Links
          </NexusButton>
        )}
      </div>
    );
  }

  if (links.length === 0) {
    return null;
  }

  const renderMinimalStyle = () => (
    <div className="space-y-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            {link.icon && <span className="text-xl">{link.icon}</span>}
            <div>
              <div className="font-medium text-gray-900 group-hover:text-primary">
                {link.title}
              </div>
              {link.description && (
                <div className="text-sm text-gray-500">{link.description}</div>
              )}
            </div>
          </div>
          <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary" />
        </a>
      ))}
    </div>
  );

  const renderCardStyle = () => (
    <div className="grid gap-4">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all group"
        >
          <div className="flex items-start gap-3">
            {link.icon && (
              <span className="text-2xl flex-shrink-0">{link.icon}</span>
            )}
            <div className="flex-1">
              <div className="font-semibold text-gray-900 group-hover:text-primary mb-1">
                {link.title}
              </div>
              {link.description && (
                <div className="text-sm text-gray-600">{link.description}</div>
              )}
            </div>
            <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-primary flex-shrink-0" />
          </div>
        </a>
      ))}
    </div>
  );

  const renderButtonStyle = () => (
    <div className="grid gap-3">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          {link.icon && <span className="text-lg">{link.icon}</span>}
          <span>{link.title}</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      {isEditing && onEdit && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => onEdit(component)}
            className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit Links
          </button>
        </div>
      )}
      
      {style === 'minimal' && renderMinimalStyle()}
      {style === 'card' && renderCardStyle()}
      {style === 'button' && renderButtonStyle()}
    </div>
  );
}
