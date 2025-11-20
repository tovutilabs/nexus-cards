import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contact } from '@prisma/client';
import { ContactSource } from '@nexus-cards/shared';

@Injectable()
export class ContactsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: { id },
    });
  }

  async findByUserId(
    userId: string,
    filters?: {
      tags?: string[];
      category?: string;
      favoritesOnly?: boolean;
      search?: string;
    }
  ): Promise<Contact[]> {
    const where: any = { userId };

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.favoritesOnly) {
      where.favorite = true;
    }

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: {
        exchangedAt: 'desc',
      },
    });
  }

  async createContact(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    jobTitle?: string;
    notes?: string;
    tags?: string[];
    category?: string;
    favorite?: boolean;
    source?: ContactSource;
    userId: string;
    cardId: string;
    metadata: Record<string, any>;
  }): Promise<Contact> {
    return this.prisma.contact.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company,
        jobTitle: data.jobTitle,
        notes: data.notes,
        tags: data.tags || [],
        category: data.category,
        favorite: data.favorite || false,
        source: data.source || ContactSource.FORM,
        userId: data.userId,
        cardId: data.cardId,
        metadata: data.metadata,
      },
    });
  }

  async updateContact(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      company?: string;
      jobTitle?: string;
      notes?: string;
      tags?: string[];
      category?: string;
      favorite?: boolean;
    }
  ): Promise<Contact> {
    return this.prisma.contact.update({
      where: { id },
      data,
    });
  }

  async deleteContact(id: string): Promise<void> {
    await this.prisma.contact.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.contact.count({
      where: {
        userId,
      },
    });
  }
}
