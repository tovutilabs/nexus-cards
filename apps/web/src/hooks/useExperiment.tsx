'use client';

import { useEffect, useState } from 'react';

interface Variant {
  id: string;
  name: string;
  weight: number;
}

interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  targetPath: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('nexus_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    sessionStorage.setItem('nexus_session_id', sessionId);
  }
  return sessionId;
}

function selectVariant(variants: Variant[]): string {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant.id;
    }
  }

  return variants[0]?.id || 'control';
}

export function useExperiment(experimentId: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        const sessionId = getSessionId();
        const cacheKey = `experiment_${experimentId}_${sessionId}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) {
          setVariant(cached);
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/experiments/${experimentId}`,
          { credentials: 'include' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch experiment');
        }

        const experiment: Experiment = await response.json();

        if (experiment.status !== 'ACTIVE') {
          setVariant('control');
          setLoading(false);
          return;
        }

        const selectedVariant = selectVariant(experiment.variants);

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/experiments/${experimentId}/assign`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              sessionId,
              variant: selectedVariant,
            }),
          }
        );

        localStorage.setItem(cacheKey, selectedVariant);
        setVariant(selectedVariant);
      } catch (error) {
        console.error('Error fetching experiment:', error);
        setVariant('control');
      } finally {
        setLoading(false);
      }
    };

    fetchExperiment();
  }, [experimentId]);

  const trackEvent = async (eventType: string, eventData?: any) => {
    if (!variant) return;

    try {
      const sessionId = getSessionId();
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/experiments/${experimentId}/event`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            sessionId,
            variant,
            eventType,
            eventData,
          }),
        }
      );
    } catch (error) {
      console.error('Error tracking experiment event:', error);
    }
  };

  return { variant, loading, trackEvent };
}

export function ExperimentProvider({
  experimentId,
  children,
}: {
  experimentId: string;
  children: (variant: string | null, trackEvent: (eventType: string, eventData?: any) => Promise<void>) => React.ReactNode;
}) {
  const { variant, loading, trackEvent } = useExperiment(experimentId);

  if (loading) {
    return null;
  }

  return <>{children(variant, trackEvent)}</>;
}
