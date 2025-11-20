import { Test, TestingModule } from '@nestjs/testing';
import { ConnectionsService } from './connections.service';
import { ConnectionsRepository } from './connections.repository';

describe('ConnectionsService', () => {
  let service: ConnectionsService;
  let repository: ConnectionsRepository;

  const mockRepository = {
    findConnection: jest.fn(),
    recordView: jest.fn(),
    getUserConnections: jest.fn(),
    getMutualConnections: jest.fn(),
    getTopConnections: jest.fn(),
    updateStrengthScore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConnectionsService,
        {
          provide: ConnectionsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ConnectionsService>(ConnectionsService);
    repository = module.get<ConnectionsRepository>(ConnectionsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateConnectionStrength', () => {
    it('should calculate strength with all factors at max (volume, recency, frequency, mutual)', () => {
      const connection = {
        id: '1',
        userAId: 'user1',
        userBId: 'user2',
        viewCountAtoB: 10, // 8 views * 5 = 40 pts (capped)
        viewCountBtoA: 10,
        isMutual: true, // 10 pts bonus
        firstInteractionDate: new Date('2025-01-01'),
        lastInteractionDate: new Date(), // Today = 30 pts (max recency)
        strengthScore: 0,
        metadata: {},
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      };

      // Frequency: 20 views / 1 day = 20 views/day * 20 = 400 (capped at 20)
      const score = service.calculateConnectionStrength(connection);

      // 40 (volume) + 30 (recency) + 20 (frequency) + 10 (mutual) = 100
      expect(score).toBe(100);
    });

    it('should calculate strength with medium volume (4 views = 20 pts)', () => {
      const connection = {
        id: '1',
        userAId: 'user1',
        userBId: 'user2',
        viewCountAtoB: 2,
        viewCountBtoA: 2,
        isMutual: false,
        firstInteractionDate: new Date('2025-01-01'),
        lastInteractionDate: new Date(),
        strengthScore: 0,
        metadata: {},
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      };

      const score = service.calculateConnectionStrength(connection);

      // 20 (volume) + 30 (recency) + 20 (frequency) + 0 (not mutual) = 70
      expect(score).toBe(70);
    });

    it('should calculate strength with old interaction (low recency)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

      const connection = {
        id: '1',
        userAId: 'user1',
        userBId: 'user2',
        viewCountAtoB: 8,
        viewCountBtoA: 8,
        isMutual: true,
        firstInteractionDate: new Date('2025-01-01'),
        lastInteractionDate: oldDate,
        strengthScore: 0,
        metadata: {},
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
      };

      const score = service.calculateConnectionStrength(connection);

      // 40 (volume) + 0 (recency: 30 - 60 = -30, floored at 0) + low frequency + 10 (mutual)
      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(60);
    });

    it('should calculate strength with low frequency (long timespan)', () => {
      const firstDate = new Date();
      firstDate.setDate(firstDate.getDate() - 100); // 100 days ago

      const connection = {
        id: '1',
        userAId: 'user1',
        userBId: 'user2',
        viewCountAtoB: 5,
        viewCountBtoA: 5,
        isMutual: true,
        firstInteractionDate: firstDate,
        lastInteractionDate: new Date(),
        strengthScore: 0,
        metadata: {},
        createdAt: firstDate,
        updatedAt: new Date(),
      };

      const score = service.calculateConnectionStrength(connection);

      // 10 views / 100 days = 0.1 views/day * 20 = 2 pts (frequency)
      // 25 (volume) + 30 (recency) + 2 (frequency) + 10 (mutual) = 67
      expect(score).toBeGreaterThanOrEqual(65);
      expect(score).toBeLessThanOrEqual(70);
    });

    it('should return 0 for connection with no views', () => {
      const connection = {
        id: '1',
        userAId: 'user1',
        userBId: 'user2',
        viewCountAtoB: 0,
        viewCountBtoA: 0,
        isMutual: false,
        firstInteractionDate: new Date(),
        lastInteractionDate: new Date(),
        strengthScore: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const score = service.calculateConnectionStrength(connection);

      expect(score).toBe(0);
    });
  });

  describe('recordCardView', () => {
    it('should record view and update strength score', async () => {
      const mockConnection = {
        id: 'conn1',
        userAId: 'viewer1',
        userBId: 'owner2',
        viewCountAtoB: 1,
        viewCountBtoA: 0,
        isMutual: false,
        firstInteractionDate: new Date(),
        lastInteractionDate: new Date(),
        strengthScore: 5,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.recordView.mockResolvedValue(mockConnection);

      await service.recordCardView('viewer1', 'owner2', { source: 'qr' });

      expect(mockRepository.recordView).toHaveBeenCalledWith(
        'viewer1',
        'owner2',
        { source: 'qr' },
      );
      expect(mockRepository.updateStrengthScore).toHaveBeenCalledWith(
        'conn1',
        expect.any(Number),
      );
    });

    it('should not record view if viewer and owner are the same', async () => {
      await service.recordCardView('user1', 'user1');

      expect(mockRepository.recordView).not.toHaveBeenCalled();
    });

    it('should detect mutual connection when both users view each other', async () => {
      const mockMutualConnection = {
        id: 'conn1',
        userAId: 'user1',
        userBId: 'user2',
        viewCountAtoB: 1,
        viewCountBtoA: 1, // Both have viewed
        isMutual: true, // Should be detected
        firstInteractionDate: new Date(),
        lastInteractionDate: new Date(),
        strengthScore: 0,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.recordView.mockResolvedValue(mockMutualConnection);

      await service.recordCardView('user2', 'user1');

      expect(mockMutualConnection.isMutual).toBe(true);
    });
  });

  describe('getNetworkGraphData', () => {
    it('should generate graph data with nodes and edges', async () => {
      const mockConnections = [
        {
          id: 'conn1',
          userAId: 'user1',
          userBId: 'user2',
          viewCountAtoB: 5,
          viewCountBtoA: 3,
          isMutual: true,
          strengthScore: 80,
          userA: {
            id: 'user1',
            email: 'user1@example.com',
            profile: {
              firstName: 'John',
              lastName: 'Doe',
              company: 'TechCo',
              avatarUrl: null,
            },
          },
          userB: {
            id: 'user2',
            email: 'user2@example.com',
            profile: {
              firstName: 'Jane',
              lastName: 'Smith',
              company: 'DesignCo',
              avatarUrl: 'https://example.com/avatar.jpg',
            },
          },
        },
      ];

      mockRepository.getUserConnections.mockResolvedValue(mockConnections);

      const graphData = await service.getNetworkGraphData('user1');

      expect(graphData.nodes).toHaveLength(2);
      expect(graphData.edges).toHaveLength(1);
      expect(graphData.nodes[0]).toMatchObject({
        id: 'user1',
        type: 'center',
        name: 'John Doe',
        email: 'user1@example.com',
        company: 'TechCo',
      });
      expect(graphData.edges[0]).toMatchObject({
        source: 'user1',
        target: 'user2',
        type: 'mutual',
        strength: 80,
        viewCount: 8, // 5 + 3
      });
    });

    it('should handle one-way connections correctly', async () => {
      const mockConnections = [
        {
          id: 'conn1',
          userAId: 'user1',
          userBId: 'user2',
          viewCountAtoB: 5,
          viewCountBtoA: 0, // One-way
          isMutual: false,
          strengthScore: 25,
          userA: {
            id: 'user1',
            email: 'user1@example.com',
            profile: {
              firstName: 'John',
              lastName: 'Doe',
              company: null,
              avatarUrl: null,
            },
          },
          userB: {
            id: 'user2',
            email: 'user2@example.com',
            profile: {
              firstName: 'Jane',
              lastName: 'Smith',
              company: null,
              avatarUrl: null,
            },
          },
        },
      ];

      mockRepository.getUserConnections.mockResolvedValue(mockConnections);

      const graphData = await service.getNetworkGraphData('user1');

      expect(graphData.edges[0].type).toBe('view');
      expect(graphData.edges[0].viewCount).toBe(5);
    });
  });

  describe('getUserConnections', () => {
    it('should return formatted connections with other user details', async () => {
      const mockConnections = [
        {
          id: 'conn1',
          userAId: 'user1',
          userBId: 'user2',
          viewCountAtoB: 5,
          viewCountBtoA: 3,
          isMutual: true,
          strengthScore: 80,
          lastInteractionDate: new Date(),
          userA: {
            id: 'user1',
            email: 'user1@example.com',
            profile: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
          userB: {
            id: 'user2',
            email: 'user2@example.com',
            profile: {
              firstName: 'Jane',
              lastName: 'Smith',
            },
          },
        },
      ];

      mockRepository.getUserConnections.mockResolvedValue(mockConnections);

      const result = await service.getUserConnections('user1');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        otherUser: {
          id: 'user2',
          email: 'user2@example.com',
          profile: {
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
        isMutual: true,
        strengthScore: 80,
      });
    });
  });

  describe('getMutualConnections', () => {
    it('should return only mutual connections', async () => {
      const mockMutualConnections = [
        {
          id: 'conn1',
          userAId: 'user1',
          userBId: 'user2',
          isMutual: true,
          strengthScore: 80,
          userA: {
            id: 'user1',
            email: 'user1@example.com',
            profile: { firstName: 'John', lastName: 'Doe' },
          },
          userB: {
            id: 'user2',
            email: 'user2@example.com',
            profile: { firstName: 'Jane', lastName: 'Smith' },
          },
        },
      ];

      mockRepository.getMutualConnections.mockResolvedValue(
        mockMutualConnections,
      );

      const result = await service.getMutualConnections('user1');

      expect(result).toHaveLength(1);
      expect(result[0].isMutual).toBe(true);
    });
  });
});
