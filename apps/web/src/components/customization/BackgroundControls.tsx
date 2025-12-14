'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { CardStyling, UpdateStylingDto } from '@/hooks/useCardStyling';
import { cn } from '@/lib/utils';

interface BackgroundControlsProps {
  styling: CardStyling;
  userTier: 'FREE' | 'PRO' | 'PREMIUM';
  onChange: (updates: UpdateStylingDto) => void;
}

const DESIGN_SYSTEM_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#9ca3af' },
  { name: 'Dark Gray', value: '#374151' },
  { name: 'Black', value: '#000000' },
  { name: 'Primary Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
];

const GRADIENT_PRESETS = [
  { name: 'Sunset', start: '#ff6b6b', end: '#feca57' },
  { name: 'Ocean', start: '#1e3a8a', end: '#06b6d4' },
  { name: 'Forest', start: '#065f46', end: '#10b981' },
  { name: 'Purple Haze', start: '#7c3aed', end: '#ec4899' },
  { name: 'Fire', start: '#dc2626', end: '#f97316' },
];

export function BackgroundControls({
  styling,
  userTier,
  onChange,
}: BackgroundControlsProps) {
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient' | 'image'>(
    styling.backgroundType || 'solid'
  );
  const [backgroundColor, setBackgroundColor] = useState(
    styling.backgroundColor || '#ffffff'
  );
  const [backgroundImage, setBackgroundImage] = useState(styling.backgroundImage || '');

  const canUseAdvanced = userTier === 'PRO' || userTier === 'PREMIUM';

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        backgroundType,
        backgroundColor,
        backgroundImage: backgroundType === 'image' ? backgroundImage : undefined,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [backgroundType, backgroundColor, backgroundImage]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Background</h3>

        {/* Background Type */}
        <div className="space-y-3">
          <Label>Background Type</Label>
          <RadioGroup
            value={backgroundType}
            onValueChange={(value: any) => {
              if (value !== 'solid' && !canUseAdvanced) return;
              setBackgroundType(value);
            }}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="solid" id="solid" />
              <Label htmlFor="solid" className="font-normal cursor-pointer">
                Solid Color
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gradient" id="gradient" disabled={!canUseAdvanced} />
              <Label
                htmlFor="gradient"
                className={cn(
                  'font-normal cursor-pointer flex items-center gap-2',
                  !canUseAdvanced && 'opacity-50'
                )}
              >
                Gradient
                {!canUseAdvanced && (
                  <>
                    <Lock className="h-3 w-3" />
                    <Badge variant="secondary" className="text-xs">
                      PRO
                    </Badge>
                  </>
                )}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" disabled={!canUseAdvanced} />
              <Label
                htmlFor="image"
                className={cn(
                  'font-normal cursor-pointer flex items-center gap-2',
                  !canUseAdvanced && 'opacity-50'
                )}
              >
                Image
                {!canUseAdvanced && (
                  <>
                    <Lock className="h-3 w-3" />
                    <Badge variant="secondary" className="text-xs">
                      PRO
                    </Badge>
                  </>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Solid Color Picker */}
        {backgroundType === 'solid' && (
          <div className="mt-6 space-y-4">
            <Label>Choose Color</Label>
            <div className="grid grid-cols-5 gap-3">
              {DESIGN_SYSTEM_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setBackgroundColor(color.value)}
                  className={cn(
                    'h-12 rounded-md border-2 transition-all',
                    backgroundColor === color.value
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Label htmlFor="customColor">Custom Color:</Label>
              <Input
                id="customColor"
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Gradient Presets */}
        {backgroundType === 'gradient' && canUseAdvanced && (
          <div className="mt-6 space-y-4">
            <Label>Gradient Presets</Label>
            <div className="grid grid-cols-2 gap-3">
              {GRADIENT_PRESETS.map((gradient) => (
                <button
                  key={gradient.name}
                  onClick={() => {
                    // For now, just use the start color as backgroundColor
                    // In a full implementation, you'd set gradient start/end
                    setBackgroundColor(gradient.start);
                  }}
                  className="h-20 rounded-md border-2 border-gray-200 hover:border-primary transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${gradient.start}, ${gradient.end})`,
                  }}
                  title={gradient.name}
                >
                  <span className="block text-white font-medium drop-shadow-lg">
                    {gradient.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image URL Input */}
        {backgroundType === 'image' && canUseAdvanced && (
          <div className="mt-6 space-y-4">
            <Label htmlFor="bgImage">Background Image URL</Label>
            <Input
              id="bgImage"
              type="url"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {backgroundImage && (
              <div className="mt-2 rounded-md overflow-hidden border">
                <img
                  src={backgroundImage}
                  alt="Background preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '';
                    e.currentTarget.alt = 'Invalid image URL';
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
