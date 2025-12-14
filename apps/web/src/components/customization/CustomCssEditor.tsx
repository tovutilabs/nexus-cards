'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CustomCssEditorProps {
  customCss: string | null;
  userTier: 'FREE' | 'PRO' | 'PREMIUM';
  onSave: (css: string) => void;
  isSaving?: boolean;
  error?: string | null;
}

const MAX_CSS_LENGTH = 100000; // 100KB

export function CustomCssEditor({
  customCss,
  userTier,
  onSave,
  isSaving = false,
  error = null,
}: CustomCssEditorProps) {
  const [cssValue, setCssValue] = useState(customCss || '');
  const [hasChanges, setHasChanges] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const canUseCustomCss = userTier === 'PREMIUM';

  useEffect(() => {
    setHasChanges(cssValue !== (customCss || ''));
  }, [cssValue, customCss]);

  const handleSave = () => {
    if (cssValue.length > MAX_CSS_LENGTH) {
      setLocalError(`CSS is too large (${cssValue.length} bytes). Maximum is ${MAX_CSS_LENGTH} bytes.`);
      return;
    }

    setLocalError(null);
    onSave(cssValue);
  };

  const cssLength = cssValue.length;
  const lengthPercent = (cssLength / MAX_CSS_LENGTH) * 100;

  if (!canUseCustomCss) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Advanced CSS</h3>
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3 w-3" />
            PREMIUM Only
          </Badge>
        </div>

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Custom CSS is available exclusively for PREMIUM tier users. Upgrade your
            account to unlock complete control over your card styling with custom CSS.
          </AlertDescription>
        </Alert>

        <div className="p-8 border-2 border-dashed rounded-lg text-center opacity-50">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Write custom CSS to fully customize your card appearance
          </p>
          <Button disabled>
            <Lock className="h-4 w-4 mr-2" />
            Upgrade to PREMIUM
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Advanced CSS</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add custom CSS to override styles. Use caution as invalid CSS may break your card.
          </p>
        </div>
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="h-3 w-3" />
          PREMIUM
        </Badge>
      </div>

      {/* Security Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Your CSS will be sanitized for security. Dangerous patterns (@import,
          javascript:, expression(), etc.) will be removed. Maximum size: 100KB.
        </AlertDescription>
      </Alert>

      {/* CSS Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="customCss">Custom CSS</Label>
          <span
            className={`text-xs ${
              lengthPercent > 90
                ? 'text-destructive'
                : lengthPercent > 70
                ? 'text-yellow-600'
                : 'text-muted-foreground'
            }`}
          >
            {cssLength.toLocaleString()} / {MAX_CSS_LENGTH.toLocaleString()} bytes (
            {lengthPercent.toFixed(1)}%)
          </span>
        </div>

        <Textarea
          id="customCss"
          value={cssValue}
          onChange={(e) => setCssValue(e.target.value)}
          placeholder={`/* Example custom CSS */
.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-component {
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Target specific elements */
.profile-name {
  font-size: 2rem;
  font-weight: bold;
}`}
          className="font-mono text-sm min-h-[400px] resize-y"
        />
      </div>

      {/* Error Messages */}
      {(localError || error) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{localError || error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setCssValue(customCss || '');
            setLocalError(null);
          }}
          disabled={!hasChanges}
        >
          Reset
        </Button>

        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? 'Saving...' : 'Save CSS'}
        </Button>
      </div>

      {/* CSS Guidelines */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">CSS Guidelines</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Use class selectors (.card-header, .profile-name, etc.)</li>
          <li>Avoid !important when possible</li>
          <li>Test changes in preview before saving</li>
          <li>Blocked patterns: @import, javascript:, expression(), data:, vbscript:</li>
          <li>Event handlers (onclick, onload, etc.) are not allowed</li>
        </ul>
      </div>
    </div>
  );
}
