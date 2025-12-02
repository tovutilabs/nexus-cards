'use client';

import React from 'react';
import { Star, Quote, Pencil } from 'lucide-react';
import { CardComponentRendererProps, TestimonialsConfig } from './types';
import { NexusButton } from '@/components/nexus';

export function TestimonialsComponent({
  component,
  cardData,
  isEditing = false,
  onEdit,
}: CardComponentRendererProps) {
  const config = component.config as TestimonialsConfig;
  const testimonials = config?.testimonials || [];
  const layout = config?.layout || 'carousel';
  const showRatings = config?.showRatings !== false;

  // Show placeholder in edit mode if no testimonials configured
  if (testimonials.length === 0 && isEditing) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <Quote className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Testimonials</h3>
        <p className="text-sm text-gray-500 mb-4">
          Display customer reviews and ratings
        </p>
        {onEdit && (
          <NexusButton onClick={() => onEdit(component)} size="sm">
            <Quote className="h-4 w-4 mr-2" />
            Add Testimonials
          </NexusButton>
        )}
      </div>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  const renderStars = (rating?: number) => {
    if (!showRatings || !rating) return null;

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderTestimonial = (testimonial: TestimonialsConfig['testimonials'][0], index: number) => (
    <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
      <Quote className="h-8 w-8 text-gray-300 mb-3" />
      
      <p className="text-gray-700 mb-4 italic">&ldquo;{testimonial.content}&rdquo;</p>
      
      {renderStars(testimonial.rating)}
      
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
        {testimonial.avatar ? (
          <img
            src={testimonial.avatar}
            alt={testimonial.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-lg">
              {testimonial.name.charAt(0)}
            </span>
          </div>
        )}
        
        <div>
          <div className="font-semibold text-gray-900">{testimonial.name}</div>
          {(testimonial.role || testimonial.company) && (
            <div className="text-sm text-gray-600">
              {[testimonial.role, testimonial.company].filter(Boolean).join(' at ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCarousel = () => (
    <div className="relative">
      <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
        <div className="flex gap-4 pb-4">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="flex-shrink-0 w-full md:w-96 snap-center">
              {renderTestimonial(testimonial, index)}
            </div>
          ))}
        </div>
      </div>
      {testimonials.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {testimonials.map((_, index) => (
            <div key={index} className="w-2 h-2 rounded-full bg-gray-300" />
          ))}
        </div>
      )}
    </div>
  );

  const renderGrid = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {testimonials.map((testimonial, index) => renderTestimonial(testimonial, index))}
    </div>
  );

  const renderList = () => (
    <div className="space-y-4">
      {testimonials.map((testimonial, index) => renderTestimonial(testimonial, index))}
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
            Edit Testimonials
          </button>
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        What People Say
      </h3>

      {layout === 'carousel' && renderCarousel()}
      {layout === 'grid' && renderGrid()}
      {layout === 'list' && renderList()}
    </div>
  );
}
