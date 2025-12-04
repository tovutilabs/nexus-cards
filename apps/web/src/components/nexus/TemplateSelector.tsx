'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Check, Lock } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  industry: string[];
  minTier: string;
  isFeatured: boolean;
  config: {
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    typography: {
      fontFamily: string;
      headingWeight: string;
      bodyWeight: string;
    };
    layout: string;
    spacing: string;
    borderRadius: string;
    shadow: string;
  };
}

interface TemplateSelectorProps {
  cardId: string;
  currentTemplateId?: string;
  userTier: string;
  onTemplateApplied?: () => void;
}

const categoryLabels: Record<string, string> = {
  tech: 'Tech & Startup',
  corporate: 'Corporate',
  creative: 'Creative',
  minimal: 'Minimal',
  bold: 'Bold & Vibrant',
};

export function TemplateSelector({
  cardId,
  currentTemplateId,
  userTier,
  onTemplateApplied,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const apiClient = createApiClient();
      const data = await apiClient.get<Template[]>('/templates');
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = async (templateId: string) => {
    setApplying(templateId);
    try {
      const apiClient = createApiClient();
      await apiClient.post(`/templates/apply/${cardId}`, {
        templateId,
        preserveContent: true,
      });
      
      if (onTemplateApplied) {
        onTemplateApplied();
      }
      
      // Redirect to customize page
      router.push(`/dashboard/cards/${cardId}/customize`);
    } catch (error: any) {
      console.error('Failed to apply template:', error);
      alert(error.message || 'Failed to apply template');
    } finally {
      setApplying(null);
    }
  };

  const canUseTemplate = (template: Template): boolean => {
    const tierHierarchy = { FREE: 0, PRO: 1, PREMIUM: 2 };
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;
    const templateTierLevel = tierHierarchy[template.minTier as keyof typeof tierHierarchy] || 0;
    return userTierLevel >= templateTierLevel;
  };

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const featuredTemplates = templates.filter(t => t.isFeatured);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {featuredTemplates.length > 0 && selectedCategory === 'all' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Featured Templates</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={template.id === currentTemplateId}
                canUse={canUseTemplate(template)}
                isApplying={applying === template.id}
                onApply={() => applyTemplate(template.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category === 'all' ? 'All Templates' : categoryLabels[category] || category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={template.id === currentTemplateId}
              canUse={canUseTemplate(template)}
              isApplying={applying === template.id}
              onApply={() => applyTemplate(template.id)}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <p>No templates found in this category</p>
            </div>
          </Card>
        )}
      </div>

      <Card className="p-6 bg-indigo-50 border-indigo-200">
        <div className="flex items-start gap-4">
          <Sparkles className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-indigo-900 mb-1">
              Pro Tip: Templates are just the starting point
            </h4>
            <p className="text-sm text-indigo-700">
              After selecting a template, you can fully customize colors, components, layout, and more in the Customization Studio.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  canUse: boolean;
  isApplying: boolean;
  onApply: () => void;
}

function TemplateCard({ template, isSelected, canUse, isApplying, onApply }: TemplateCardProps) {
  const { config } = template;

  return (
    <Card className={`overflow-hidden transition-all ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}>
      <div
        className="h-32 p-4 flex items-center justify-center relative"
        style={{
          background: `linear-gradient(135deg, ${config.colorScheme.primary} 0%, ${config.colorScheme.secondary} 100%)`,
        }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-2 flex items-center justify-center text-xl font-bold"
            style={{
              backgroundColor: config.colorScheme.background,
              color: config.colorScheme.text,
            }}
          >
            AB
          </div>
          <div
            className="text-sm font-semibold"
            style={{ color: config.colorScheme.background }}
          >
            Preview
          </div>
        </div>
        {template.isFeatured && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-yellow-500 text-white">Featured</Badge>
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              <Check className="h-3 w-3" />
              Active
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold text-gray-900">{template.name}</h4>
            <p className="text-xs text-gray-500 capitalize">{template.category}</p>
          </div>
          {template.minTier !== 'FREE' && (
            <Badge variant="outline" className="text-xs">
              {template.minTier}
            </Badge>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {template.description}
        </p>

        <div className="flex flex-wrap gap-1 mb-4">
          {template.industry.slice(0, 3).map((industry) => (
            <Badge key={industry} variant="secondary" className="text-xs">
              {industry}
            </Badge>
          ))}
        </div>

        <Button
          onClick={onApply}
          disabled={!canUse || isApplying}
          className="w-full"
          variant={isSelected ? 'outline' : 'default'}
        >
          {!canUse ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Upgrade to {template.minTier}
            </>
          ) : isApplying ? (
            'Applying...'
          ) : isSelected ? (
            'Reapply Template'
          ) : (
            'Use Template'
          )}
        </Button>
      </div>
    </Card>
  );
}
