import { Test, TestingModule } from '@nestjs/testing';
import { ExperimentsService } from './experiments.service';
import { ExperimentsRepository } from './experiments.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExperimentsService', () => {
  let service: ExperimentsService;
  let repository: ExperimentsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentsService,
        {
          provide: ExperimentsRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAssignment: jest.fn(),
            createAssignment: jest.fn(),
            createEvent: jest.fn(),
            getExperimentResults: jest.fn(),
            getEventBreakdown: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExperimentsService>(ExperimentsService);
    repository = module.get<ExperimentsRepository>(ExperimentsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExperiment', () => {
    it('should create an experiment with valid data', async () => {
      const experimentData = {
        name: 'Test Experiment',
        description: 'Test Description',
        targetPath: '/test',
        variants: { control: 50, variant: 50 },
        conversionGoal: 'click',
        createdBy: 'user1',
      };

      const createdExperiment = {
        id: 'exp1',
        ...experimentData,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(repository, 'create').mockResolvedValue(createdExperiment as any);

      const result = await service.createExperiment(experimentData);

      expect(result).toEqual(createdExperiment);
      expect(repository.create).toHaveBeenCalledWith(experimentData);
    });

    it('should throw BadRequestException if variant weights are invalid', async () => {
      const experimentData = {
        name: 'Test Experiment',
        targetPath: '/test',
        variants: { control: -50, variant: 50 },
        conversionGoal: 'click',
        createdBy: 'user1',
      };

      await expect(service.createExperiment(experimentData)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if less than 2 variants', async () => {
      const experimentData = {
        name: 'Test Experiment',
        targetPath: '/test',
        variants: { control: 100 },
        conversionGoal: 'click',
        createdBy: 'user1',
      };

      await expect(service.createExperiment(experimentData)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('assignVariant', () => {
    it('should return existing assignment if found', async () => {
      const experiment = {
        id: 'exp1',
        status: 'ACTIVE',
        variants: { control: 50, variant: 50 },
      };

      const existingAssignment = {
        id: 'assign1',
        experimentId: 'exp1',
        sessionId: 'session1',
        variant: 'control',
        assignedAt: new Date(),
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);
      jest
        .spyOn(repository, 'findAssignment')
        .mockResolvedValue(existingAssignment as any);

      const result = await service.assignVariant('exp1', 'session1');

      expect(result).toEqual(existingAssignment);
      expect(repository.createAssignment).not.toHaveBeenCalled();
    });

    it('should create new assignment if none exists', async () => {
      const experiment = {
        id: 'exp1',
        status: 'ACTIVE',
        variants: { control: 50, variant: 50 },
      };

      const newAssignment = {
        id: 'assign1',
        experimentId: 'exp1',
        sessionId: 'session1',
        variant: 'control',
        assignedAt: new Date(),
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);
      jest.spyOn(repository, 'findAssignment').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createAssignment')
        .mockResolvedValue(newAssignment as any);

      const result = await service.assignVariant('exp1', 'session1');

      expect(result).toEqual(newAssignment);
      expect(repository.createAssignment).toHaveBeenCalledWith({
        experimentId: 'exp1',
        userId: undefined,
        sessionId: 'session1',
        variant: expect.any(String),
      });
    });

    it('should throw NotFoundException if experiment is not active', async () => {
      const experiment = {
        id: 'exp1',
        status: 'DRAFT',
        variants: { control: 50, variant: 50 },
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);

      await expect(
        service.assignVariant('exp1', 'session1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startExperiment', () => {
    it('should start a draft experiment', async () => {
      const experiment = {
        id: 'exp1',
        status: 'DRAFT',
      };

      const updatedExperiment = {
        ...experiment,
        status: 'ACTIVE',
        startDate: new Date(),
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue(updatedExperiment as any);

      const result = await service.startExperiment('exp1');

      expect(result.status).toBe('ACTIVE');
      expect(repository.update).toHaveBeenCalledWith('exp1', {
        status: 'ACTIVE',
        startDate: expect.any(Date),
      });
    });

    it('should throw BadRequestException if experiment is already active', async () => {
      const experiment = {
        id: 'exp1',
        status: 'ACTIVE',
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);

      await expect(service.startExperiment('exp1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('pauseExperiment', () => {
    it('should pause an active experiment', async () => {
      const experiment = {
        id: 'exp1',
        status: 'ACTIVE',
      };

      const updatedExperiment = {
        ...experiment,
        status: 'PAUSED',
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue(updatedExperiment as any);

      const result = await service.pauseExperiment('exp1');

      expect(result.status).toBe('PAUSED');
    });

    it('should throw BadRequestException if experiment is not active', async () => {
      const experiment = {
        id: 'exp1',
        status: 'DRAFT',
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(experiment as any);

      await expect(service.pauseExperiment('exp1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getExperimentResults', () => {
    it('should return experiment results with event breakdown', async () => {
      const results = {
        experiment: {
          id: 'exp1',
          name: 'Test Experiment',
        },
        results: [
          {
            variant: 'control',
            assignments: 100,
            conversions: 10,
            conversionRate: 10,
          },
          {
            variant: 'variant',
            assignments: 100,
            conversions: 15,
            conversionRate: 15,
          },
        ],
        totalAssignments: 200,
        totalConversions: 25,
      };

      const eventBreakdown = [
        { variant: 'control', eventType: 'click', count: 50 },
        { variant: 'variant', eventType: 'click', count: 60 },
      ];

      jest
        .spyOn(repository, 'getExperimentResults')
        .mockResolvedValue(results as any);
      jest
        .spyOn(repository, 'getEventBreakdown')
        .mockResolvedValue(eventBreakdown as any);

      const result = await service.getExperimentResults('exp1');

      expect(result).toHaveProperty('experiment');
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('eventBreakdown');
      expect(result.eventBreakdown).toEqual(eventBreakdown);
    });
  });
});
