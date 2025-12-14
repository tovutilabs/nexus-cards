import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '@/lib/api-client';

export interface CardStyling {
  backgroundType: 'solid' | 'gradient' | 'image' | null;
  backgroundColor: string | null;
  backgroundImage: string | null;
  layout: 'vertical' | 'horizontal' | 'centered' | 'image-first' | 'compact' | null;
  fontFamily: string | null;
  fontSize: 'sm' | 'md' | 'lg' | null;
  borderRadius: 'soft' | 'rounded' | 'pill' | null;
  shadowPreset: 'none' | 'soft' | 'medium' | 'strong' | null;
  customCss: string | null;
}

export interface UpdateStylingDto {
  backgroundType?: 'solid' | 'gradient' | 'image';
  backgroundColor?: string;
  backgroundImage?: string;
  layout?: 'vertical' | 'horizontal' | 'centered' | 'image-first' | 'compact';
  fontFamily?: string;
  fontSizeScale?: 'sm' | 'md' | 'lg';
  borderRadiusPreset?: 'soft' | 'rounded' | 'pill';
  shadowPreset?: 'none' | 'soft' | 'medium' | 'strong';
}

export function useCardStyling(cardId: string) {
  return useQuery({
    queryKey: ['card-styling', cardId],
    queryFn: async () => {
      const apiClient = createApiClient();
      const card = await apiClient.get<any>(`/cards/${cardId}`);
      
      // If card has a template but no custom CSS, fetch template CSS
      let effectiveCustomCss = card.customCss;
      if (!effectiveCustomCss && card.templateId) {
        try {
          const template = await apiClient.get<any>(`/templates/${card.templateId}`);
          effectiveCustomCss = template.config?.customCss || null;
        } catch (error) {
          console.warn('Failed to fetch template CSS:', error);
        }
      }
      
      return {
        backgroundType: card.backgroundType,
        backgroundColor: card.backgroundColor,
        backgroundImage: card.backgroundImage,
        layout: card.layout,
        fontFamily: card.fontFamily,
        fontSize: card.fontSize,
        borderRadius: card.borderRadius,
        shadowPreset: card.shadowPreset,
        customCss: effectiveCustomCss,
      } as CardStyling;
    },
  });
}

export function useUpdateCardStyling(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateStylingDto) => {
      const apiClient = createApiClient();
      return apiClient.patch(`/cards/${cardId}/styling`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-styling', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}

export function useUpdateCardCustomCss(cardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customCss: string) => {
      const apiClient = createApiClient();
      return apiClient.patch(`/cards/${cardId}/custom-css`, { customCss });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-styling', cardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}
