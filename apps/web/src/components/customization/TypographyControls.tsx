'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardStyling, UpdateStylingDto } from '@/hooks/useCardStyling';

interface TypographyControlsProps {
  styling: CardStyling;
  onChange: (updates: UpdateStylingDto) => void;
}

const FONT_FAMILIES = [
  { name: 'System Default', value: 'system-ui' },
  { name: 'Inter', value: 'Inter' },
  { name: 'Roboto', value: 'Roboto' },
  { name: 'Open Sans', value: 'Open Sans' },
  { name: 'Lato', value: 'Lato' },
  { name: 'Montserrat', value: 'Montserrat' },
  { name: 'Poppins', value: 'Poppins' },
  { name: 'Playfair Display', value: 'Playfair Display' },
  { name: 'Merriweather', value: 'Merriweather' },
];

export function TypographyControls({ styling, onChange }: TypographyControlsProps) {
  const [fontFamily, setFontFamily] = useState(styling.fontFamily || 'system-ui');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>(styling.fontSize || 'md');

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({
        fontFamily,
        fontSizeScale: fontSize,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [fontFamily, fontSize]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Typography</h3>

        {/* Font Family */}
        <div className="space-y-3 mb-6">
          <Label htmlFor="fontFamily">Font Family</Label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger id="fontFamily">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div
            className="p-4 border rounded-md text-center"
            style={{ fontFamily }}
          >
            <p className="text-2xl font-semibold mb-2">The quick brown fox</p>
            <p className="text-base">jumps over the lazy dog</p>
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label>Font Size</Label>
          <RadioGroup value={fontSize} onValueChange={(value: any) => setFontSize(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sm" id="size-sm" />
              <Label htmlFor="size-sm" className="font-normal cursor-pointer">
                Small - Compact and efficient
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="md" id="size-md" />
              <Label htmlFor="size-md" className="font-normal cursor-pointer">
                Medium - Balanced and readable
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lg" id="size-lg" />
              <Label htmlFor="size-lg" className="font-normal cursor-pointer">
                Large - Bold and prominent
              </Label>
            </div>
          </RadioGroup>

          {/* Size Preview */}
          <div className="p-4 border rounded-md space-y-2">
            <p
              className="font-semibold"
              style={{
                fontSize: fontSize === 'sm' ? '0.875rem' : fontSize === 'lg' ? '1.25rem' : '1rem',
              }}
            >
              Preview Text
            </p>
            <p
              className="text-muted-foreground"
              style={{
                fontSize: fontSize === 'sm' ? '0.75rem' : fontSize === 'lg' ? '1rem' : '0.875rem',
              }}
            >
              This is how your card text will appear with the selected size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
