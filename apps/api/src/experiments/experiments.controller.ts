import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly experimentsService: ExperimentsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAllExperiments(
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string
  ) {
    return this.experimentsService.getAllExperiments({
      status: status as any,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get(':id')
  async getExperiment(@Param('id') id: string) {
    const experiment = await this.experimentsService.getExperiment(id);

    return {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      variants: experiment.variants as Record<string, number>,
      status: experiment.status,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      targetPath: experiment.targetPath,
      conversionGoal: experiment.conversionGoal,
      _count: experiment._count,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createExperiment(
    @CurrentUser() user: { id: string },
    @Body()
    body: {
      name: string;
      description?: string;
      targetPath: string;
      variants: Record<string, number>;
      conversionGoal: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    const experiment = await this.experimentsService.createExperiment({
      name: body.name,
      description: body.description,
      targetPath: body.targetPath,
      variants: body.variants,
      conversionGoal: body.conversionGoal,
      createdBy: user.id,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

    return experiment;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateExperiment(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      description: string;
      variants: Record<string, number>;
      conversionGoal: string;
      startDate: string;
      endDate: string;
    }>
  ) {
    return this.experimentsService.updateExperiment(id, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async startExperiment(@Param('id') id: string) {
    return this.experimentsService.startExperiment(id);
  }

  @Post(':id/pause')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async pauseExperiment(@Param('id') id: string) {
    return this.experimentsService.pauseExperiment(id);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  async completeExperiment(@Param('id') id: string) {
    return this.experimentsService.completeExperiment(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExperiment(@Param('id') id: string) {
    await this.experimentsService.deleteExperiment(id);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getResults(@Param('id') id: string) {
    return this.experimentsService.getExperimentResults(id);
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
