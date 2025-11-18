import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NfcTag, Prisma } from '@prisma/client';

@Injectable()
export class NfcRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<NfcTag | null> {
    return this.prisma.nfcTag.findUnique({
      where: { id },
      include: {
        card: {
          include: {
            user: {
              include: {
                profile: true,
                subscription: true,
              },
            },
          },
        },
      },
    });
  }

  async findByUid(uid: string): Promise<NfcTag | null> {
    return this.prisma.nfcTag.findUnique({
      where: { uid },
      include: {
        card: {
          include: {
            user: {
              include: {
                profile: true,
                subscription: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCardId(cardId: string): Promise<NfcTag[]> {
    return this.prisma.nfcTag.findMany({
      where: { cardId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async create(data: Prisma.NfcTagCreateInput): Promise<NfcTag> {
    return this.prisma.nfcTag.create({
      data,
      include: {
        card: true,
      },
    });
  }

  async update(id: string, data: Prisma.NfcTagUpdateInput): Promise<NfcTag> {
    return this.prisma.nfcTag.update({
      where: { id },
      data,
      include: {
        card: true,
      },
    });
  }

  async delete(id: string): Promise<NfcTag> {
    return this.prisma.nfcTag.delete({
      where: { id },
    });
  }

  async associateWithCard(tagId: string, cardId: string): Promise<NfcTag> {
    return this.prisma.nfcTag.update({
      where: { id: tagId },
      data: {
        cardId,
        status: 'ASSOCIATED',
      },
      include: {
        card: true,
      },
    });
  }

  async disassociateFromCard(tagId: string): Promise<NfcTag> {
    return this.prisma.nfcTag.update({
      where: { id: tagId },
      data: {
        cardId: null,
        status: 'UNASSOCIATED',
      },
    });
  }

  async updateLastTapped(id: string): Promise<NfcTag> {
    return this.prisma.nfcTag.update({
      where: { id },
      data: {
        lastTappedAt: new Date(),
      },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.NfcTagWhereInput;
    orderBy?: Prisma.NfcTagOrderByWithRelationInput;
  }): Promise<NfcTag[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.nfcTag.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        card: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
  }

  async count(where?: Prisma.NfcTagWhereInput): Promise<number> {
    return this.prisma.nfcTag.count({ where });
  }

  async assignToUser(tagId: string, userId: string): Promise<NfcTag> {
    return this.prisma.nfcTag.update({
      where: { id: tagId },
      data: {
        assignedUserId: userId,
        status: 'UNASSOCIATED',
      },
      include: {
        card: true,
        assignedUser: {
          include: {
            profile: true,
          },
        },
      },
    });
  }
}
