import { Injectable, NotFoundException } from '@nestjs/common';
import { ExperimentsRepository } from './experiments.repository';

@Injectable()
export class ExperimentsService {
  constructor(private readonly experimentsRepository: ExperimentsRepository) {}

  async getExperiment(id: string) {
    const experiment = await this.experimentsRepository.findById(id);
    if (!experiment) {
      throw new NotFoundException(`Experiment ${id} not found`);
    }

    if (experiment.status !== 'ACTIVE') {
      throw new NotFoundException(`Experiment ${id} is not active`);
    }

    return experiment;
  }

  async assignVariant(
    experimentId: string,
    sessionId: string,
    userId?: string
  ) {
    const experiment = await this.getExperiment(experimentId);

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
    await this.getExperiment(params.experimentId);

    return this.experimentsRepository.createEvent({
      experimentId: params.experimentId,
      userId: params.userId,
      sessionId: params.sessionId,
      variant: params.variant,
      eventType: params.eventType,
      metadata: params.metadata || {},
    });
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
