'use client';

import { useState } from 'react';
import { Check, Lock, User, Phone, Share2, Sparkles } from 'lucide-react';
import { CardTemplate } from '@/hooks/useTemplates';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Component icons mapping
const COMPONENT_ICONS = {
  PROFILE: User,
  CONTACT: Phone,
  SOCIAL_LINKS: Share2,
} as const;

// Get supported components from template config
function getTemplateComponents(template: CardTemplate): string[] {
  const supportedComponents = template.config?.supportedComponents;
  if (Array.isArray(supportedComponents)) {
    return supportedComponents;
  }
  return [];
}

interface TemplateGalleryProps {
  templates: CardTemplate[];
  currentTemplateId: string | null;
  userTier: 'FREE' | 'PRO' | 'PREMIUM';
  onApply: (templateId: string) => void;
  isApplying?: boolean;
}

const TIER_ORDER = { FREE: 0, PRO: 1, PREMIUM: 2 };

export function TemplateGallery({
  templates,
  currentTemplateId,
  userTier,
  onApply,
  isApplying = false,
}: TemplateGalleryProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(currentTemplateId);

  const canAccessTemplate = (template: CardTemplate) => {
    return TIER_ORDER[userTier] >= TIER_ORDER[template.minTier];
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, CardTemplate[]>);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Select a professionally designed template as the starting point for your card.
        </p>
      </div>

      {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
            {category}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTemplates.map((template) => {
              const isLocked = !canAccessTemplate(template);
              const isSelected = selectedTemplate === template.id;
              const isCurrent = currentTemplateId === template.id;

              return (
                <Card
                  key={template.id}
                  className={cn(
                    'relative overflow-hidden transition-all cursor-pointer hover:shadow-lg',
                    isSelected && 'ring-2 ring-primary',
                    isLocked && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => {
                    if (!isLocked) {
                      setSelectedTemplate(template.id);
                    }
                  }}
                >
                  {/* Preview Image */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative">
                    {template.previewImageUrl ? (
                      <img
                        src={template.previewImageUrl}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-4xl font-bold text-gray-400">
                          {template.name.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Lock Overlay */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="h-8 w-8 mx-auto mb-2" />
                          <Badge variant="secondary">{template.minTier}</Badge>
                        </div>
                      </div>
                    )}

                    {/* Current Badge */}
                    {isCurrent && !isLocked && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="default" className="gap-1">
                          <Check className="h-3 w-3" />
                          Current
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h5 className="font-semibold">{template.name}</h5>
                      <Badge variant="outline" className="text-xs">
                        {template.minTier}
                      </Badge>
                    </div>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {template.description}
                      </p>
                    )}

                    {/* Component Breakdown */}
                    {(() => {
                      const components = getTemplateComponents(template);
                      if (components.length > 0) {
                        return (
                          <div className="mb-3">
                            <div className="flex items-center gap-1 mb-2">
                              <Sparkles className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium text-muted-foreground">
                                Editable Components
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {components.map((componentType) => {
                                const Icon = COMPONENT_ICONS[componentType as keyof typeof COMPONENT_ICONS];
                                if (!Icon) return null;
                                return (
                                  <Badge
                                    key={componentType}
                                    variant="secondary"
                                    className="text-xs gap-1"
                                  >
                                    <Icon className="h-3 w-3" />
                                    {componentType.replace('_', ' ')}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {!isLocked && !isCurrent && isSelected && (
                      <Button
                        className="w-full mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          onApply(template.id);
                        }}
                        disabled={isApplying}
                      >
                        {isApplying ? 'Applying...' : 'Apply Template'}
                      </Button>
                    )}

                    {isLocked && (
                      <Button className="w-full mt-4" variant="outline" disabled>
                        <Lock className="h-4 w-4 mr-2" />
                        Upgrade to {template.minTier}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
