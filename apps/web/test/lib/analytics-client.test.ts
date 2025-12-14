/**
 * @jest-environment jsdom
 */

import { analyticsClient } from '@/lib/analytics-client';
import { createApiClient } from '@/lib/api-client';

// Mock the API client
jest.mock('@/lib/api-client', () => ({
  createApiClient: jest.fn(),
}));

describe('AnalyticsClient', () => {
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      post: jest.fn().mockResolvedValue({}),
    };
    (createApiClient as jest.Mock).mockReturnValue(mockApiClient);

    // Suppress console.error during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('logSessionStarted', () => {
    it('should send session started event to API', async () => {
      const cardId = 'card-123';

      await analyticsClient.logSessionStarted(cardId);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/analytics/customization/session-started',
        { cardId }
      );
    });

    it('should not throw when API call fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      // Should not throw - analytics failures are non-blocking
      await expect(
        analyticsClient.logSessionStarted('card-123')
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to log session started:',
        expect.any(Error)
      );
    });
  });

  describe('logSessionCompleted', () => {
    it('should send session completed event with minimal payload', async () => {
      const payload = {
        cardId: 'card-123',
      };

      await analyticsClient.logSessionCompleted(payload);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/analytics/customization/session-completed',
        payload
      );
    });

    it('should send session completed event with full payload', async () => {
      const payload = {
        cardId: 'card-123',
        durationSeconds: 180,
        changesCount: 5,
        componentsAdded: 2,
        componentsRemoved: 1,
        templateApplied: true,
        stylingChanged: true,
        customCssChanged: false,
      };

      await analyticsClient.logSessionCompleted(payload);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/analytics/customization/session-completed',
        payload
      );
    });

    it('should not throw when API call fails', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      const payload = {
        cardId: 'card-123',
        durationSeconds: 60,
      };

      // Should not throw - analytics failures are non-blocking
      await expect(
        analyticsClient.logSessionCompleted(payload)
      ).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Failed to log session completed:',
        expect.any(Error)
      );
    });
  });

  describe('non-blocking behavior', () => {
    it('should handle API client creation errors', async () => {
      (createApiClient as jest.Mock).mockImplementation(() => {
        throw new Error('Failed to create client');
      });

      // Should not throw during instantiation
      expect(() => {
        const { analyticsClient: client } = require('@/lib/analytics-client');
        client.logSessionStarted('card-123');
      }).not.toThrow();
    });

    it('should handle network timeouts gracefully', async () => {
      mockApiClient.post.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      await expect(
        analyticsClient.logSessionStarted('card-123')
      ).resolves.not.toThrow();
    });

    it('should handle malformed responses gracefully', async () => {
      mockApiClient.post.mockResolvedValue(null);

      await expect(
        analyticsClient.logSessionStarted('card-123')
      ).resolves.not.toThrow();
    });
  });
});
