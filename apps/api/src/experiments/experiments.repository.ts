import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, ExperimentStatus } from '@prisma/client';

@Injectable()
export class ExperimentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.experiment.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
            events: true,
          },
        },
      },
    });
  }

  async findAll(params?: {
    status?: ExperimentStatus;
    skip?: number;
    take?: number;
  }) {
    const { status, skip = 0, take = 20 } = params || {};

    const where: Prisma.ExperimentWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [experiments, total] = await Promise.all([
      this.prisma.experiment.findMany({
        where,
        include: {
          _count: {
            select: {
              assignments: true,
              events: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      this.prisma.experiment.count({ where }),
    ]);

    return { experiments, total, skip, take };
  }

  async create(data: {
    name: string;
    description?: string;
    targetPath: string;
    variants: Record<string, number>;
    conversionGoal: string;
    createdBy: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return this.prisma.experiment.create({
      data: {
        name: data.name,
        description: data.description,
        targetPath: data.targetPath,
        variants: data.variants as any,
        conversionGoal: data.conversionGoal,
        createdBy: data.createdBy,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
      },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    status: ExperimentStatus;
    variants: Record<string, number>;
    conversionGoal: string;
    startDate: Date;
    endDate: Date;
  }>) {
    return this.prisma.experiment.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.variants && { variants: data.variants as any }),
        ...(data.conversionGoal && { conversionGoal: data.conversionGoal }),
        ...(data.startDate && { startDate: data.startDate }),
        ...(data.endDate && { endDate: data.endDate }),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.experiment.delete({
      where: { id },
    });
  }

  async findAssignment(
    experimentId: string,
    sessionId: string,
    userId?: string
  ) {
    return this.prisma.experimentAssignment.findFirst({
      where: {
        experimentId,
        sessionId,
        ...(userId && { userId }),
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async createAssignment(data: {
    experimentId: string;
    userId?: string;
    sessionId: string;
    variant: string;
  }) {
    return this.prisma.experimentAssignment.create({
      data,
    });
  }

  async createEvent(data: {
    experimentId: string;
    userId?: string;
    sessionId: string;
    variant: string;
    eventType: string;
    metadata: Record<string, any>;
  }) {
    return this.prisma.experimentEvent.create({
      data: {
        experimentId: data.experimentId,
        sessionId: data.sessionId,
        variant: data.variant,
        eventType: data.eventType,
        eventData: data.metadata,
      },
    });
  }

  async getExperimentResults(experimentId: string) {
    const experiment = await this.findById(experimentId);
    if (!experiment) {
      return null;
    }

    const variants = Object.keys(experiment.variants as Record<string, number>);
    
    const variantStats = await Promise.all(
      variants.map(async (variant) => {
        const [assignments, conversions] = await Promise.all([
          this.prisma.experimentAssignment.count({
            where: {
              experimentId,
              variant,
            },
          }),
          this.prisma.experimentEvent.count({
            where: {
              experimentId,
              variant,
              eventType: experiment.conversionGoal,
            },
          }),
        ]);

        return {
          variant,
          assignments,
          conversions,
          conversionRate: assignments > 0 ? (conversions / assignments) * 100 : 0,
        };
      })
    );

    return {
      experiment,
      results: variantStats,
      totalAssignments: variantStats.reduce((sum, v) => sum + v.assignments, 0),
      totalConversions: variantStats.reduce((sum, v) => sum + v.conversions, 0),
    };
  }

  async getEventBreakdown(experimentId: string) {
    const events = await this.prisma.experimentEvent.groupBy({
      by: ['variant', 'eventType'],
      where: {
        experimentId,
      },
      _count: {
        id: true,
      },
    });

    return events.map((event) => ({
      variant: event.variant,
      eventType: event.eventType,
      count: event._count.id,
    }));
  }
}
