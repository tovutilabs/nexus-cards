/**
 * Frontend analytics client for tracking customization events
 * Sends events to backend analytics API
 */

import { createApiClient } from './api-client';

export interface CustomizationSessionPayload {
  cardId: string;
  durationSeconds?: number;
  changesCount?: number;
  componentsAdded?: number;
  componentsRemoved?: number;
  templateApplied?: boolean;
  stylingChanged?: boolean;
  customCssChanged?: boolean;
}

class AnalyticsClient {
  private apiClient = createApiClient();

  /**
   * Track customization session start
   */
  async logSessionStarted(cardId: string): Promise<void> {
    try {
      await this.apiClient.post('/analytics/customization/session-started', {
        cardId,
      });
    } catch (error) {
      // Non-blocking - don't throw errors for analytics failures
      console.error('Failed to log session started:', error);
    }
  }

  /**
   * Track customization session completion
   */
  async logSessionCompleted(payload: CustomizationSessionPayload): Promise<void> {
    try {
      await this.apiClient.post('/analytics/customization/session-completed', payload);
    } catch (error) {
      // Non-blocking - don't throw errors for analytics failures
      console.error('Failed to log session completed:', error);
    }
  }
}

export const analyticsClient = new AnalyticsClient();
