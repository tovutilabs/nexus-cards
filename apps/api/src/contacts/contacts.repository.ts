import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Contact } from '@prisma/client';

@Injectable()
export class ContactsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        userId,
      },
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
    notes?: string;
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
        notes: data.notes,
        userId: data.userId,
        cardId: data.cardId,
        metadata: data.metadata,
      },
    });
  }

  async updateContact(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
    tags?: string[];
  }): Promise<Contact> {
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
