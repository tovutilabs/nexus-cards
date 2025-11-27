'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CardComponentList } from '@/components/nexus/CardComponentList';
import { ComponentPalette } from '@/components/card-components/ComponentPalette';
import { ComponentEditDialog } from '@/components/nexus/ComponentEditDialog';
import { CardComponent, ComponentType } from '@/components/card-components/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  useCardComponents,
  useCreateComponent,
  useDeleteComponent,
  useReorderComponents,
} from '@/hooks/useCardComponents';

export default function CustomizeCardPage() {
  const params = useParams();
  const cardId = params.id as string;
  const { toast } = useToast();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<CardComponent | null>(null);

  // Fetch components
  const { data: components = [], isLoading } = useCardComponents(cardId);

  // Mutations
  const createComponent = useCreateComponent(cardId);
  const deleteComponent = useDeleteComponent(cardId);
  const reorderComponents = useReorderComponents(cardId);
  
  // Generic update mutation - we'll pass componentId dynamically
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async ({ componentId, updates }: { componentId: string; updates: any }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/cards/${cardId}/components/${componentId}`,
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

  // Mock card data - in real app, fetch from API
  const cardData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    company: 'Acme Inc',
    jobTitle: 'Software Engineer',
    avatarUrl: null,
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
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

      <ComponentPalette
        userTier="FREE"
        onAddComponent={handleAddComponent}
        disabledTypes={[]}
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
