import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CardComponent, ComponentType } from '@/components/card-components/types';

interface CreateComponentDto {
  type: ComponentType;
  order?: number;
  enabled?: boolean;
  config: Record<string, any>;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundImageUrl?: string;
}

interface UpdateComponentDto {
  enabled?: boolean;
  config?: Record<string, any>;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundGradientStart?: string;
  backgroundGradientEnd?: string;
  backgroundImageUrl?: string;
}

interface ReorderComponentsDto {
  components: Array<{ id: string; order: number }>;
}

const API_BASE_URL = '/api';

// Fetch all components for a card
export function useCardComponents(cardId: string) {
  return useQuery<CardComponent[]>({
    queryKey: ['card-components', cardId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}/components`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch components');
      }
      return response.json();
    },
    enabled: !!cardId,
  });
}

// Create a new component
export function useCreateComponent(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateComponentDto) => {
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dto),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create component');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-components', cardId] });
    },
  });
}

// Update a component
export function useUpdateComponent(cardId: string, componentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdateComponentDto) => {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}/components/${componentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(dto),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update component');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-components', cardId] });
    },
  });
}

// Delete a component
export function useDeleteComponent(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (componentId: string) => {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}/components/${componentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete component');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-components', cardId] });
    },
  });
}

// Reorder components
export function useReorderComponents(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: ReorderComponentsDto) => {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}/components/reorder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(dto),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reorder components');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-components', cardId] });
    },
  });
}

// Toggle component enabled state
export function useToggleComponent(cardId: string, componentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch(
        `${API_BASE_URL}/cards/${cardId}/components/${componentId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ enabled }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle component');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-components', cardId] });
    },
  });
}
