import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ContactSource } from '@nexus-cards/shared';
import { ContactsRepository } from './contacts.repository';
import { CardsRepository } from '../cards/cards.repository';
import { UsersService } from '../users/users.service';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactsDto } from './dto/import-contacts.dto';
import { CreateManualContactDto } from './dto/manual-contact.dto';
import { ExportContactsDto } from './dto/export-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactsRepository: ContactsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly usersService: UsersService
  ) {}

  async submitContact(
    slug: string,
    dto: SubmitContactDto,
    metadata?: Record<string, any>
  ) {
    const card = await this.cardsRepository.findBySlug(slug);
    if (!card) {
      throw new NotFoundException('Card not found');
    }

    if (card.status !== 'PUBLISHED') {
      throw new BadRequestException('This card is not accepting contacts');
    }

    const currentContactCount = await this.contactsRepository.countByUserId(
      card.userId
    );
    await this.usersService.canAddContact(card.userId, currentContactCount);

    return this.contactsRepository.createContact({
      ...dto,
      userId: card.userId,
      cardId: card.id,
      metadata: metadata || {},
    });
  }

  async getUserContacts(
    userId: string,
    filters?: {
      tags?: string[];
      category?: string;
      favoritesOnly?: boolean;
      search?: string;
    }
  ) {
    return this.contactsRepository.findByUserId(userId, filters);
  }

  async createManualContact(userId: string, dto: CreateManualContactDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentContactCount = await this.contactsRepository.countByUserId(userId);
    await this.usersService.canAddContact(userId, currentContactCount);

    // Get user's default card for manual contacts
    const userCards = await this.cardsRepository.findByUserId(userId);
    if (userCards.length === 0) {
      throw new BadRequestException('You must have at least one card to add contacts');
    }

    const defaultCard = userCards.find((c) => c.status === 'PUBLISHED') || userCards[0];

    return this.contactsRepository.createContact({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      company: dto.company,
      notes: dto.notes,
      userId,
      cardId: defaultCard.id,
      tags: dto.tags,
      category: dto.category,
      favorite: dto.favorite,
      source: dto.source || ContactSource.MANUAL,
      metadata: { source: 'manual', createdBy: userId },
    });
  }

  async importContacts(userId: string, dto: ImportContactsDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentContactCount = await this.contactsRepository.countByUserId(userId);
    const newContactCount = currentContactCount + dto.contacts.length;

    await this.usersService.canAddContact(userId, newContactCount);

    // Get user's default card for imported contacts
    const userCards = await this.cardsRepository.findByUserId(userId);
    if (userCards.length === 0) {
      throw new BadRequestException('You must have at least one card to import contacts');
    }

    const defaultCard = userCards.find((c) => c.status === 'PUBLISHED') || userCards[0];

    const imported = [];
    const errors = [];

    for (let i = 0; i < dto.contacts.length; i++) {
      try {
        const contact = await this.contactsRepository.createContact({
          ...dto.contacts[i],
          userId,
          cardId: defaultCard.id,
          tags: dto.tags || [],
          favorite: dto.favorite || false,
          source: ContactSource.IMPORTED,
          metadata: { source: 'import', importedAt: new Date().toISOString() },
        });
        imported.push(contact);
      } catch (error) {
        errors.push({
          row: i + 1,
          data: dto.contacts[i],
          error: error.message,
        });
      }
    }

    return {
      success: imported.length,
      failed: errors.length,
      imported,
      errors,
    };
  }

  async getContactById(id: string, userId: string) {
    const contact = await this.contactsRepository.findById(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.userId !== userId) {
      throw new ForbiddenException('You do not have access to this contact');
    }

    return contact;
  }

  async updateContact(id: string, userId: string, dto: UpdateContactDto) {
    const contact = await this.contactsRepository.findById(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.userId !== userId) {
      throw new ForbiddenException('You do not have access to this contact');
    }

    return this.contactsRepository.updateContact(id, dto);
  }

  async deleteContact(id: string, userId: string) {
    const contact = await this.contactsRepository.findById(id);
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }

    if (contact.userId !== userId) {
      throw new ForbiddenException('You do not have access to this contact');
    }

    await this.contactsRepository.deleteContact(id);
    return { message: 'Contact deleted successfully' };
  }

  async exportContacts(userId: string, dto: ExportContactsDto) {
    const filters = {
      tags: dto.tags,
      category: dto.category,
      favoritesOnly: dto.favoritesOnly,
    };

    const contacts = await this.contactsRepository.findByUserId(userId, filters);

    if (dto.format === 'VCF') {
      return this.generateVCF(contacts);
    } else if (dto.format === 'CSV') {
      return this.generateCSV(contacts);
    }

    throw new BadRequestException('Invalid export format');
  }

  private generateVCF(contacts: any[]): string {
    return contacts
      .map((contact) => {
        const vcf = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${contact.firstName} ${contact.lastName}`,
          `N:${contact.lastName};${contact.firstName};;;`,
          `EMAIL:${contact.email}`,
        ];

        if (contact.phone) {
          vcf.push(`TEL:${contact.phone}`);
        }

        if (contact.company) {
          vcf.push(`ORG:${contact.company}`);
        }

        if (contact.notes) {
          vcf.push(`NOTE:${contact.notes.replace(/\n/g, '\\n')}`);
        }

        vcf.push('END:VCARD');
        return vcf.join('\r\n');
      })
      .join('\r\n\r\n');
  }

  private generateCSV(contacts: any[]): string {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Job Title',
      'Notes',
      'Category',
      'Tags',
      'Favorite',
      'Source',
      'Exchanged At',
    ];
    const rows = contacts.map((contact) => [
      this.escapeCsvValue(contact.firstName),
      this.escapeCsvValue(contact.lastName),
      this.escapeCsvValue(contact.email || ''),
      this.escapeCsvValue(contact.phone || ''),
      this.escapeCsvValue(contact.company || ''),
      this.escapeCsvValue(contact.jobTitle || ''),
      this.escapeCsvValue(contact.notes || ''),
      this.escapeCsvValue(contact.category || ''),
      this.escapeCsvValue(contact.tags?.join('; ') || ''),
      contact.favorite ? 'Yes' : 'No',
      contact.source || 'FORM',
      contact.exchangedAt.toISOString(),
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
