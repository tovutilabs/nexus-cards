'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Lock } from 'lucide-react';
import { CardStyling, UpdateStylingDto } from '@/hooks/useCardStyling';
import { cn } from '@/lib/utils';

interface LayoutShapeControlsProps {
  styling: CardStyling;
  userTier: 'FREE' | 'PRO' | 'PREMIUM';
  onChange: (updates: UpdateStylingDto) => void;
}

const LAYOUTS = [
  {
    value: 'vertical',
    name: 'Vertical',
    description: 'Traditional card layout',
    minTier: 'FREE',
  },
  {
    value: 'horizontal',
    name: 'Horizontal',
    description: 'Side-by-side layout',
    minTier: 'FREE',
  },
  {
    value: 'centered',
    name: 'Centered',
    description: 'Centered content',
    minTier: 'FREE',
  },
  {
    value: 'image-first',
    name: 'Image First',
    description: 'Prominent image display',
    minTier: 'PRO',
  },
  {
    value: 'compact',
    name: 'Compact',
    description: 'Minimal spacing',
    minTier: 'PRO',
  },
] as const;

const BORDER_RADIUS = [
  { value: 'soft', name: 'Soft (4px)', class: 'rounded' },
  { value: 'rounded', name: 'Rounded (8px)', class: 'rounded-lg' },
  { value: 'pill', name: 'Pill (999px)', class: 'rounded-full' },
] as const;

const SHADOWS = [
  { value: 'none', name: 'None', class: 'shadow-none' },
  { value: 'soft', name: 'Soft', class: 'shadow-sm' },
  { value: 'medium', name: 'Medium', class: 'shadow-md' },
  { value: 'strong', name: 'Strong', class: 'shadow-lg' },
] as const;

const TIER_ORDER = { FREE: 0, PRO: 1, PREMIUM: 2 };

export function LayoutShapeControls({
  styling,
  userTier,
  onChange,
}: LayoutShapeControlsProps) {
  const [layout, setLayout] = useState<string>(styling.layout || 'vertical');
  const [borderRadius, setBorderRadius] = useState<string>(
    styling.borderRadius || 'rounded'
  );
  const [shadow, setShadow] = useState<string>(styling.shadowPreset || 'soft');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        layout: layout as any,
        borderRadiusPreset: borderRadius as any,
        shadowPreset: shadow as any,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [layout, borderRadius, shadow]);

  const canAccessLayout = (minTier: string) => {
    return TIER_ORDER[userTier] >= TIER_ORDER[minTier as keyof typeof TIER_ORDER];
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Layout & Shape</h3>

        {/* Layout */}
        <div className="space-y-3 mb-6">
          <Label>Layout Style</Label>
          <RadioGroup value={layout} onValueChange={setLayout}>
            {LAYOUTS.map((layoutOption) => {
              const isLocked = !canAccessLayout(layoutOption.minTier);
              return (
                <div
                  key={layoutOption.value}
                  className="flex items-center space-x-2"
                >
                  <RadioGroupItem
                    value={layoutOption.value}
                    id={`layout-${layoutOption.value}`}
                    disabled={isLocked}
                  />
                  <Label
                    htmlFor={`layout-${layoutOption.value}`}
                    className={cn(
                      'font-normal cursor-pointer flex items-center gap-2 flex-1',
                      isLocked && 'opacity-50'
                    )}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{layoutOption.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {layoutOption.description}
                      </div>
                    </div>
                    {isLocked && (
                      <>
                        <Lock className="h-3 w-3" />
                        <Badge variant="secondary" className="text-xs">
                          {layoutOption.minTier}
                        </Badge>
                      </>
                    )}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Border Radius */}
        <div className="space-y-3 mb-6">
          <Label>Border Radius</Label>
          <RadioGroup value={borderRadius} onValueChange={setBorderRadius}>
            {BORDER_RADIUS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`radius-${option.value}`}
                />
                <Label
                  htmlFor={`radius-${option.value}`}
                  className="font-normal cursor-pointer flex items-center gap-3 flex-1"
                >
                  <div
                    className={cn(
                      'w-12 h-12 bg-primary',
                      option.class
                    )}
                  />
                  {option.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Shadow */}
        <div className="space-y-3">
          <Label>Shadow</Label>
          <RadioGroup value={shadow} onValueChange={setShadow}>
            {SHADOWS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option.value}
                  id={`shadow-${option.value}`}
                />
                <Label
                  htmlFor={`shadow-${option.value}`}
                  className="font-normal cursor-pointer flex items-center gap-3 flex-1"
                >
                  <div
                    className={cn(
                      'w-12 h-12 bg-white border rounded',
                      option.class
                    )}
                  />
                  {option.name}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Preview Card */}
        <div className="mt-6 p-6 border rounded-lg bg-muted/20">
          <Label className="text-sm text-muted-foreground mb-3 block">Preview</Label>
          <div className="flex justify-center">
            <div
              className={cn(
                'w-64 h-32 bg-gradient-to-br from-primary/20 to-primary/5 border',
                BORDER_RADIUS.find((r) => r.value === borderRadius)?.class,
                SHADOWS.find((s) => s.value === shadow)?.class
              )}
            >
              <div className="p-4">
                <div className="font-semibold mb-1">Card Preview</div>
                <div className="text-sm text-muted-foreground">
                  This shows your selected shape
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
