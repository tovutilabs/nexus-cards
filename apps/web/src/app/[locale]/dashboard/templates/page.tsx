'use client';

import { useEffect, useState } from 'react';
import { createApiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Star,
  Search,
  Eye,
  Palette,
  Check,
  Sparkles,
  Briefcase,
  Code,
  PenTool,
  Scale,
  Heart,
  Building,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  isFeatured: boolean;
  previewImage: string | null;
  colors: any;
  fonts: any;
  layout: any;
  createdAt: string;
}

interface UserCard {
  id: string;
  firstName: string;
  lastName: string;
  slug: string;
}

const categoryIcons: Record<string, any> = {
  tech: Code,
  corporate: Briefcase,
  creative: PenTool,
  legal: Scale,
  healthcare: Heart,
  default: Sparkles,
};

const categories = [
  { value: 'all', label: 'All Templates' },
  { value: 'tech', label: 'Tech & Startups' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'creative', label: 'Creative' },
  { value: 'legal', label: 'Legal' },
  { value: 'healthcare', label: 'Healthcare' },
];

export default function TemplatesPage() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedCategory]);

  const loadData = async () => {
    try {
      const apiClient = createApiClient();
      const [templatesResponse, cardsResponse] = await Promise.all([
        apiClient.get('/templates'),
        apiClient.get('/cards'),
      ]);

      setTemplates(templatesResponse as Template[]);
      setUserCards(cardsResponse as UserCard[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    setFilteredTemplates(filtered);
  };

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewDialogOpen(true);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate || !selectedCardId) return;

    setApplying(true);
    try {
      const apiClient = createApiClient();
      await apiClient.post(`/cards/${selectedCardId}/apply-template`, {
        templateId: selectedTemplate.id,
      });

      toast({
        title: 'Success',
        description: `Template "${selectedTemplate.name}" applied successfully!`,
      });

      setApplyDialogOpen(false);
      setSelectedTemplate(null);
      setSelectedCardId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to apply template',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const openApplyDialog = (template: Template) => {
    setSelectedTemplate(template);
    setApplyDialogOpen(true);
  };

  const featuredTemplates = filteredTemplates.filter((t) => t.isFeatured);
  const otherTemplates = filteredTemplates.filter((t) => !t.isFeatured);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Card Templates</h1>
        <p className="text-gray-600 mt-2">
          Choose from professionally designed templates to customize your
          digital business card
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {featuredTemplates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">
              Featured Templates
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={handlePreview}
                onApply={openApplyDialog}
              />
            ))}
          </div>
        </div>
      )}

      {otherTemplates.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            All Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={handlePreview}
                onApply={openApplyDialog}
              />
            ))}
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <Card className="p-12 text-center">
          <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              {selectedTemplate?.previewImage ? (
                <img
                  src={selectedTemplate.previewImage}
                  alt={selectedTemplate.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Eye className="h-12 w-12 mx-auto mb-2" />
                  <p>Preview not available</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  Colors
                </h4>
                <div className="flex gap-2">
                  {selectedTemplate?.colors?.primary && (
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{
                        backgroundColor: selectedTemplate.colors.primary,
                      }}
                      title="Primary"
                    />
                  )}
                  {selectedTemplate?.colors?.secondary && (
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{
                        backgroundColor: selectedTemplate.colors.secondary,
                      }}
                      title="Secondary"
                    />
                  )}
                  {selectedTemplate?.colors?.accent && (
                    <div
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{
                        backgroundColor: selectedTemplate.colors.accent,
                      }}
                      title="Accent"
                    />
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">
                  Category
                </h4>
                <Badge className="capitalize">
                  {selectedTemplate?.category}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setPreviewDialogOpen(false);
                if (selectedTemplate) openApplyDialog(selectedTemplate);
              }}
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
            <DialogDescription>
              Select a card to apply &quot;{selectedTemplate?.name}&quot;
              template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedCardId} onValueChange={setSelectedCardId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a card" />
              </SelectTrigger>
              <SelectContent>
                {userCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.firstName} {card.lastName} ({card.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userCards.length === 0 && (
              <p className="text-sm text-gray-500">
                You need to create a card first before applying a template.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApplyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyTemplate}
              disabled={!selectedCardId || applying}
            >
              {applying ? 'Applying...' : 'Apply Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateCard({
  template,
  onPreview,
  onApply,
}: {
  template: Template;
  onPreview: (template: Template) => void;
  onApply: (template: Template) => void;
}) {
  const CategoryIcon =
    categoryIcons[template.category] || categoryIcons.default;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
        {template.previewImage ? (
          <img
            src={template.previewImage}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-white text-center">
            <CategoryIcon className="h-12 w-12 mx-auto mb-2 opacity-80" />
            <p className="text-sm opacity-80">Preview</p>
          </div>
        )}
        {template.isFeatured && (
          <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
            <Star className="h-3 w-3 mr-1 fill-white" />
            Featured
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            <CategoryIcon className="h-3 w-3 mr-1" />
            {template.category}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onPreview(template)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={() => onApply(template)}>
            <Check className="h-4 w-4 mr-1" />
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
}
