import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface Connection {
  id: string;
  userAId: string;
  userBId: string;
  isMutual: boolean;
  firstInteractionDate: Date;
  lastInteractionDate: Date;
  viewCountAtoB: number;
  viewCountBtoA: number;
  strengthScore: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConnectionsRepository {
  constructor(private prisma: PrismaService) {}

  async findConnection(userAId: string, userBId: string): Promise<Connection | null> {
    const [smaller, larger] = [userAId, userBId].sort();
    return this.prisma.connection.findUnique({
      where: {
        userAId_userBId: {
          userAId: smaller,
          userBId: larger,
        },
      },
    });
  }

  async createConnection(data: {
    userAId: string;
    userBId: string;
    viewCountAtoB?: number;
    viewCountBtoA?: number;
    metadata?: any;
  }): Promise<Connection> {
    const [smaller, larger] = [data.userAId, data.userBId].sort();
    const isViewFromA = data.userAId === smaller;

    return this.prisma.connection.create({
      data: {
        userAId: smaller,
        userBId: larger,
        viewCountAtoB: isViewFromA ? 1 : 0,
        viewCountBtoA: isViewFromA ? 0 : 1,
        metadata: data.metadata || {},
      },
    });
  }

  async recordView(viewerId: string, viewedUserId: string, metadata?: any): Promise<Connection> {
    const [smaller, larger] = [viewerId, viewedUserId].sort();
    const isViewFromA = viewerId === smaller;

    const existing = await this.findConnection(viewerId, viewedUserId);

    if (existing) {
      const updateData: any = {
        lastInteractionDate: new Date(),
        metadata: metadata ? { ...existing.metadata, ...metadata } : existing.metadata,
      };

      if (isViewFromA) {
        updateData.viewCountAtoB = existing.viewCountAtoB + 1;
      } else {
        updateData.viewCountBtoA = existing.viewCountBtoA + 1;
      }

      const bothHaveViewed = 
        (isViewFromA ? updateData.viewCountAtoB : existing.viewCountAtoB) > 0 &&
        (isViewFromA ? existing.viewCountBtoA : updateData.viewCountBtoA) > 0;

      if (bothHaveViewed) {
        updateData.isMutual = true;
      }

      return this.prisma.connection.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      return this.createConnection({
        userAId: smaller,
        userBId: larger,
        viewCountAtoB: isViewFromA ? 1 : 0,
        viewCountBtoA: isViewFromA ? 0 : 1,
        metadata,
      });
    }
  }

  async getUserConnections(userId: string): Promise<Connection[]> {
    const [asUserA, asUserB] = await Promise.all([
      this.prisma.connection.findMany({
        where: { userAId: userId },
        include: {
          userB: {
            include: {
              profile: true,
            },
          },
        },
      }),
      this.prisma.connection.findMany({
        where: { userBId: userId },
        include: {
          userA: {
            include: {
              profile: true,
            },
          },
        },
      }),
    ]);

    return [...asUserA, ...asUserB];
  }

  async getMutualConnections(userId: string): Promise<Connection[]> {
    const [asUserA, asUserB] = await Promise.all([
      this.prisma.connection.findMany({
        where: { 
          userAId: userId,
          isMutual: true,
        },
        include: {
          userB: {
            include: {
              profile: true,
            },
          },
        },
      }),
      this.prisma.connection.findMany({
        where: { 
          userBId: userId,
          isMutual: true,
        },
        include: {
          userA: {
            include: {
              profile: true,
            },
          },
        },
      }),
    ]);

    return [...asUserA, ...asUserB];
  }

  async updateStrengthScore(connectionId: string, score: number): Promise<Connection> {
    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { strengthScore: score },
    });
  }

  async getTopConnections(userId: string, limit: number = 10): Promise<Connection[]> {
    const [asUserA, asUserB] = await Promise.all([
      this.prisma.connection.findMany({
        where: { userAId: userId },
        include: {
          userB: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { strengthScore: 'desc' },
        take: limit,
      }),
      this.prisma.connection.findMany({
        where: { userBId: userId },
        include: {
          userA: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { strengthScore: 'desc' },
        take: limit,
      }),
    ]);

    return [...asUserA, ...asUserB]
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, limit);
  }
}
