import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ExperimentsService } from './experiments.service';

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Get(':id')
  async getExperiment(@Param('id') id: string) {
    const experiment = await this.experimentsService.getExperiment(id);
    if (!experiment) {
      throw new NotFoundException(`Experiment ${id} not found`);
    }

    return {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      variants: experiment.variants as Record<string, number>,
      status: experiment.status,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
    };
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  async assignVariant(
    @Param('id') experimentId: string,
    @Body() body: { userId?: string; sessionId: string }
  ) {
    const { userId, sessionId } = body;

    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }

    const assignment = await this.experimentsService.assignVariant(
      experimentId,
      sessionId,
      userId
    );

    return {
      experimentId: assignment.experimentId,
      variant: assignment.variant,
      assignedAt: assignment.assignedAt,
    };
  }

  @Post(':id/event')
  @HttpCode(HttpStatus.CREATED)
  async logEvent(
    @Param('id') experimentId: string,
    @Body()
    body: {
      userId?: string;
      sessionId: string;
      variant: string;
      eventType: string;
      metadata?: Record<string, any>;
    }
  ) {
    const { userId, sessionId, variant, eventType, metadata } = body;

    if (!sessionId || !variant || !eventType) {
      throw new BadRequestException(
        'sessionId, variant, and eventType are required'
      );
    }

    const event = await this.experimentsService.logEvent({
      experimentId,
      userId,
      sessionId,
      variant,
      eventType,
      metadata,
    });

    return {
      id: event.id,
      experimentId: event.experimentId,
      variant: event.variant,
      eventType: event.eventType,
      timestamp: event.timestamp,
    };
  }
}
