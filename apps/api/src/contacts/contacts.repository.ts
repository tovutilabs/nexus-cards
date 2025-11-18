import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contact, Prisma } from '@prisma/client';

@Injectable()
export class ContactsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        card: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { userId },
      include: {
        card: true,
      },
      orderBy: {
        exchangedAt: 'desc',
      },
    });
  }

  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.prisma.contact.create({
      data,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        card: true,
      },
    });
  }

  async update(id: string, data: Prisma.ContactUpdateInput): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        card: true,
      },
    });
  }

  async delete(id: string): Promise<Contact> {
    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ContactWhereInput;
    orderBy?: Prisma.ContactOrderByWithRelationInput;
  }): Promise<Contact[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.contact.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        card: true,
      },
    });
  }

  async count(where?: Prisma.ContactWhereInput): Promise<number> {
    return this.prisma.contact.count({ where });
  }

  async searchByEmail(userId: string, email: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        userId,
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      include: {
        card: true,
      },
    });
  }

  async searchByName(userId: string, name: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        userId,
        OR: [
          {
            firstName: {
              contains: name,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: name,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        card: true,
      },
    });
  }
}
