import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ExperimentsRepository } from './experiments.repository';
import { ExperimentStatus } from '@prisma/client';

@Injectable()
export class ExperimentsService {
  constructor(private readonly experimentsRepository: ExperimentsRepository) {}

  async getAllExperiments(params?: {
    status?: ExperimentStatus;
    skip?: number;
    take?: number;
  }) {
    return this.experimentsRepository.findAll(params);
  }

  async getExperiment(id: string) {
    const experiment = await this.experimentsRepository.findById(id);
    if (!experiment) {
      throw new NotFoundException(`Experiment ${id} not found`);
    }

    return experiment;
  }

  async getActiveExperiment(id: string) {
    const experiment = await this.experimentsRepository.findById(id);
    if (!experiment) {
      throw new NotFoundException(`Experiment ${id} not found`);
    }

    if (experiment.status !== 'ACTIVE') {
      throw new NotFoundException(`Experiment ${id} is not active`);
    }

    return experiment;
  }

  async createExperiment(data: {
    name: string;
    description?: string;
    targetPath: string;
    variants: Record<string, number>;
    conversionGoal: string;
    createdBy: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const totalWeight = Object.values(data.variants).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight <= 0) {
      throw new BadRequestException('Variant weights must sum to a positive number');
    }

    if (Object.keys(data.variants).length < 2) {
      throw new BadRequestException('Experiment must have at least 2 variants');
    }

    return this.experimentsRepository.create(data);
  }

  async updateExperiment(id: string, data: Partial<{
    name: string;
    description: string;
    variants: Record<string, number>;
    conversionGoal: string;
    startDate: Date;
    endDate: Date;
  }>) {
    const experiment = await this.getExperiment(id);

    if (experiment.status === 'ACTIVE') {
      throw new BadRequestException('Cannot update an active experiment. Pause it first.');
    }

    if (data.variants) {
      const totalWeight = Object.values(data.variants).reduce((sum, weight) => sum + weight, 0);
      if (totalWeight <= 0) {
        throw new BadRequestException('Variant weights must sum to a positive number');
      }

      if (Object.keys(data.variants).length < 2) {
        throw new BadRequestException('Experiment must have at least 2 variants');
      }
    }

    return this.experimentsRepository.update(id, data);
  }

  async startExperiment(id: string) {
    const experiment = await this.getExperiment(id);

    if (experiment.status === 'ACTIVE') {
      throw new BadRequestException('Experiment is already active');
    }

    if (experiment.status === 'COMPLETED') {
      throw new BadRequestException('Cannot restart a completed experiment');
    }

    return this.experimentsRepository.update(id, {
      status: 'ACTIVE',
      startDate: new Date(),
    });
  }

  async pauseExperiment(id: string) {
    const experiment = await this.getExperiment(id);

    if (experiment.status !== 'ACTIVE') {
      throw new BadRequestException('Experiment is not active');
    }

    return this.experimentsRepository.update(id, {
      status: 'PAUSED',
    });
  }

  async completeExperiment(id: string) {
    const experiment = await this.getExperiment(id);

    return this.experimentsRepository.update(id, {
      status: 'COMPLETED',
      endDate: new Date(),
    });
  }

  async deleteExperiment(id: string) {
    const experiment = await this.getExperiment(id);

    if (experiment.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an active experiment. Pause or complete it first.');
    }

    return this.experimentsRepository.delete(id);
  }

  async assignVariant(
    experimentId: string,
    sessionId: string,
    userId?: string
  ) {
    const experiment = await this.getActiveExperiment(experimentId);

    const existingAssignment = await this.experimentsRepository.findAssignment(
      experimentId,
      sessionId,
      userId
    );

    if (existingAssignment) {
      return existingAssignment;
    }

    const variant = this.selectVariant(
      experiment.variants as Record<string, number>
    );

    return this.experimentsRepository.createAssignment({
      experimentId,
      userId,
      sessionId,
      variant,
    });
  }

  async logEvent(params: {
    experimentId: string;
    userId?: string;
    sessionId: string;
    variant: string;
    eventType: string;
    metadata?: Record<string, any>;
  }) {
    await this.getActiveExperiment(params.experimentId);

    return this.experimentsRepository.createEvent({
      experimentId: params.experimentId,
      userId: params.userId,
      sessionId: params.sessionId,
      variant: params.variant,
      eventType: params.eventType,
      metadata: params.metadata || {},
    });
  }

  async getExperimentResults(experimentId: string) {
    const results = await this.experimentsRepository.getExperimentResults(experimentId);
    if (!results) {
      throw new NotFoundException(`Experiment ${experimentId} not found`);
    }

    const eventBreakdown = await this.experimentsRepository.getEventBreakdown(experimentId);

    return {
      ...results,
      eventBreakdown,
    };
  }

  private selectVariant(variants: Record<string, number>): string {
    const total = Object.values(variants).reduce(
      (sum, weight) => sum + weight,
      0
    );
    let random = Math.random() * total;

    for (const [variant, weight] of Object.entries(variants)) {
      random -= weight;
      if (random <= 0) {
        return variant;
      }
    }

    return Object.keys(variants)[0];
  }
}
