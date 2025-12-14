import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';

export interface CardTemplate {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  previewImageUrl: string | null;
  minTier: 'FREE' | 'PRO' | 'PREMIUM';
  isArchived: boolean;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const apiClient = createApiClient();
      return apiClient.get<CardTemplate[]>('/templates');
    },
  });
}

export function useApplyTemplate(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const apiClient = createApiClient();
      return apiClient.post(`/cards/${cardId}/apply-template`, {
        templateId,
        preserveContent: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card-styling', cardId] });
    },
  });
}
