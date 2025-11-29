'use client';

import React, { useState } from 'react';
import { CardComponentRendererProps, GalleryConfig } from './types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Image from 'next/image';

/**
 * GalleryComponent
 * 
 * Renders an image gallery with multiple layout options (grid, masonry, carousel).
 * Supports lightbox view for full-screen image viewing.
 */
export function GalleryComponent({
  component,
  cardData,
  isEditing = false,
}: CardComponentRendererProps) {
  const config = component.config as GalleryConfig;

  // Default values
  const images = config.images || [];
  const layout = config.layout || 'grid';
  const columns = config.columns || 3;
  const showCaptions = config.showCaptions !== false;
  const enableLightbox = config.lightbox !== false;

  // Lightbox state (must be declared before any conditional returns)
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Carousel state (declared here to avoid conditional hook calls)
  const [carouselIndex, setCarouselIndex] = useState(0);

  const openLightbox = (index: number) => {
    if (enableLightbox && !isEditing) {
      setCurrentImageIndex(index);
      setLightboxOpen(true);
    }
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0 && !isEditing) {
    return null;
  }

  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  // Grid layout
  if (layout === 'grid') {
    return (
      <div
        className={cn(
          'gallery-component p-6',
          isEditing && !component.enabled && 'opacity-50'
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Gallery
        </h3>

        {images.length > 0 ? (
          <>
            <div className={cn('grid gap-4', columnClasses[columns])}>
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer group"
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || image.caption || `Gallery image ${index + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  {showCaptions && image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-2">
                      {image.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Lightbox */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
              <DialogContent className="max-w-5xl p-0 bg-black/95">
                <div className="relative w-full h-[80vh] flex items-center justify-center">
                  {/* Close button */}
                  <button
                    onClick={closeLightbox}
                    className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-8 w-8" />
                  </button>

                  {/* Previous button */}
                  {images.length > 1 && (
                    <button
                      onClick={prevImage}
                      className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-12 w-12" />
                    </button>
                  )}

                  {/* Current image */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={images[currentImageIndex].url}
                      alt={images[currentImageIndex].alt || images[currentImageIndex].caption || `Image ${currentImageIndex + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  {/* Next button */}
                  {images.length > 1 && (
                    <button
                      onClick={nextImage}
                      className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-12 w-12" />
                    </button>
                  )}

                  {/* Caption */}
                  {showCaptions && images[currentImageIndex].caption && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-white text-lg px-4">
                      {images[currentImageIndex].caption}
                    </div>
                  )}

                  {/* Image counter */}
                  <div className="absolute top-4 left-4 text-white text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="text-gray-400 italic text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            No images in gallery. Add images to showcase your work.
          </div>
        )}

        {isEditing && (
          <div className="mt-4 text-xs text-gray-500 italic">
            Gallery Component
          </div>
        )}
      </div>
    );
  }

  // Carousel layout (simplified version)
  if (layout === 'carousel') {
    return (
      <div
        className={cn(
          'gallery-component p-6',
          isEditing && !component.enabled && 'opacity-50'
        )}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Gallery
        </h3>

        {images.length > 0 ? (
          <div className="relative">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <Image
                src={images[carouselIndex].url}
                alt={images[carouselIndex].alt || images[carouselIndex].caption || `Image ${carouselIndex + 1}`}
                fill
                className="object-cover"
              />
            </div>

            {images.length > 1 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {carouselIndex + 1} / {images.length}
                </span>
                <button
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % images.length)}
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            {showCaptions && images[carouselIndex].caption && (
              <p className="text-center text-gray-700 dark:text-gray-300 mt-2">
                {images[carouselIndex].caption}
              </p>
            )}
          </div>
        ) : (
          <div className="text-gray-400 italic text-center py-8">
            No images in carousel.
          </div>
        )}

        {isEditing && (
          <div className="mt-4 text-xs text-gray-500 italic">
            Gallery Component (Carousel)
          </div>
        )}
      </div>
    );
  }

  // Masonry layout (simplified as grid with varying heights)
  return (
    <div
      className={cn(
        'gallery-component p-6',
        isEditing && !component.enabled && 'opacity-50'
      )}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Gallery
      </h3>

      {images.length > 0 ? (
        <div className="columns-2 sm:columns-3 gap-4 space-y-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="break-inside-avoid relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img
                src={image.url}
                alt={image.alt || image.caption || `Gallery image ${index + 1}`}
                className="w-full h-auto transition-transform group-hover:scale-105"
              />
              {showCaptions && image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm p-2">
                  {image.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 italic text-center py-8">
          No images in gallery.
        </div>
      )}

      {isEditing && (
        <div className="mt-4 text-xs text-gray-500 italic">
          Gallery Component (Masonry)
        </div>
      )}
    </div>
  );
}
