'use client';

import React from 'react';
import { Briefcase, ExternalLink, Pencil } from 'lucide-react';
import { CardComponentRendererProps, ServicesConfig } from './types';
import { NexusButton } from '@/components/nexus';

export function ServicesComponent({
  component,
  cardData,
  isEditing = false,
  onEdit,
}: CardComponentRendererProps) {
  const config = component.config as ServicesConfig;
  const services = config?.services || [];
  const layout = config?.layout || 'grid';
  const columns = config?.columns || 2;

  // Show placeholder in edit mode if no services configured
  if (services.length === 0 && isEditing) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Services</h3>
        <p className="text-sm text-gray-500 mb-4">
          List your services or products with pricing
        </p>
        {onEdit && (
          <NexusButton onClick={() => onEdit(component)} size="sm">
            <Briefcase className="h-4 w-4 mr-2" />
            Add Services
          </NexusButton>
        )}
      </div>
    );
  }

  if (services.length === 0) {
    return null;
  }

  const renderService = (service: ServicesConfig['services'][0], index: number) => {
    const content = (
      <div className="h-full bg-white rounded-lg p-6 border border-gray-200 hover:border-primary hover:shadow-md transition-all">
        {service.icon && (
          <div className="text-4xl mb-4">{service.icon}</div>
        )}
        
        <h4 className="text-xl font-semibold text-gray-900 mb-2">
          {service.title}
        </h4>
        
        <p className="text-gray-600 mb-4">{service.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          {service.price && (
            <div className="text-lg font-bold text-primary">{service.price}</div>
          )}
          
          {service.url && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              Learn more
              <ExternalLink className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
    );

    if (service.url) {
      return (
        <a
          key={index}
          href={service.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {content}
        </a>
      );
    }

    return <div key={index}>{content}</div>;
  };

  const gridClasses = layout === 'grid' 
    ? `grid gap-4 ${
        columns === 1 ? '' : 
        columns === 2 ? 'md:grid-cols-2' : 
        'md:grid-cols-3'
      }`
    : 'space-y-4';

  return (
    <div className="p-6">
      {isEditing && onEdit && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => onEdit(component)}
            className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit Services
          </button>
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Services & Products
      </h3>

      <div className={gridClasses}>
        {services.map((service, index) => renderService(service, index))}
      </div>
    </div>
  );
}
