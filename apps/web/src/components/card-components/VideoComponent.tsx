'use client';

import React, { useState } from 'react';
import { Play, Pencil, Video as VideoIcon } from 'lucide-react';
import { CardComponentRendererProps, VideoConfig } from './types';
import { NexusButton } from '@/components/nexus';

export function VideoComponent({
  component,
  cardData,
  isEditing = false,
  onEdit,
}: CardComponentRendererProps) {
  const config = component.config as VideoConfig;
  const [playing, setPlaying] = useState(false);

  // Show placeholder in edit mode if no video configured
  if (!config?.url && isEditing) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Video Embed</h3>
        <p className="text-sm text-gray-500 mb-4">
          Embed YouTube or Vimeo videos
        </p>
        {onEdit && (
          <NexusButton onClick={() => onEdit(component)} size="sm">
            <VideoIcon className="h-4 w-4 mr-2" />
            Add Video
          </NexusButton>
        )}
      </div>
    );
  }

  if (!config?.url) {
    return null;
  }

  // Extract video ID and determine platform
  const getVideoEmbedUrl = () => {
    const url = config.url;
    const platform = config.platform || 'youtube';

    if (platform === 'custom') {
      // For custom uploaded videos, return the direct URL
      return url;
    }

    if (platform === 'youtube') {
      // Extract YouTube video ID
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = url.match(youtubeRegex);
      if (match) {
        const videoId = match[1];
        const autoplay = config.autoplay ? '1' : '0';
        const controls = config.showControls !== false ? '1' : '0';
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&controls=${controls}`;
      }
    } else if (platform === 'vimeo') {
      // Extract Vimeo video ID
      const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
      const match = url.match(vimeoRegex);
      if (match) {
        const videoId = match[1];
        const autoplay = config.autoplay ? '1' : '0';
        const controls = config.showControls !== false ? '1' : '0';
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay}&controls=${controls}`;
      }
    }

    return url;
  };

  const embedUrl = getVideoEmbedUrl();
  const isCustomVideo = config.platform === 'custom';

  return (
    <div className="p-6">
      {isEditing && onEdit && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => onEdit(component)}
            className="text-sm text-gray-600 hover:text-primary flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Edit Video
          </button>
        </div>
      )}

      {config.title && (
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{config.title}</h3>
      )}

      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        {!playing && config.thumbnail && !isCustomVideo ? (
          <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
            <img
              src={config.thumbnail}
              alt={config.title || 'Video thumbnail'}
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-primary ml-1" fill="currentColor" />
              </div>
            </div>
          </div>
        ) : isCustomVideo ? (
          <video
            src={embedUrl}
            className="absolute inset-0 w-full h-full rounded-lg"
            controls={config.showControls !== false}
            autoPlay={config.autoplay}
            poster={config.thumbnail}
            title={config.title || 'Video'}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={config.title || 'Embedded video'}
          />
        )}
      </div>
    </div>
  );
}
