'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CardComponentList } from '@/components/nexus/CardComponentList';
import { ComponentPalette } from '@/components/card-components/ComponentPalette';
import { ComponentEditDialog } from '@/components/nexus/ComponentEditDialog';
import { PhoneMockup } from '@/components/nexus/PhoneMockup';
import { CardComponent, ComponentType } from '@/components/card-components/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createApiClient } from '@/lib/api-client';
import {
  useCardComponents,
  useCreateComponent,
  useDeleteComponent,
  useReorderComponents,
} from '@/hooks/useCardComponents';

interface CardData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string | null;
}

export default function CustomizeCardPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const { toast } = useToast();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<CardComponent | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<'iphone-14' | 'iphone-14-pro' | 'iphone-15' | 'iphone-15-pro-max' | 'samsung-s23' | 'samsung-s24' | 'samsung-fold' | 'pixel-8' | 'ipad-air' | 'ipad-pro' | 'galaxy-tab'>('iphone-15');
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  // Fetch components
  const { data: components = [], isLoading } = useCardComponents(cardId);

  // Fetch card data
  useEffect(() => {
    const loadCard = async () => {
      try {
        const apiClient = createApiClient();
        const data = await apiClient.get<CardData>(`/cards/${cardId}`);
        setCardData(data);
      } catch (error) {
        console.error('Failed to load card:', error);
        toast({
          title: 'Error',
          description: 'Failed to load card data',
          variant: 'destructive',
        });
        router.push('/dashboard/cards');
      } finally {
        setLoadingCard(false);
      }
    };
    loadCard();
  }, [cardId, router, toast]);

  // Mutations
  const createComponent = useCreateComponent(cardId);
  const deleteComponent = useDeleteComponent(cardId);
  const reorderComponents = useReorderComponents(cardId);
  
  // Generic update mutation - we'll pass componentId dynamically
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async ({ componentId, updates }: { componentId: string; updates: any }) => {
      const response = await fetch(
        `/api/cards/${cardId}/components/${componentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) throw new Error('Failed to update component');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-components', cardId] });
    },
  });

  const handleAddComponent = async (type: ComponentType) => {
    try {
      await createComponent.mutateAsync({
        type,
        enabled: true,
        config: {},
      });
      toast({
        title: 'Component added',
        description: 'The component has been added to your card.',
      });
      setPaletteOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add component',
        variant: 'destructive',
      });
    }
  };

  const handleEditComponent = (component: CardComponent) => {
    setEditingComponent(component);
  };

  const handleSaveComponent = async (componentId: string, updates: Partial<CardComponent>) => {
    try {
      await updateMutation.mutateAsync({ componentId, updates });
      toast({
        title: 'Changes saved',
        description: 'Your component has been updated.',
      });
      setEditingComponent(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update component',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!confirm('Are you sure you want to delete this component?')) return;

    try {
      await deleteComponent.mutateAsync(componentId);
      toast({
        title: 'Component deleted',
        description: 'The component has been removed from your card.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete component',
        variant: 'destructive',
      });
    }
  };

  const handleToggleEnabled = async (componentId: string, enabled: boolean) => {
    try {
      await updateMutation.mutateAsync({ componentId, updates: { enabled } });
      toast({
        title: enabled ? 'Component enabled' : 'Component disabled',
        description: `The component is now ${enabled ? 'visible' : 'hidden'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle component',
        variant: 'destructive',
      });
    }
  };

  const handleReorder = async (componentOrders: Array<{ id: string; order: number }>) => {
    try {
      await reorderComponents.mutateAsync({ components: componentOrders });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder components',
        variant: 'destructive',
      });
    }
  };

  if (isLoading || loadingCard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!cardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Card not found</p>
      </div>
    );
  }

  const enabledComponents = components.filter(c => c.enabled);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Customize Your Card</h1>
          <p className="text-muted-foreground mt-1">
            Add, remove, and arrange components to create your perfect digital card
          </p>
        </div>
        <Button onClick={() => setPaletteOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Component List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Components</h2>
          {components.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No components yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first component
              </p>
              <Button onClick={() => setPaletteOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>
          ) : (
            <CardComponentList
              components={components}
              cardData={cardData}
              isEditable={true}
              onReorder={handleReorder}
              onEdit={handleEditComponent}
              onDelete={handleDeleteComponent}
              onToggleEnabled={handleToggleEnabled}
            />
          )}
        </div>

        {/* Right Column: Live Preview */}
        <div className="space-y-4 sticky top-8 h-fit">
          <h2 className="text-xl font-semibold">Live Preview</h2>
          
          {/* Device Selector */}
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Device:</span>
            <Select value={selectedDevice} onValueChange={(value: any) => setSelectedDevice(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>iPhone</SelectLabel>
                  <SelectItem value="iphone-14">iPhone 14</SelectItem>
                  <SelectItem value="iphone-14-pro">iPhone 14 Pro</SelectItem>
                  <SelectItem value="iphone-15">iPhone 15</SelectItem>
                  <SelectItem value="iphone-15-pro-max">iPhone 15 Pro Max</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Samsung</SelectLabel>
                  <SelectItem value="samsung-s23">Galaxy S23</SelectItem>
                  <SelectItem value="samsung-s24">Galaxy S24</SelectItem>
                  <SelectItem value="samsung-fold">Galaxy Z Fold</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Google</SelectLabel>
                  <SelectItem value="pixel-8">Pixel 8</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Tablets</SelectLabel>
                  <SelectItem value="ipad-air">iPad Air</SelectItem>
                  <SelectItem value="ipad-pro">iPad Pro</SelectItem>
                  <SelectItem value="galaxy-tab">Galaxy Tab</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Device Mockup with Preview */}
          <div className="flex justify-center">
            <PhoneMockup variant={selectedDevice} deviceColor="black">
              <div className="h-full overflow-y-auto">
                {enabledComponents.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center p-8">
                    <p className="text-sm text-muted-foreground">
                      Enable components using the eye icon to see them here
                    </p>
                  </div>
                ) : (
                  <CardComponentList
                    components={enabledComponents}
                    cardData={cardData}
                    isEditable={false}
                  />
                )}
              </div>
            </PhoneMockup>
          </div>
        </div>
      </div>

      <ComponentPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        userTier="PREMIUM"
        onAddComponent={handleAddComponent}
        disabledTypes={components.map(c => c.type)}
      />

      <ComponentEditDialog
        component={editingComponent}
        open={!!editingComponent}
        onOpenChange={(open) => !open && setEditingComponent(null)}
        onSave={handleSaveComponent}
      />
    </div>
  );
}
