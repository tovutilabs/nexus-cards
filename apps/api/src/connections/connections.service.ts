import { Injectable } from '@nestjs/common';
import { ConnectionsRepository, Connection } from './connections.repository';

export interface NetworkNode {
  id: string;
  type: 'user' | 'contact';
  name: string;
  email?: string;
  company?: string;
  avatarUrl?: string;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: 'view' | 'mutual' | 'contact';
  strength: number;
  viewCount?: number;
}

export interface NetworkGraphData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

@Injectable()
export class ConnectionsService {
  constructor(private readonly connectionsRepository: ConnectionsRepository) {}

  async recordCardView(viewerId: string, cardOwnerId: string, metadata?: any): Promise<void> {
    if (viewerId === cardOwnerId) {
      return;
    }

    const connection = await this.connectionsRepository.recordView(
      viewerId,
      cardOwnerId,
      metadata
    );

    const score = this.calculateConnectionStrength(connection);
    await this.connectionsRepository.updateStrengthScore(connection.id, score);
  }

  calculateConnectionStrength(connection: Connection): number {
    const totalViews = connection.viewCountAtoB + connection.viewCountBtoA;
    const daysSinceFirst = Math.floor(
      (Date.now() - connection.firstInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysSinceLast = Math.floor(
      (Date.now() - connection.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let score = 0;

    score += Math.min(totalViews * 5, 40);

    const recencyScore = Math.max(0, 30 - daysSinceLast);
    score += recencyScore;

    if (daysSinceFirst > 0) {
      const frequency = totalViews / daysSinceFirst;
      score += Math.min(frequency * 20, 20);
    }

    if (connection.isMutual) {
      score += 10;
    }

    return Math.min(Math.round(score), 100);
  }

  async getUserConnections(userId: string): Promise<any[]> {
    const connections = await this.connectionsRepository.getUserConnections(userId);

    return connections.map((conn) => {
      const isUserA = conn.userAId === userId;
      const otherUser = isUserA ? (conn as any).userB : (conn as any).userA;
      const viewCount = isUserA ? conn.viewCountAtoB : conn.viewCountBtoA;
      const viewedByOtherCount = isUserA ? conn.viewCountBtoA : conn.viewCountAtoB;

      return {
        id: conn.id,
        user: {
          id: otherUser.id,
          email: otherUser.email,
          firstName: otherUser.profile?.firstName,
          lastName: otherUser.profile?.lastName,
          company: otherUser.profile?.company,
          avatarUrl: otherUser.profile?.avatarUrl,
        },
        isMutual: conn.isMutual,
        viewCount,
        viewedByOtherCount,
        strengthScore: conn.strengthScore,
        firstInteractionDate: conn.firstInteractionDate,
        lastInteractionDate: conn.lastInteractionDate,
      };
    });
  }

  async getMutualConnections(userId: string): Promise<any[]> {
    const connections = await this.connectionsRepository.getMutualConnections(userId);

    return connections.map((conn) => {
      const isUserA = conn.userAId === userId;
      const otherUser = isUserA ? (conn as any).userB : (conn as any).userA;

      return {
        id: conn.id,
        user: {
          id: otherUser.id,
          email: otherUser.email,
          firstName: otherUser.profile?.firstName,
          lastName: otherUser.profile?.lastName,
          company: otherUser.profile?.company,
          avatarUrl: otherUser.profile?.avatarUrl,
        },
        strengthScore: conn.strengthScore,
        firstInteractionDate: conn.firstInteractionDate,
        lastInteractionDate: conn.lastInteractionDate,
      };
    });
  }

  async getTopConnections(userId: string, limit: number = 10): Promise<any[]> {
    const connections = await this.connectionsRepository.getTopConnections(userId, limit);

    return connections.map((conn) => {
      const isUserA = conn.userAId === userId;
      const otherUser = isUserA ? (conn as any).userB : (conn as any).userA;

      return {
        id: conn.id,
        user: {
          id: otherUser.id,
          email: otherUser.email,
          firstName: otherUser.profile?.firstName,
          lastName: otherUser.profile?.lastName,
          company: otherUser.profile?.company,
          avatarUrl: otherUser.profile?.avatarUrl,
        },
        strengthScore: conn.strengthScore,
        isMutual: conn.isMutual,
      };
    });
  }

  async getNetworkGraphData(userId: string): Promise<NetworkGraphData> {
    const connections = await this.connectionsRepository.getUserConnections(userId);

    const nodes: NetworkNode[] = [{
      id: userId,
      type: 'user' as const,
      name: 'You',
    }];

    const edges: NetworkEdge[] = [];

    const addedUserIds = new Set<string>([userId]);

    for (const conn of connections) {
      const isUserA = conn.userAId === userId;
      const otherUser = isUserA ? (conn as any).userB : (conn as any).userA;

      if (!addedUserIds.has(otherUser.id)) {
        nodes.push({
          id: otherUser.id,
          type: 'user' as const,
          name: `${otherUser.profile?.firstName || ''} ${otherUser.profile?.lastName || ''}`.trim() || otherUser.email,
          email: otherUser.email,
          company: otherUser.profile?.company,
          avatarUrl: otherUser.profile?.avatarUrl,
        });
        addedUserIds.add(otherUser.id);
      }

      edges.push({
        source: userId,
        target: otherUser.id,
        type: conn.isMutual ? 'mutual' : 'view',
        strength: conn.strengthScore,
        viewCount: isUserA ? conn.viewCountAtoB : conn.viewCountBtoA,
      });
    }

    return { nodes, edges };
  }
}
