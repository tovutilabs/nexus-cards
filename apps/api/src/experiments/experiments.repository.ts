import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExperimentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.experiment.findUnique({
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
}
