import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookEventType } from '@prisma/client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: PrismaService;

  const mockWebhook = {
    id: 'webhook-1',
    userId: 'user-1',
    url: 'https://example.com/webhook',
    events: [WebhookEventType.CONTACT_CREATED],
    secret: 'secret-key',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDelivery = {
    id: 'delivery-1',
    webhookSubscriptionId: 'webhook-1',
    eventType: WebhookEventType.CONTACT_CREATED,
    payload: { test: 'data' },
    responseStatus: null,
    responseBody: null,
    attemptCount: 0,
    deliveredAt: null,
    failedAt: null,
    nextRetryAt: null,
    createdAt: new Date(),
  };

  const mockPrisma = {
    webhookSubscription: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    webhookDelivery: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWebhookSubscription', () => {
    it('should create a new webhook subscription with generated secret', async () => {
      mockPrisma.webhookSubscription.create.mockResolvedValue(mockWebhook);

      const result = await service.createWebhookSubscription(
        'user-1',
        'https://example.com/webhook',
        [WebhookEventType.CONTACT_CREATED],
      );

      expect(result).toEqual(mockWebhook);
      expect(mockPrisma.webhookSubscription.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          url: 'https://example.com/webhook',
          events: [WebhookEventType.CONTACT_CREATED],
          secret: expect.any(String),
          isActive: true,
        },
      });
    });
  });

  describe('listSubscriptions', () => {
    it('should return all subscriptions for a user', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([mockWebhook]);

      const result = await service.listSubscriptions('user-1');

      expect(result).toEqual([mockWebhook]);
      expect(mockPrisma.webhookSubscription.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getWebhookSubscription', () => {
    it('should return a webhook subscription', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockWebhook);

      const result = await service.getWebhookSubscription('user-1', 'webhook-1');

      expect(result).toEqual(mockWebhook);
    });

    it('should throw if webhook not found', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(null);

      await expect(
        service.getWebhookSubscription('user-1', 'webhook-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateWebhookSubscription', () => {
    it('should update webhook subscription', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhookSubscription.update.mockResolvedValue({
        ...mockWebhook,
        isActive: false,
      });

      const result = await service.updateWebhookSubscription('user-1', 'webhook-1', {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
      expect(mockPrisma.webhookSubscription.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: { isActive: false },
      });
    });
  });

  describe('deleteWebhookSubscription', () => {
    it('should delete a webhook subscription', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhookSubscription.delete.mockResolvedValue(mockWebhook);

      const result = await service.deleteWebhookSubscription('user-1', 'webhook-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.webhookSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
      });
    });
  });

  describe('getWebhookDeliveries', () => {
    it('should return deliveries for a webhook', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhookDelivery.findMany.mockResolvedValue([mockDelivery]);

      const result = await service.getWebhookDeliveries('user-1', 'webhook-1', 50);

      expect(result).toEqual([mockDelivery]);
      expect(mockPrisma.webhookDelivery.findMany).toHaveBeenCalledWith({
        where: { webhookSubscriptionId: 'webhook-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should throw if webhook not found', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(null);

      await expect(
        service.getWebhookDeliveries('user-1', 'webhook-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('triggerEvent', () => {
    it('should create and send deliveries to all active subscriptions', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([mockWebhook]);
      mockPrisma.webhookDelivery.create.mockResolvedValue(mockDelivery);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.triggerEvent('user-1', WebhookEventType.CONTACT_CREATED, {
        contactId: 'contact-1',
      });

      expect(mockPrisma.webhookDelivery.create).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockWebhook.url,
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Webhook-Signature': expect.any(String),
            'X-Webhook-Id': mockWebhook.id,
          }),
        }),
      );
    });

    it('should handle delivery failures and schedule retries', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([mockWebhook]);
      mockPrisma.webhookDelivery.create.mockResolvedValue(mockDelivery);
      mockPrisma.webhookDelivery.count.mockResolvedValue(0);
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await service.triggerEvent('user-1', WebhookEventType.CONTACT_CREATED, {
        contactId: 'contact-1',
      });

      expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith({
        where: { id: mockDelivery.id },
        data: expect.objectContaining({
          failedAt: expect.any(Date),
          nextRetryAt: expect.any(Date),
        }),
      });
    });

    it('should disable webhook after 10 consecutive failures', async () => {
      mockPrisma.webhookSubscription.findMany.mockResolvedValue([mockWebhook]);
      mockPrisma.webhookDelivery.create.mockResolvedValue(mockDelivery);
      mockPrisma.webhookDelivery.count.mockResolvedValue(10);
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await service.triggerEvent('user-1', WebhookEventType.CONTACT_CREATED, {
        contactId: 'contact-1',
      });

      expect(mockPrisma.webhookSubscription.update).toHaveBeenCalledWith({
        where: { id: mockWebhook.id },
        data: { isActive: false },
      });
    });
  });

  describe('processDeliveryQueue', () => {
    it('should retry pending deliveries', async () => {
      const deliveryWithWebhook = {
        ...mockDelivery,
        webhookSubscription: mockWebhook,
      };

      mockPrisma.webhookDelivery.findMany.mockResolvedValue([deliveryWithWebhook]);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      await service.processDeliveryQueue();

      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith({
        where: { id: mockDelivery.id },
        data: expect.objectContaining({
          deliveredAt: expect.any(Date),
          responseStatus: 200,
        }),
      });
    });

    it('should skip inactive webhooks', async () => {
      const deliveryWithInactiveWebhook = {
        ...mockDelivery,
        webhookSubscription: { ...mockWebhook, isActive: false },
      };

      mockPrisma.webhookDelivery.findMany.mockResolvedValue([deliveryWithInactiveWebhook]);

      await service.processDeliveryQueue();

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('retryDelivery', () => {
    it('should reset delivery and retry', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhookDelivery.findFirst.mockResolvedValue(mockDelivery);
      mockPrisma.webhookDelivery.update.mockResolvedValue(mockDelivery);
      mockedAxios.post.mockResolvedValue({ status: 200, data: {} });

      const result = await service.retryDelivery('user-1', 'webhook-1', 'delivery-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.webhookDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-1' },
        data: {
          failedAt: null,
          nextRetryAt: null,
          attemptCount: 0,
        },
      });
    });

    it('should throw if delivery already succeeded', async () => {
      mockPrisma.webhookSubscription.findFirst.mockResolvedValue(mockWebhook);
      mockPrisma.webhookDelivery.findFirst.mockResolvedValue({
        ...mockDelivery,
        deliveredAt: new Date(),
      });

      await expect(
        service.retryDelivery('user-1', 'webhook-1', 'delivery-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
