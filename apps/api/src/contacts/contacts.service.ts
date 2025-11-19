import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ContactsRepository } from './contacts.repository';
import { CardsRepository } from '../cards/cards.repository';
import { UsersService } from '../users/users.service';
import { SubmitContactDto } from './dto/submit-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

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

  async getUserContacts(userId: string) {
    return this.contactsRepository.findByUserId(userId);
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

  async exportContacts(userId: string, format: 'VCF' | 'CSV') {
    const contacts = await this.contactsRepository.findByUserId(userId);

    if (format === 'VCF') {
      return this.generateVCF(contacts);
    } else if (format === 'CSV') {
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
      'Notes',
      'Job Title',
      'Exchanged At',
    ];
    const rows = contacts.map((contact) => [
      this.escapeCsvValue(contact.firstName),
      this.escapeCsvValue(contact.lastName),
      this.escapeCsvValue(contact.email || ''),
      this.escapeCsvValue(contact.phone || ''),
      this.escapeCsvValue(contact.company || ''),
      this.escapeCsvValue(contact.notes || ''),
      this.escapeCsvValue(contact.jobTitle || ''),
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
